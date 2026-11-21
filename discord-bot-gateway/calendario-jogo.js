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
  /* Sem _itálico_: o app mostra o texto cru e o "_" aparecia. */
  const linha = (e) => {
    const de = e.inicio == null ? "" : dataCurta(e.inicio);
    const ate = e.fim == null ? "" : dataCurta(e.fim - DIA);
    const quando = !de && !ate ? "a semana toda" : !ate ? `a partir de ${de}` : !de ? `até ${ate}` : de === ate ? de : `${de} → ${ate}`;
    const marca = e.soIcone ? ` (${e.icone ? `ícone: ${e.icone}` : "só o ícone"})` : e.peloIcone ? " (pelo ícone)" : "";
    return e.soIcone ? `❓ **Evento sem nome**${marca} · ${quando}` : `${emoji(e.nome)} **${e.nome}**${marca} · ${quando}`;
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
    assinatura: assinaturaDoIcone(px, b),
  }));
  return { topo, L, R, w, hoje, barras };
}

/* ---------------- o ÍCONE de cada barra ----------------

   O jogo corta o nome da barra curta ("Rally ...", "Camp...") e às vezes só
   mostra o ícone. Mas o mesmo evento tem o mesmo ícone: o "Rally ..." de
   segunda tem a bandeira do "Rally do Herói", o "Camp..." tem o escudo do
   "Campeonato da Aliança". Então a CYRON tira uma ASSINATURA do ícone e
   compara. O ícone é o primeiro desenho da barra, da esquerda para a direita
   (o nome vem depois de um vão); a assinatura é um mosaico 8x8 das cores
   dele, com a cor da barra trocada por cinza. Nos 3 prints do reino 2311, o
   mesmo ícone deu distância até 5,5 e ícones diferentes, 17 ou mais. */
const LADO = 8;
export const ICONE_IGUAL = 9;
function assinaturaDoIcone(px, b) {
  const h = b.y1 - b.y0, ys = [];
  for (let y = b.y0 + Math.round(h * 0.2); y <= b.y1 - Math.round(h * 0.2); y++) ys.push(y);
  const amostra = [];
  for (const y of ys) for (let x = b.x0; x <= b.x1; x += 3) amostra.push(px(x, y));
  const med = (k) => amostra.map((p) => p[k]).sort((a, c) => a - c)[Math.floor(amostra.length / 2)];
  const cor = [med(0), med(1), med(2)];
  const longe = (p) => Math.abs(p[0] - cor[0]) + Math.abs(p[1] - cor[1]) + Math.abs(p[2] - cor[2]) > 90;
  let ini = -1, fim = -1, vazio = 0;
  for (let x = b.x0 + 4; x <= b.x1; x++) {
    let n = 0;
    for (const y of ys) if (longe(px(x, y))) n++;
    if (n >= 0.12 * ys.length) { if (ini < 0) ini = x; fim = x; vazio = 0; }
    else if (ini >= 0 && ++vazio > 8) break;
    if (ini >= 0 && x - ini > 1.3 * h) break;
  }
  if (ini < 0 || fim - ini < 10) return null;
  const larg = fim - ini + 1, ass = [];
  for (let gy = 0; gy < LADO; gy++) {
    for (let gx = 0; gx < LADO; gx++) {
      const s = [0, 0, 0];
      let n = 0;
      const ya = b.y0 + Math.floor(gy * h / LADO), yb = Math.max(b.y0 + Math.floor((gy + 1) * h / LADO), ya + 1);
      const xa = ini + Math.floor(gx * larg / LADO), xb = Math.max(ini + Math.floor((gx + 1) * larg / LADO), xa + 1);
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const p = px(x, y), q = longe(p) ? p : [128, 128, 128];
          s[0] += q[0]; s[1] += q[1]; s[2] += q[2]; n++;
        }
      }
      ass.push(Math.round(s[0] / n), Math.round(s[1] / n), Math.round(s[2] / n));
    }
  }
  return ass;
}

