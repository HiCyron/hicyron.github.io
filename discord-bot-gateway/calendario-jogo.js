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
  /* Modelo que pensa em voz alta (<think>...</think>) ou embrulha em ```json:
     vale o primeiro objeto JSON da resposta. */
  const limpo = (t) => {
    const sem = String(t).replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/g, "").trim();
    const a = sem.indexOf("{"), b = sem.lastIndexOf("}");
    return a >= 0 && b > a ? sem.slice(a, b + 1) : sem;
  };
  try { j = typeof texto === "string" ? JSON.parse(limpo(texto)) : texto; } catch { return null; }
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
    const marca = e.soIcone ? ` _(${e.icone ? `ícone: ${e.icone}` : "só o ícone"})_` : e.peloIcone ? " _(pelo ícone)_" : "";
    return `${emoji(e.nome)} **${e.nome}**${marca} · ${quando}`;
  };
  return [
    ...(agoraRola.length ? ["🔴 **Agora**", ...agoraRola.map(linha)] : []),
    ...(vem.length ? ["", "⏭️ **Vem aí**", ...vem.map(linha)] : []),
  ].join("\n").trim();
}

/* ---------------- as DATAS pelos pixels ----------------

   O primeiro teste com o Qwen (21/11) acertou os nomes e errou as datas:
   ler a largura de uma barra é onde IA de imagem escorrega ("até sáb" no
   que ia até dom; "só seg" no que seguia depois). Então a CYRON mede as
   barras ela mesma, nos pixels do print, e a IA só lê os nomes.

   O calendário do jogo é regular: fundo bege, a coluna de hoje em verde-água
   (que começa logo na faixa dos dias), 7 colunas iguais, títulos de seção
   em bege-alaranjado claro (matiz ~35°, saturação ~0,5) e as barras em cores
   vivas (amarelo, azul, verde, vermelho) que começam e terminam nas bordas
   das colunas. Conferido nos 3 prints do reino 2311: todas as barras na
   coluna certa. As medidas são para um print de 1080 de largura (o
   index.js redimensiona antes). */

function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return { h: h < 0 ? h + 360 : h, s: mx ? d / mx : 0, v: mx / 255 };
}
const ehVerdeAgua = (r, g, b) => g > 170 && b > 170 && r < 175 && b > r + 30;
const ehBege = (r, g, b) => r > 215 && g > 205 && b > 185 && r - b < 45;
function ehBarra(r, g, b) {
  if (ehVerdeAgua(r, g, b) || Math.max(r, g, b) <= 115) return false;
  const { h, s, v } = hsv(r, g, b);
  if (s <= 0.38) return false;
  return !(h >= 26 && h <= 42 && s < 0.62 && v > 0.84); // título de seção
}

/* Pura. `data` são os pixels crus (sharp .raw()), `C` os canais. Devolve a
   grade (topo, bordas, largura da coluna, a coluna de hoje) e as barras com
   a coluna de começo e de fim -- ou null quando não parece o calendário. */
export function analisarCalendario(data, W, H, C = 3) {
  const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
  let topo = -1, hojeX = -1;
  for (let y = 0; y < H && topo < 0; y++) {
    let seguidos = 0;
    for (let x = 0; x < W; x++) {
      seguidos = ehVerdeAgua(...px(x, y)) ? seguidos + 1 : 0;
      if (seguidos >= W / 12) { topo = y; hojeX = x - seguidos / 2; break; }
    }
  }
  if (topo < 0) return null;
  const esquerdas = [], direitas = [];
  for (let y = topo + 120; y < H - 120; y += 7) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (ehBege(...px(x, y))) { l = x; break; }
    for (let x = W - 1; x >= 0; x--) if (ehBege(...px(x, y))) { r = x; break; }
    if (l >= 0 && r > l + W / 2) { esquerdas.push(l); direitas.push(r); }
  }
  if (esquerdas.length < 5) return null;
  const mediana = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const L = mediana(esquerdas), R = mediana(direitas), w = (R - L + 1) / 7;
  const hoje = Math.min(6, Math.max(0, Math.floor((hojeX - L) / w)));
  /* Cada linha: a maior sequência de pixels de barra (o texto branco e o
     contorno escuro quebram a barra; as partes se juntam abaixo). */
  const linhas = [];
  for (let y = topo + 60; y < H; y++) {
    let melhor = null, ini = -1;
    for (let x = 0; x <= W; x++) {
      const e = x < W && ehBarra(...px(x, y));
      if (e && ini < 0) ini = x;
      if (!e && ini >= 0) { if (x - ini >= 30 && (!melhor || x - ini > melhor[1] - melhor[0])) melhor = [ini, x - 1]; ini = -1; }
    }
    if (melhor) linhas.push({ y, x0: melhor[0], x1: melhor[1] });
  }
  const juntas = [];
  for (const l of linhas) {
    const b = juntas.find((j) => l.y - j.y1 <= 30 && l.x0 <= j.x1 && l.x1 >= j.x0);
    if (b) { b.y1 = l.y; b.x0 = Math.min(b.x0, l.x0); b.x1 = Math.max(b.x1, l.x1); }
    else juntas.push({ y0: l.y, y1: l.y, x0: l.x0, x1: l.x1 });
  }
  const barras = juntas.filter((b) => b.y1 - b.y0 >= 40 && b.x1 - b.x0 >= 60).sort((a, b) => a.y0 - b.y0).map((b) => ({
    ...b,
    ini: Math.min(6, Math.max(0, Math.floor((b.x0 - L + 0.08 * w) / w))),
    fim: Math.min(6, Math.max(0, Math.floor((b.x1 - L - 0.06 * w) / w))),
    depois: b.x1 >= R - 0.1 * w,
  }));
  return { topo, L, R, w, hoje, barras };
}

