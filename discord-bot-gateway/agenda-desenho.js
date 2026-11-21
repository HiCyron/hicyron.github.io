/* 🎨 O desenho da semana: o calendário do reino como imagem.

   O dono achou feio o cartão em texto (21/11), e simples a primeira versão
   desenhada ("as cores podiam ser melhores, achei simples"). Esta é a cara
   da CYRON: o azul-noite, o ciano e o roxo do emblema dela, com brilhos e uma
   órbita, e as barras do jogo em cores vivas, com relevo, o ícone do próprio
   jogo num medalhão e o nome com contorno, como no Kingshot. Os eventos vêm
   separados por seção, como no calendário do jogo (Eventos, Pesca,
   Alquimia, Ofertas).

   O texto vira caminho (opentype.js, como o resto dos desenhos da CYRON): o
   servidor não tem fonte instalada, e o SVG com <text> sairia sem letra.
   Este arquivo só monta o SVG; quem chama passa as fontes já lidas, os
   ícones e o emblema (PNG em base64), e o sharp transforma em PNG. */

const DIA = 86400000;
const LARGURA = 1200, MARGEM = 44, TOPO_DOS_DIAS = 178, TOPO_DAS_SECOES = 262, LINHA = 60, BARRA = 46, SECAO = 40;
const COLUNA = (LARGURA - 2 * MARGEM) / 7;

export const TEXTOS_DO_DESENHO = {
  titulo: "SEMANA DO REINO", fuso: "horário UTC · o dia do jogo vira às 00:00 UTC", rodape: "CYRON · calendário do jogo (mightpulse.com)",
  dias: ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"],
  secoes: { eventos: "EVENTOS", pesca: "PESCA", alquimia: "ALQUIMIA", ofertas: "OFERTAS", outros: "OUTROS" },
};

const diaDe = (ms) => Math.floor(ms / DIA) * DIA;
const dd = (ms) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };

/* A cor da barra (o tom de cima e o de baixo do relevo): batalha em
   vermelho, aliança em verde, ofertas em dourado, alquimia em roxo, pesca em
   verde-água, o resto dos eventos em azul. */
export const CORES = {
  batalha: ["#FF6B57", "#B92F24"], alianca: ["#4ADE80", "#1C8445"], oferta: ["#FFCB4D", "#C9800F"],
  alquimia: ["#C38BFF", "#7434E0"], pesca: ["#34D9C3", "#0E8378"], outro: ["#5EADFF", "#2858D6"],
};
const BATALHAS = new Set(["castelo", "santuario", "swordland", "tri", "vaicomtudo", "duelo"]);
export function tipoDoEvento(e, chave) {
  if (chave && BATALHAS.has(chave)) return "batalha";
  if (chave === "campeonato" || chave === "mobilizacao") return "alianca";
  const c = String(e.categoria || "").toLowerCase();
  if (/deal|oferta/.test(c)) return "oferta";
  if (/alchemy|alquimia/.test(c)) return "alquimia";
  if (/fish|pesca/.test(c) || chave === "pesca") return "pesca";
  return "outro";
}
export function corDoEvento(e, chave) {
  return CORES[tipoDoEvento(e, chave)][0];
}
/* A seção do calendário do jogo onde o evento mora. */
export function secaoDoEvento(e) {
  const c = String(e.categoria || "").toLowerCase();
  if (/deal|oferta/.test(c)) return "ofertas";
  if (/alchemy|alquimia/.test(c)) return "alquimia";
  if (/fish|pesca/.test(c)) return "pesca";
  if (/event/.test(c) || !c) return "eventos";
  return "outros";
}
const ORDEM_DAS_SECOES = ["eventos", "pesca", "alquimia", "ofertas", "outros"];