/* Pura. A diferença média entre dois ícones (0 = iguais). */
export function distanciaDosIcones(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

/* O nome do ícone mais parecido, se ele for claramente o mesmo: perto o
   bastante, e sem outro nome quase tão perto. */
function nomeDoIconeParecido(assinatura, candidatos) {
  const porNome = new Map();
  for (const c of candidatos) {
    const d = distanciaDosIcones(assinatura, c.assinatura);
    const k = normal(c.nome);
    if (!porNome.has(k) || d < porNome.get(k).d) porNome.set(k, { nome: c.nome, d });
  }
  const [melhor, segundo] = [...porNome.values()].sort((a, b) => a.d - b.d);
  if (!melhor || melhor.d > ICONE_IGUAL || (segundo && segundo.d < melhor.d + 4)) return null;
  return melhor.nome;
}

function normal(t) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
const CORTADO = /\s*(\.{2,}|…)\s*$/;

/* ---------------- a MEMÓRIA dos nomes ----------------

   O nome inteiro de um evento aparece na semana em que a barra dele é
   comprida; na outra semana, a barra curta mostra "Confr...". A CYRON guarda
   os nomes inteiros que já leu, com o ícone, e usa nas próximas leituras: o
   R4 não precisa ensinar nada. Fica no banco como texto (cyron_ajuste), com
   a assinatura em base64. */
export function lerMemoria(valor) {
  try {
    const lista = JSON.parse(String(valor || "[]"));
    if (!Array.isArray(lista)) return [];
    return lista.filter((m) => m && typeof m.n === "string" && m.n.trim()).map((m) => {
      const bytes = typeof m.a === "string" && m.a ? [...Buffer.from(m.a, "base64")] : [];
      return { nome: m.n, assinatura: bytes.length === LADO * LADO * 3 ? bytes : null };
    });
  } catch { return []; }
}

export function memoriaNova(memoria, aprendidos, teto = 60) {
  const lista = [...aprendidos, ...memoria];
  const vistos = new Set(), fica = [];
  for (const m of lista) {
    const k = normal(m.nome);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    fica.push({ n: m.nome, ...(m.assinatura ? { a: Buffer.from(m.assinatura).toString("base64") } : {}) });
    if (fica.length >= teto) break;
  }
  return JSON.stringify(fica);
}

/* O pedido dos NOMES: a imagem 1 é o topo do calendário (hora UTC e os 7
   dias); a 2 são as faixas recortadas das barras, uma embaixo da outra. */
export function pedidoDosNomes(n, imagensDeFaixas = 1) {
  const onde = imagensDeFaixas > 1 ? `Images 2 to ${imagensDeFaixas + 1} have` : "Image 2 has";
  return [
    "Image 1 is the top of the in-game EVENTS CALENDAR of the mobile game Kingshot (possibly in Portuguese): the current UTC time (\"Hora UTC YYYY-MM-DD HH:MM:SS\") and a row of 7 day columns, each with a weekday and a date as MM/DD.",
    `${onde} ${n} horizontal strips separated by white gaps, top to bottom${imagensDeFaixas > 1 ? " (continuing from one image to the next)" : ""}. Each strip is ONE event bar cut from that calendar: an icon and usually the event name (the name may be cut with "...").`,
    "Answer ONLY with JSON in this exact shape:",
    `{"utc_now":"YYYY-MM-DD HH:MM","days":["MM/DD",... 7 items],"bars":[{"text":"the name exactly as written, letter by letter, or \\"\\" if the strip has only an icon","icon":"what the icon shows, in 1 to 3 words IN PORTUGUESE (e.g. \\"castelo com coroa\\", \\"peixe\\")"}, ... exactly ${n} items, in order]}`,
  ].join("\n");
}

/* Ícone sem nome que não deixa dúvida (o peixe fica embaixo do título
   "Torneio de Pesca"). O castelo NÃO entra: no print do reino 2311, o
   "castelo" que a IA viu era o ícone da "Batalha do...", e o castelo com
   coroa era outro evento. O resto fica com o ícone escrito, para o R4. */
const NOME_PELO_ICONE = [[/fish|peixe|pesca|anzol|\brod\b|\bhook\b/i, "Torneio de Pesca"]];

/* Pura. A resposta dos nomes + as barras medidas = os eventos com data. A
   data de cada coluna vem dos dias que o modelo leu; se eles não fecham (não
   são 7 dias seguidos, ou hoje não cai na coluna verde-água), vem da hora
   UTC e da coluna de hoje. Barra que começa na 1ª coluna: começou ali ou
   antes (o print não diz) -- vira "até ...".

   Nome cortado ("Rally ...") ou só ícone: completa pelo ícone igual ao de
   um nome inteiro (desta leitura ou da memória) e, se não, pelo começo do
   nome, quando só um nome conhecido começa assim. `conhecidos` são os nomes
   dos eventos que a CYRON já explica. Sem certeza, fica como está. */
export function eventosDoCalendario(analises, texto, agora = Date.now(), { memoria = [], conhecidos = [] } = {}) {
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
    const nome = String(n.text || "").replace(/\s+/g, " ").trim().slice(0, 80);
    return {
      nome, icone: String(n.icon || "").trim().slice(0, 40), assinatura: b.assinatura || null,
      cortado: CORTADO.test(nome), lido: !!nome && !CORTADO.test(nome), peloIcone: false, completado: false,
      inicio: b.ini === 0 ? null : dias[b.ini],
      fim: b.depois ? null : dias[b.fim] + DIA,
    };
  }));
  const todas = porPrint.flat();
  const inteiros = todas.filter((e) => e.lido);
  const comIcone = [...inteiros.filter((e) => e.assinatura), ...memoria.filter((m) => m.assinatura)];
  const nomesConhecidos = [...inteiros, ...memoria].map((e) => e.nome).concat(conhecidos);
  /* 1º os cortados (o ícone igual, e o começo tem que bater; ou o único nome
     conhecido que começa assim), depois os sem nome (o ícone igual ao de
     qualquer barra com nome, mesmo cortado: "Batalha do..." é melhor que "?"). */
  for (const e of todas.filter((x) => x.cortado)) {
    const prefixo = normal(e.nome.replace(CORTADO, ""));
    if (prefixo.length < 3) continue;
    const comeca = (nome) => normal(nome).startsWith(prefixo) && normal(nome) !== prefixo;
    const pelo = e.assinatura && nomeDoIconeParecido(e.assinatura, comIcone.filter((c) => comeca(c.nome)));
    const unicos = [...new Map(nomesConhecidos.filter(comeca).map((n) => [normal(n), n])).values()];
    const nome = pelo || (unicos.length === 1 ? unicos[0] : "");
    if (nome) Object.assign(e, { nome, cortado: false, completado: true });
  }
  for (const e of todas.filter((x) => !x.nome)) {
    const pelo = e.assinatura && (nomeDoIconeParecido(e.assinatura, comIcone)
      || nomeDoIconeParecido(e.assinatura, todas.filter((o) => o !== e && o.nome && o.assinatura)));
    const achado = !pelo && NOME_PELO_ICONE.find(([r]) => r.test(e.icone));
    const nome = pelo || (achado ? achado[1] : "");
    if (nome) Object.assign(e, { nome, cortado: CORTADO.test(nome), peloIcone: true });
  }
  for (const e of todas) { e.soIcone = !e.nome; if (!e.nome) e.nome = "?"; }
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
  /* Para a memória: só o que a IA leu inteiro, nunca o que eu completei. */
  const aprendidos = [...new Map(inteiros.map((e) => [normal(e.nome), { nome: e.nome, assinatura: e.assinatura }])).values()];
  return {
    agora: base, eventos, lidos: Math.min(nomes.length, k), esperados: k, aprendidos,
    completados: eventos.filter((e) => e.completado || (e.peloIcone && !e.soIcone && !e.cortado)).length,
  };
}
