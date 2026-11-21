/* 📅 A leitura do calendário do jogo pelo print (dono, 21/11: "o menos
   manual possível e mais didático").

   O Kingshot não tem API do calendário, e os sites que preveem as datas se
   contradizem. O que é CERTO é o calendário de eventos dentro do jogo: um
   R4 tira o print (2 ou 3, rolando a tela), segura a mensagem → Apps → "Ler
   calendário", e a CYRON lê. O leitor de imagem que ela já tinha (Azure) só
   lê TEXTO, e o calendário é feito de BARRAS (de que dia a que dia cada
   evento vai). Por isso a leitura vai por um modelo de IA que enxerga
   imagem, no Groq, com a mesma chave da conversa no privado.

   Aqui fica a parte pura: o pedido ao modelo, a leitura da resposta (datas
   do jeito que o jogo mostra: "11/23", mês/dia, com o ano da hora UTC do
   topo do print) e o resumo. Nada é publicado sem um R4 conferir. */

/* O que o modelo responde. Pedir JSON fechado deixa a resposta conferível:
   o que não seguir o formato é descartado, nunca adivinhado. */
export function pedidoDoCalendario(nomesConhecidos = []) {
  return [
    "This is a screenshot of the in-game EVENTS CALENDAR of the mobile game Kingshot (possibly in Portuguese).",
    "Layout: at the top, the current UTC time (\"Hora UTC YYYY-MM-DD HH:MM:SS\"). Below it, a row of 7 day columns, each with a weekday and a date as MM/DD (e.g. \"Sex 11/20\").",
    "Below, section headers (e.g. \"Eventos\", \"Ofertas\", \"Torneio de Pesca\") and colored horizontal BARS. Each bar is one event: it starts at the left edge of the day column where the event starts and ends at the right edge (arrow tip) of the column where it ends.",
    "A bar touching the left edge of the grid started before the first visible day; a bar touching the right edge continues after the last visible day.",
    "Some bars show only an icon or a cut name (\"Confr...\"). Write the text exactly as shown; if the name is cut, write what is visible with \"...\".",
    nomesConhecidos.length ? `Known event names in this game (use one ONLY if the visible text clearly matches): ${nomesConhecidos.join("; ")}.` : "",
    "Answer ONLY with JSON in this exact shape:",
    "{\"utc_now\":\"YYYY-MM-DD HH:MM\",\"days\":[\"MM/DD\",... 7 items],\"events\":[{\"name\":\"text on the bar\",\"section\":\"section header above it\",\"start\":\"MM/DD or BEFORE\",\"end\":\"MM/DD or AFTER\",\"icon_only\":false}]}",
    "\"end\" is the LAST day the bar covers (inclusive). List every bar, top to bottom. Do not invent bars.",
  ].filter(Boolean).join("\n");
}

const DIA = 86400000;

/* Pura. "11/23" no ano da hora UTC do print; virada de ano (print em
   dezembro, evento em janeiro) anda o ano. */
function diaDoPrint(mmdd, base) {
  const m = /^\s*(\d{1,2})\/(\d{1,2})\s*$/.exec(String(mmdd || ""));
  if (!m) return null;
  const mes = Number(m[1]), dia = Number(m[2]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const ano = new Date(base).getUTCFullYear();
  let ms = Date.UTC(ano, mes - 1, dia);
  if (new Date(ms).getUTCDate() !== dia) return null;
  if (ms - base > 180 * DIA) ms = Date.UTC(ano - 1, mes - 1, dia);
  if (base - ms > 180 * DIA) ms = Date.UTC(ano + 1, mes - 1, dia);
  return ms;
}

/* Pura. A resposta do modelo virando eventos com data: { nome, secao,
   inicio, fim, soIcone } -- inicio null = começou antes do print; fim null =
   segue depois dele; fim é o FIM do último dia (00:00 UTC do dia seguinte,
   a virada do jogo). O que não tem nome nem dia legível sai. */
export function lerRespostaDoCalendario(texto, agora = Date.now()) {
  let j;
  try { j = typeof texto === "string" ? JSON.parse(String(texto).replace(/^```(?:json)?|```$/g, "").trim()) : texto; } catch { return null; }
  if (!j || !Array.isArray(j.events)) return null;
  const topo = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(j.utc_now || ""));
  const base = topo ? Date.UTC(+topo[1], +topo[2] - 1, +topo[3], +topo[4], +topo[5]) : agora;
  const eventos = [];
  for (const e of j.events) {
    const nome = String(e?.name || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const antes = /^before$/i.test(String(e?.start || "").trim());
    const depois = /^after$/i.test(String(e?.end || "").trim());
    const inicio = antes ? null : diaDoPrint(e?.start, base);
    const ultimo = depois ? null : diaDoPrint(e?.end, base);
    if (!nome && !e?.icon_only) continue;
    if ((!antes && inicio == null) || (!depois && ultimo == null)) continue;
    const fim = ultimo == null ? null : ultimo + DIA;
    if (inicio != null && fim != null && fim <= inicio) continue;
    eventos.push({ nome: nome || "?", secao: String(e?.section || "").trim().slice(0, 40), inicio, fim, soIcone: !!e?.icon_only });
  }
  return { agora: base, eventos };
}

/* Pura. Os prints se sobrepõem (rolando a tela, a mesma barra aparece em
   dois): junta pelo nome e pelas datas. */
export function juntarLeituras(leituras) {
  const vistos = new Map();
  for (const l of leituras.filter(Boolean)) {
    for (const e of l.eventos) {
      const chave = `${e.nome.toLowerCase()}|${e.inicio}|${e.fim}`;
      if (!vistos.has(chave)) vistos.set(chave, e);
    }
  }
  return [...vistos.values()].sort((a, b) => (a.inicio ?? -Infinity) - (b.inicio ?? -Infinity) || a.nome.localeCompare(b.nome));
}

const DIA_DA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
function dataCurta(ms) {
  const d = new Date(ms);
  return `${DIA_DA_SEMANA[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/* Pura. O resumo para conferir: o que está rolando e o que vem, com o
   intervalo em dias do jogo (UTC). `emoji(nome)` dá o emoji do evento. */
export function resumoDoCalendario(eventos, agora = Date.now(), emoji = () => "▫️") {
  const agoraRola = eventos.filter((e) => (e.inicio == null || e.inicio <= agora) && (e.fim == null || e.fim > agora));
  const vem = eventos.filter((e) => e.inicio != null && e.inicio > agora);
  const linha = (e) => {
    const de = e.inicio == null ? "" : dataCurta(e.inicio);
    const ate = e.fim == null ? "…" : dataCurta(e.fim - DIA);
    const quando = de && de === ate ? de : de ? `${de} → ${ate}` : `até ${ate}`;
    return `${emoji(e.nome)} **${e.nome}**${e.soIcone ? " _(só o ícone)_" : ""} · ${quando}`;
  };
  return [
    ...(agoraRola.length ? ["🔴 **Agora**", ...agoraRola.map(linha)] : []),
    ...(vem.length ? ["", "⏭️ **Vem aí**", ...vem.map(linha)] : []),
  ].join("\n").trim();
}
