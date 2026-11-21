/* 🎨 O desenho da semana: o calendário do reino como imagem.

   O dono achou feio o cartão em texto (21/11: "achei o design muito feio").
   O jogador já conhece o calendário do jogo -- colunas de dias, barras com o
   ícone e o nome --, então a semana sai desenhada assim, nas cores da CYRON:
   fundo escuro, dourado, uma barra por evento, da coluna em que começa até a
   em que termina, com o ícone do próprio jogo (o emoji ev_...).

   O texto vira caminho (opentype.js, como o resto dos desenhos da CYRON): o
   servidor não tem fonte instalada, e o SVG com <text> sairia sem letra.
   Este arquivo só monta o SVG; quem chama passa as fontes já lidas e os
   ícones (PNG em base64), e o sharp transforma em PNG. */

const DIA = 86400000;
const LARGURA = 1200, MARGEM = 40, TOPO_DOS_DIAS = 150, TOPO_DAS_BARRAS = 232, LINHA = 58, BARRA = 44;
const COLUNA = (LARGURA - 2 * MARGEM) / 7;
const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export const TEXTOS_DO_DESENHO = {
  titulo: "SEMANA DO REINO", fuso: "horário UTC · o dia do jogo vira às 00:00 UTC", rodape: "CYRON · calendário do jogo (mightpulse.com)",
  dias: DIAS,
};

const diaDe = (ms) => Math.floor(ms / DIA) * DIA;
const dd = (ms) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };

/* A cor da barra: batalha em vermelho, aliança em verde, ofertas em
   dourado, alquimia em roxo, pesca em verde-água, o resto em azul. */
const CORES = { batalha: "#B8463A", alianca: "#3E8E4F", oferta: "#C08A22", alquimia: "#7E4FB8", pesca: "#2C8C86", outro: "#3A73C4" };
const BATALHAS = new Set(["castelo", "santuario", "swordland", "tri", "vaicomtudo", "duelo"]);
export function corDoEvento(e, chave) {
  if (chave && BATALHAS.has(chave)) return CORES.batalha;
  if (chave === "campeonato" || chave === "mobilizacao") return CORES.alianca;
  const c = String(e.categoria || "").toLowerCase();
  if (/deal|oferta/.test(c)) return CORES.oferta;
  if (/alchemy|alquimia/.test(c)) return CORES.alquimia;
  if (/fish|pesca/.test(c) || chave === "pesca") return CORES.pesca;
  return CORES.outro;
}