function caminho(fonte, texto, x, y, tam) {
  return fonte.getPath(String(texto), x, y, tam).toPathData(1);
}
function largura(fonte, texto, tam) {
  return fonte.getAdvanceWidth(String(texto), tam);
}
function caber(fonte, texto, tam, max) {
  let t = String(texto);
  if (largura(fonte, t, tam) <= max) return t;
  while (t.length > 1 && largura(fonte, `${t}…`, tam) > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/* Pura. Os eventos que aparecem na semana que começa em `agora`: os que
   ainda não acabaram e começam antes do fim da janela, em ordem. */
export function eventosDaJanela(eventos, agora, dias = 7) {
  const ini = diaDe(agora), fim = ini + dias * DIA;
  return eventos.filter((e) => e.fim > agora && e.inicio < fim)
    .sort((a, b) => Math.max(a.inicio, ini) - Math.max(b.inicio, ini) || a.fim - b.fim || a.nome.localeCompare(b.nome));
}

/* Brilhos de fundo (estrelinhas de 4 pontas, como na arte da CYRON), em
   lugares fixos: o desenho sai igual toda vez. */
function brilhos(altura) {
  const pontos = [[90, 60, 9, "#7DE3F4"], [1110, 74, 7, "#B99CFF"], [1040, 140, 5, "#FFFFFF"], [150, 150, 5, "#B99CFF"], [600, 28, 4, "#FFFFFF"],
    [60, altura * 0.45, 6, "#7DE3F4"], [1150, altura * 0.38, 8, "#B99CFF"], [1130, altura * 0.72, 5, "#7DE3F4"], [70, altura * 0.8, 7, "#B99CFF"]];
  return pontos.map(([x, y, r, c]) => `<path d="M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r} Z" fill="${c}" fill-opacity="0.75"/>`).join("");
}

/* O SVG da semana. `eventos`: { nome, inicio, fim, categoria, hora? } (ms
   UTC; o nome já na língua da sala). `icones`: Map nome -> PNG em base64.
   `logo`: o emblema da CYRON (PNG em base64). `chaveDe(nome)` diz o evento da
   ficha (para a cor). */
export function desenharSemana({ eventos, agora, reino, fonteTitulo, fonteTexto, icones = new Map(), logo = "", chaveDe = () => null, t = TEXTOS_DO_DESENHO }) {
  const ini = diaDe(agora);
  const lista = eventosDaJanela(eventos, agora);
  const secoes = ORDEM_DAS_SECOES.map((s) => [s, lista.filter((e) => secaoDoEvento(e) === s)]).filter(([, es]) => es.length);
  const altura = TOPO_DAS_SECOES + secoes.reduce((h, [, es]) => h + SECAO + es.length * LINHA, 0) + 76;
  const p = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${LARGURA}" height="${altura}" viewBox="0 0 ${LARGURA} ${altura}">`);
  p.push(`<defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101B3F"/><stop offset="0.5" stop-color="#0C1533"/><stop offset="1" stop-color="#080D22"/></linearGradient>
    <radialGradient id="luzCiano" cx="0.12" cy="0.06" r="0.55"><stop offset="0" stop-color="#2FC9E8" stop-opacity="0.32"/><stop offset="1" stop-color="#2FC9E8" stop-opacity="0"/></radialGradient>
    <radialGradient id="luzRoxa" cx="0.92" cy="0.95" r="0.6"><stop offset="0" stop-color="#8B5CF6" stop-opacity="0.30"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient>
    <linearGradient id="moldura" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FD8F0"/><stop offset="0.5" stop-color="#8E7BFF"/><stop offset="1" stop-color="#C46BFF"/></linearGradient>
    <linearGradient id="titulo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#9BE7F7"/></linearGradient>
    <linearGradient id="hoje" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36C8E6"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient>
    <linearGradient id="colunaHoje" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#36C8E6" stop-opacity="0.16"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0.04"/></linearGradient>
    <linearGradient id="selo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#C46BFF"/></linearGradient>
    <linearGradient id="anel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C7"/><stop offset="0.5" stop-color="#E8B84A"/><stop offset="1" stop-color="#9A6A12"/></linearGradient>
    ${Object.entries(CORES).map(([k, [a, b]]) => `<linearGradient id="cor-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join("")}
    <filter id="sombra" x="-10%" y="-30%" width="120%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dy="4"/><feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="brilhoTitulo" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`);
  /* O fundo: azul-noite, duas luzes, a órbita e os brilhos. */
  p.push(`<rect width="${LARGURA}" height="${altura}" rx="30" fill="url(#fundo)"/>`);
  p.push(`<rect width="${LARGURA}" height="${altura}" rx="30" fill="url(#luzCiano)"/><rect width="${LARGURA}" height="${altura}" rx="30" fill="url(#luzRoxa)"/>`);
  p.push(`<ellipse cx="${LARGURA / 2}" cy="92" rx="520" ry="70" fill="none" stroke="#7DE3F4" stroke-opacity="0.16" stroke-width="2"/>`);
  p.push(`<ellipse cx="${LARGURA / 2}" cy="96" rx="430" ry="52" fill="none" stroke="#B99CFF" stroke-opacity="0.14" stroke-width="2"/>`);
  p.push(brilhos(altura));
  p.push(`<rect x="5" y="5" width="${LARGURA - 10}" height="${altura - 10}" rx="26" fill="none" stroke="url(#moldura)" stroke-width="3.5"/>`);
  p.push(`<rect x="13" y="13" width="${LARGURA - 26}" height="${altura - 26}" rx="20" fill="none" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="1.5"/>`);

  /* O cabeçalho: o emblema da CYRON, o título com brilho, o selo do reino. */
  if (logo) {
    p.push(`<circle cx="${MARGEM + 52}" cy="92" r="56" fill="url(#moldura)" fill-opacity="0.35"/>`);
    p.push(`<image x="${MARGEM}" y="40" width="104" height="104" xlink:href="data:image/png;base64,${logo}" href="data:image/png;base64,${logo}"/>`);
  }
  const tamTitulo = 50, titulo = t.titulo;
  const selo = reino ? `#${reino}` : "", tamSelo = 26;
  const larguraSelo = selo ? largura(fonteTexto, selo, tamSelo) + 34 : 0;
  const larguraTitulo = largura(fonteTitulo, titulo, tamTitulo);
  const xt = (LARGURA - larguraTitulo - (selo ? larguraSelo + 16 : 0)) / 2;
  p.push(`<path d="${caminho(fonteTitulo, titulo, xt, 104, tamTitulo)}" fill="#36C8E6" fill-opacity="0.55" filter="url(#brilhoTitulo)"/>`);
  p.push(`<path d="${caminho(fonteTitulo, titulo, xt, 104, tamTitulo)}" fill="url(#titulo)"/>`);
  if (selo) {
    const xs = xt + larguraTitulo + 16;
    p.push(`<rect x="${xs}" y="68" width="${larguraSelo}" height="46" rx="23" fill="url(#selo)" filter="url(#sombra)"/>`);
    p.push(`<rect x="${xs + 2}" y="70" width="${larguraSelo - 4}" height="20" rx="10" fill="#FFFFFF" fill-opacity="0.18"/>`);
    p.push(`<path d="${caminho(fonteTexto, selo, xs + 17, 101, tamSelo)}" fill="#FFFFFF"/>`);
  }
  const sub = `${dd(ini)} – ${dd(ini + 6 * DIA)}  ·  ${t.fuso}`;
  p.push(`<path d="${caminho(fonteTexto, sub, (LARGURA - largura(fonteTexto, sub, 17)) / 2, 146, 17)}" fill="#A9B8E8"/>`);

  /* As colunas dos dias: hoje em ciano e roxo, com a coluna acesa. */
  const fimDasColunas = altura - 56;
  for (let i = 0; i < 7; i++) {
    const x = MARGEM + i * COLUNA, d = ini + i * DIA, hoje = i === 0;
    if (hoje) p.push(`<rect x="${x + 4}" y="${TOPO_DOS_DIAS + 30}" width="${COLUNA - 8}" height="${fimDasColunas - TOPO_DOS_DIAS - 30}" rx="16" fill="url(#colunaHoje)"/>`);
    if (i) p.push(`<line x1="${x}" y1="${TOPO_DOS_DIAS + 70}" x2="${x}" y2="${fimDasColunas}" stroke="#A9B8E8" stroke-opacity="0.10" stroke-width="1.5" stroke-dasharray="4 6"/>`);
    if (hoje) p.push(`<rect x="${x + 8}" y="${TOPO_DOS_DIAS}" width="${COLUNA - 16}" height="60" rx="18" fill="url(#hoje)" filter="url(#sombra)"/>`);
    else p.push(`<rect x="${x + 8}" y="${TOPO_DOS_DIAS}" width="${COLUNA - 16}" height="60" rx="18" fill="#FFFFFF" fill-opacity="0.06" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1.5"/>`);
    const nome = t.dias[new Date(d).getUTCDay()], data = dd(d);
    p.push(`<path d="${caminho(fonteTexto, nome, x + (COLUNA - largura(fonteTexto, nome, 14)) / 2, TOPO_DOS_DIAS + 23, 14)}" fill="${hoje ? "#FFFFFF" : "#A9B8E8"}" fill-opacity="${hoje ? 0.9 : 1}"/>`);
    p.push(`<path d="${caminho(fonteTexto, data, x + (COLUNA - largura(fonteTexto, data, 21)) / 2, TOPO_DOS_DIAS + 48, 21)}" fill="#FFFFFF"/>`);
  }

  /* As seções e as barras. Começou antes da janela: a ponta esquerda reta;
     segue depois: a ponta direita em seta, como no jogo. */
  let y = TOPO_DAS_SECOES;
  for (const [secao, es] of secoes) {
    const rotulo = t.secoes?.[secao] || secao.toUpperCase();
    p.push(`<rect x="${MARGEM}" y="${y + 10}" width="5" height="20" rx="2.5" fill="url(#hoje)"/>`);
    p.push(`<path d="${caminho(fonteTexto, rotulo, MARGEM + 16, y + 27, 16)}" fill="#DCE5FF" fill-opacity="0.9"/>`);
    const fimRotulo = MARGEM + 16 + largura(fonteTexto, rotulo, 16) + 14;
    p.push(`<line x1="${fimRotulo}" y1="${y + 21}" x2="${LARGURA - MARGEM}" y2="${y + 21}" stroke="#A9B8E8" stroke-opacity="0.18" stroke-width="1.5"/>`);
    y += SECAO;
    for (const e of es) {
      desenharBarra(p, e, y, { ini, fonteTexto, icones, chaveDe });
      y += LINHA;
    }
  }
  if (!lista.length) p.push(`<path d="${caminho(fonteTexto, "—", LARGURA / 2 - 8, TOPO_DAS_SECOES + 30, 22)}" fill="#A9B8E8"/>`);

  const rodape = t.rodape;
  p.push(`<path d="${caminho(fonteTexto, rodape, LARGURA - MARGEM - largura(fonteTexto, rodape, 14), altura - 26, 14)}" fill="#7F8DBF"/>`);
  p.push("</svg>");
  return { svg: p.join("\n"), largura: LARGURA, altura, eventos: lista.length };
}

function desenharBarra(p, e, y, { ini, fonteTexto, icones, chaveDe }) {
  const c0 = Math.max(0, Math.floor((diaDe(e.inicio) - ini) / DIA));
  const c1 = Math.min(6, Math.floor((Math.ceil(e.fim / DIA) * DIA - DIA - ini) / DIA));
  const antes = e.inicio < ini, depois = Math.ceil(e.fim / DIA) * DIA > ini + 7 * DIA;
  const x0 = MARGEM + c0 * COLUNA + (antes ? 0 : 8), x1 = MARGEM + (c1 + 1) * COLUNA - (depois ? 0 : 8);
  const tipo = tipoDoEvento(e, chaveDe(e.nome));
  const r = BARRA / 2, ponta = depois ? 18 : 0, xr = x1 - ponta, yb = y + 7;
  const forma = `M${x0 + (antes ? 0 : r)},${yb} H${xr - (depois ? 0 : r)} ` +
    (depois ? `L${x1},${yb + BARRA / 2} L${xr},${yb + BARRA} ` : `A${r},${r} 0 0 1 ${xr - r},${yb + BARRA} `) +
    `H${x0 + (antes ? 0 : r)} ` + (antes ? `V${yb} Z` : `A${r},${r} 0 0 1 ${x0 + r},${yb} Z`);
  p.push(`<path d="${forma}" fill="url(#cor-${tipo})" stroke="#000000" stroke-opacity="0.35" stroke-width="1.5" filter="url(#sombra)"/>`);
  /* O brilho de cima (o relevo). */
  p.push(`<clipPath id="c${y}"><path d="${forma}"/></clipPath>`);
  p.push(`<rect x="${x0}" y="${yb + 2}" width="${x1 - x0}" height="${BARRA * 0.42}" rx="${r * 0.8}" fill="#FFFFFF" fill-opacity="0.22" clip-path="url(#c${y})"/>`);
  let xt = x0 + 18;
  const icone = icones.get(e.nome);
  const cx = x0 + (antes ? 30 : 26), cy = yb + BARRA / 2;
  if (icone) {
    /* O medalhão: anel dourado, fundo azul-noite, o ícone saindo um pouco
       por cima, como no jogo. */
    p.push(`<circle cx="${cx}" cy="${cy}" r="27" fill="url(#anel)" filter="url(#sombra)"/>`);
    p.push(`<circle cx="${cx}" cy="${cy}" r="23" fill="#0C1533"/>`);
    p.push(`<image x="${cx - 27}" y="${cy - 31}" width="54" height="54" xlink:href="data:image/png;base64,${icone}" href="data:image/png;base64,${icone}"/>`);
    xt = cx + 36;
  }
  /* O nome com contorno escuro (como o texto do jogo); pode passar da barra
     curta: a linha é dele, e o contorno o deixa legível no escuro. */
  const nome = caber(fonteTexto, e.nome, 20, LARGURA - MARGEM - xt - 12);
  const d = caminho(fonteTexto, nome, xt, yb + 31, 20);
  p.push(`<path d="${d}" fill="none" stroke="#0A0F24" stroke-opacity="0.85" stroke-width="4.5" stroke-linejoin="round"/>`);
  p.push(`<path d="${d}" fill="#FFFFFF"/>`);
  if (e.hora) {
    const xh = xt + largura(fonteTexto, nome, 20) + 12;
    const hora = e.hora, w = largura(fonteTexto, hora, 14) + 20;
    if (xh + w < LARGURA - MARGEM) {
      p.push(`<rect x="${xh}" y="${yb + 11}" width="${w}" height="25" rx="12.5" fill="#0A0F24" fill-opacity="0.72" stroke="#7DE3F4" stroke-opacity="0.6" stroke-width="1.2"/>`);
      p.push(`<path d="${caminho(fonteTexto, hora, xh + 10, yb + 29, 14)}" fill="#9BE7F7"/>`);
    }
  }
}