/* O pedido dos NOMES: a imagem 1 é o topo do calendário (hora UTC e os 7
   dias); a 2 são as faixas recortadas das barras, uma embaixo da outra. */
export function pedidoDosNomes(n, imagensDeFaixas = 1) {
  const onde = imagensDeFaixas > 1 ? `Images 2 to ${imagensDeFaixas + 1} have` : "Image 2 has";
  return [
    "Image 1 is the top of the in-game EVENTS CALENDAR of the mobile game Kingshot (possibly in Portuguese): the current UTC time (\"Hora UTC YYYY-MM-DD HH:MM:SS\") and a row of 7 day columns, each with a weekday and a date as MM/DD.",
    `${onde} ${n} horizontal strips separated by white gaps, top to bottom${imagensDeFaixas > 1 ? " (continuing from one image to the next)" : ""}. Each strip is ONE event bar cut from that calendar: an icon and usually the event name (the name may be cut with "...").`,
    "Answer ONLY with JSON in this exact shape:",
    `{"utc_now":"YYYY-MM-DD HH:MM","days":["MM/DD",... 7 items],"bars":[{"text":"the name exactly as written, or \\"\\" if the strip has only an icon","icon":"the icon in 1 to 3 English words"}, ... exactly ${n} items, in order]}`,
  ].join("\n");
}

/* Ícone sem nome que não deixa dúvida. O resto fica com o ícone escrito, para
   o R4 conferir. */
const NOME_PELO_ICONE = [[/castle|fort|palace/i, "Batalha do Castelo"], [/fish|rod|hook/i, "Torneio de Pesca"]];

/* Pura. A resposta dos nomes + as barras medidas = os eventos com data. A
   data de cada coluna vem dos dias que o modelo leu; se eles não fecham (não
   são 7 dias seguidos, ou hoje não cai na coluna verde-água), vem da hora
   UTC e da coluna de hoje. Barra que começa na 1ª coluna: começou ali ou
   antes (o print não diz) -- vira "até ...". */
export function eventosDoCalendario(analises, texto, agora = Date.now()) {
  let j;
  try {
    const sem = String(texto || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/g, "");
    const a = sem.indexOf("{"), b = sem.lastIndexOf("}");
    j = JSON.parse(a >= 0 && b > a ? sem.slice(a, b + 1) : sem);
  } catch { return null; }
  const topo = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(j?.utc_now || ""));
  const base = topo ? Date.UTC(+topo[1], +topo[2] - 1, +topo[3], +topo[4], +topo[5]) : agora;
  const hojeDia = Math.floor(base / DIA) * DIA;
  const hoje = analises.find(Boolean)?.hoje ?? 0;
  let dias = Array.isArray(j?.days) && j.days.length === 7 ? j.days.map((d) => diaDoPrint(d, base)) : null;
  const seguidos = dias && dias.every((d, i) => d != null && (!i || d - dias[i - 1] === DIA));
  if (!seguidos || dias[hoje] !== hojeDia) dias = Array.from({ length: 7 }, (_, i) => hojeDia + (i - hoje) * DIA);
  const nomes = Array.isArray(j?.bars) ? j.bars : [];
  let k = 0;
  const porPrint = analises.map((an) => (an?.barras || []).map((b) => {
    const n = nomes[k++] || {};
    let nome = String(n.text || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const icone = String(n.icon || "").trim().slice(0, 40);
    let peloIcone = false;
    if (!nome) { const achado = NOME_PELO_ICONE.find(([r]) => r.test(icone)); if (achado) { nome = achado[1]; peloIcone = true; } }
    return {
      nome: nome || "?", icone, soIcone: !nome, peloIcone,
      inicio: b.ini === 0 ? null : dias[b.ini],
      fim: b.depois ? null : dias[b.fim] + DIA,
    };
  }));
  /* Prints que se sobrepõem (rolando a tela) repetem barras; dois eventos de
     nome cortado igual ("Confr..." e "Confr...") no MESMO print são dois.
     Fica, de cada evento, o maior número de vezes que ele aparece num print. */
  const contagem = new Map();
  for (const lista of porPrint) {
    const aqui = new Map();
    for (const e of lista) {
      const chave = `${e.nome.toLowerCase()}|${e.inicio}|${e.fim}`;
      aqui.set(chave, [...(aqui.get(chave) || []), e]);
    }
    for (const [chave, es] of aqui) if ((contagem.get(chave)?.length || 0) < es.length) contagem.set(chave, es);
  }
  const eventos = [...contagem.values()].flat()
    .sort((a, b) => (a.inicio ?? -Infinity) - (b.inicio ?? -Infinity) || a.nome.localeCompare(b.nome));
  return { agora: base, eventos, lidos: Math.min(nomes.length, k), esperados: k };
}