/* O texto como caminho SVG, e a largura dele. */
function caminho(fonte, texto, x, y, tam) {
  return fonte.getPath(String(texto), x, y, tam).toPathData(1);
}
function largura(fonte, texto, tam) {
  return fonte.getAdvanceWidth(String(texto), tam);
}
/* Corta com … até caber em `max` pixels. */
function caber(fonte, texto, tam, max) {
  let t = String(texto);
  if (largura(fonte, t, tam) <= max) return t;
  while (t.length > 1 && largura(fonte, `${t}…`, tam) > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/* Pura (com as fontes). Os eventos que aparecem na semana que começa em
   `agora`: os que ainda não acabaram e começam antes do fim da janela. Em
   ordem: o que começou antes primeiro, depois pelo começo e pelo nome. */
export function eventosDaJanela(eventos, agora, dias = 7) {
  const ini = diaDe(agora), fim = ini + dias * DIA;
  return eventos.filter((e) => e.fim > agora && e.inicio < fim)
    .sort((a, b) => Math.max(a.inicio, ini) - Math.max(b.inicio, ini) || a.fim - b.fim || a.nome.localeCompare(b.nome));
}

/* O SVG da semana. `eventos`: { nome, inicio, fim, categoria, hora? } (ms
   UTC; o nome já na língua da sala). `icones`: Map nome -> PNG em base64.
   `chaveDe(nome)` diz o evento da ficha (para a cor). */
export function desenharSemana({ eventos, agora, reino, fonteTitulo, fonteTexto, icones = new Map(), chaveDe = () => null, t = TEXTOS_DO_DESENHO }) {
  const ini = diaDe(agora);
  const lista = eventosDaJanela(eventos, agora);
  const altura = TOPO_DAS_BARRAS + Math.max(1, lista.length) * LINHA + 70;
  const partes = [];
  partes.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${LARGURA}" height="${altura}" viewBox="0 0 ${LARGURA} ${altura}">`);
  partes.push(`<defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1D14"/><stop offset="1" stop-color="#120C08"/></linearGradient>
    <linearGradient id="brilho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
    <linearGradient id="ouro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8A6420"/><stop offset="0.5" stop-color="#F0CF7A"/><stop offset="1" stop-color="#8A6420"/></linearGradient>
  </defs>`);
  partes.push(`<rect width="${LARGURA}" height="${altura}" rx="28" fill="url(#fundo)"/>`);
  partes.push(`<rect x="6" y="6" width="${LARGURA - 12}" height="${altura - 12}" rx="24" fill="none" stroke="#C8962E" stroke-opacity="0.75" stroke-width="3"/>`);

  /* O cabeçalho: o título em Cinzel dourado, o fuso embaixo. */
  const titulo = `${t.titulo}${reino ? ` #${reino}` : ""}`;
  const tamTitulo = 46;
  const xt = (LARGURA - largura(fonteTitulo, titulo, tamTitulo)) / 2;
  partes.push(`<path d="${caminho(fonteTitulo, titulo, xt + 2, 84, tamTitulo)}" fill="#000" fill-opacity="0.5"/>`);
  partes.push(`<path d="${caminho(fonteTitulo, titulo, xt, 82, tamTitulo)}" fill="url(#ouro)"/>`);
  const sub = `${dd(ini)} – ${dd(ini + 6 * DIA)} · ${t.fuso}`;
  partes.push(`<path d="${caminho(fonteTexto, sub, (LARGURA - largura(fonteTexto, sub, 18)) / 2, 118, 18)}" fill="#CBB89A"/>`);

  /* As colunas dos dias: hoje em dourado. */
  for (let i = 0; i < 7; i++) {
    const x = MARGEM + i * COLUNA, d = ini + i * DIA, hoje = i === 0;
    if (hoje) partes.push(`<rect x="${x + 3}" y="${TOPO_DOS_DIAS + 66}" width="${COLUNA - 6}" height="${altura - TOPO_DOS_DIAS - 66 - 44}" rx="10" fill="#C8962E" fill-opacity="0.10"/>`);
    else partes.push(`<line x1="${x}" y1="${TOPO_DOS_DIAS + 70}" x2="${x}" y2="${altura - 48}" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="2"/>`);
    partes.push(`<rect x="${x + 8}" y="${TOPO_DOS_DIAS}" width="${COLUNA - 16}" height="58" rx="14" fill="${hoje ? "#C8962E" : "#FFFFFF"}" fill-opacity="${hoje ? 1 : 0.07}"/>`);
    const nome = t.dias[new Date(d).getUTCDay()], data = dd(d);
    partes.push(`<path d="${caminho(fonteTexto, nome, x + (COLUNA - largura(fonteTexto, nome, 15)) / 2, TOPO_DOS_DIAS + 23, 15)}" fill="${hoje ? "#2A1D14" : "#CBB89A"}"/>`);
    partes.push(`<path d="${caminho(fonteTexto, data, x + (COLUNA - largura(fonteTexto, data, 20)) / 2, TOPO_DOS_DIAS + 47, 20)}" fill="${hoje ? "#1A110B" : "#FFFFFF"}"/>`);
  }

  /* Uma barra por evento, da coluna do começo à do fim. Começou antes da
     janela: a ponta esquerda reta; segue depois: a ponta direita em seta. */
  lista.forEach((e, n) => {
    const y = TOPO_DAS_BARRAS + n * LINHA;
    const c0 = Math.max(0, Math.floor((diaDe(e.inicio) - ini) / DIA));
    const c1 = Math.min(6, Math.floor((Math.ceil(e.fim / DIA) * DIA - DIA - ini) / DIA));
    const antes = e.inicio < ini, depois = Math.ceil(e.fim / DIA) * DIA > ini + 7 * DIA;
    const x0 = MARGEM + c0 * COLUNA + (antes ? 0 : 6), x1 = MARGEM + (c1 + 1) * COLUNA - (depois ? 0 : 6);
    const cor = corDoEvento(e, chaveDe(e.nome));
    const r = 12, ponta = depois ? 16 : 0, xr = x1 - ponta;
    const forma = `M${x0 + (antes ? 0 : r)},${y} H${xr - (depois ? 0 : r)} ` +
      (depois ? `L${x1},${y + BARRA / 2} L${xr},${y + BARRA} ` : `Q${xr},${y} ${xr},${y + r} V${y + BARRA - r} Q${xr},${y + BARRA} ${xr - r},${y + BARRA} `) +
      `H${x0 + (antes ? 0 : r)} ` + (antes ? `V${y} Z` : `Q${x0},${y + BARRA} ${x0},${y + BARRA - r} V${y + r} Q${x0},${y} ${x0 + r},${y} Z`);
    partes.push(`<path d="${forma}" transform="translate(0,3)" fill="#000" fill-opacity="0.35"/>`);
    partes.push(`<path d="${forma}" fill="${cor}"/>`);
    partes.push(`<path d="${forma}" fill="url(#brilho)"/>`);
    let xt = x0 + 14;
    const icone = icones.get(e.nome);
    if (icone) {
      partes.push(`<circle cx="${x0 + 30}" cy="${y + BARRA / 2}" r="21" fill="#000" fill-opacity="0.22"/>`);
      partes.push(`<image x="${x0 + 8}" y="${y - 2}" width="46" height="46" xlink:href="data:image/png;base64,${icone}" href="data:image/png;base64,${icone}"/>`);
      xt = x0 + 60;
    }
    /* O nome pode passar da barra (barra de um dia só): a linha é dele, e o
       branco com sombra se lê no escuro também. */
    const max = LARGURA - MARGEM - xt - 10;
    const nome = caber(fonteTexto, e.nome, 19, max);
    partes.push(`<path d="${caminho(fonteTexto, nome, xt + 1.5, y + 30.5, 19)}" fill="#000" fill-opacity="0.55"/>`);
    partes.push(`<path d="${caminho(fonteTexto, nome, xt, y + 29, 19)}" fill="#FFFFFF"/>`);
    if (e.hora) {
      const xh = xt + largura(fonteTexto, nome, 19) + 10;
      const hora = caber(fonteTexto, e.hora, 15, LARGURA - MARGEM - xh);
      if (xh < LARGURA - MARGEM - 40) partes.push(`<path d="${caminho(fonteTexto, hora, xh, y + 28, 15)}" fill="#FFE9B0"/>`);
    }
  });
  if (!lista.length) partes.push(`<path d="${caminho(fonteTexto, "—", LARGURA / 2 - 8, TOPO_DAS_BARRAS + 30, 22)}" fill="#CBB89A"/>`);

  const rodape = t.rodape;
  partes.push(`<path d="${caminho(fonteTexto, rodape, LARGURA - MARGEM - largura(fonteTexto, rodape, 14), altura - 24, 14)}" fill="#8F8270"/>`);
  partes.push("</svg>");
  return { svg: partes.join("\n"), largura: LARGURA, altura, eventos: lista.length };
}

