/* 🃏 A ficha de um herói do Kingshot (/heroi).

   A ideia do dono (16/11): a CYRON fazer parte do dia a dia de quem joga
   esses jogos de estratégia -- e consultar um herói é coisa de todo dia.

   Os DADOS vêm da base aberta da KingshotPro (dados/kingshot-herois.json),
   licença CC-BY-4.0: pode usar, desde que a ficha diga de onde veio -- e o
   rodapé diz. As NOTAS (S, A, B...) são consenso da comunidade, não do jogo;
   nome, geração, raridade e tropa são conferidos em quatro sites.

   O VISUAL é nosso: os emojis ks_* (img/kingshot) foram desenhados para a
   CYRON -- medalhões, chamas de raridade, losangos de tropa, os galhos da
   árvore -- e sobem como emojis do aplicativo, animados onde faz sentido.
   Emoji padrão do Discord ficou de fora: o dono achou feio, e com razão --
   quebra o clima de jogo. */
import { readFileSync } from "node:fs";

const DADOS = JSON.parse(readFileSync(new URL("./dados/kingshot-herois.json", import.meta.url), "utf8"));
export const HEROIS = DADOS.heroes || [];
export const FONTE_DOS_HEROIS = "kingshotpro.com";

export const COR_DA_RARIDADE = { legendary: 0xF0B232, epic: 0xA855F7, rare: 0x3B9CF5 };
const COR_EM_TEXTO = { legendary: "#f0b232", epic: "#a855f7", rare: "#3b9cf5" };
const EMOJI_DA_RARIDADE = { legendary: "ks_fogo_lendario", epic: "ks_fogo_epico", rare: "ks_fogo_raro" };
const EMOJI_DA_TROPA = { infantry: "ks_tropa_infantaria", cavalry: "ks_tropa_cavalaria", archer: "ks_tropa_arqueiro" };
const EMOJI_DA_FUNCAO = { garrison: "ks_guarnicao", rally: "ks_rally", bear: "ks_urso", joiner: "ks_joiner", gathering: "ks_bau" };
const EMOJI_DA_NOTA = { "S+": "ks_nota_splus", S: "ks_nota_s", A: "ks_nota_a", B: "ks_nota_b", C: "ks_nota_c", D: "ks_nota_d", "-": "ks_nota_nada" };
const ORDEM_DAS_NOTAS = ["S+", "S", "A", "B", "C", "D", "-"];

/* Os textos fixos da ficha, em português: o index.js traduz para a língua de
   quem pediu (a mesma conta de sempre, com cache). */
export const TEXTOS_DA_FICHA = {
  tropa: { infantry: "Infantaria", cavalry: "Cavalaria", archer: "Arqueiro" },
  raridade: { legendary: "Lendário", epic: "Épico", rare: "Raro" },
  funcao: { garrison: "Guarnição", rally: "Rally", bear: "Urso", joiner: "Joiner", gathering: "Coleta" },
  gen: "Gen",
  f2p: "Dá para ter sem gastar",
  vip: "Herói VIP: vem com o nível de VIP",
  pago: "Mais fácil para quem investe no jogo",
  sobre: "Sobre",
  dados: "dados",
  naoAchei: "Não conheço esse herói. Comece a digitar o nome e escolha na lista.",
};

/* Pura. Nome sem acento, espaço nem maiúscula: "long fei" acha "Long Fei". */
export function normalizar(t) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function acharHeroi(nome) {
  const n = normalizar(nome);
  return n ? HEROIS.find((h) => normalizar(h.name) === n) || null : null;
}

/* Pura. A lista do autocompletar: quem começa com o que foi digitado vem
   primeiro, depois quem contém; dentro disso, por geração. No máximo 25 (o
   teto do Discord). */
export function sugestoesDeHeroi(texto) {
  const n = normalizar(texto);
  return HEROIS
    .filter((h) => !n || normalizar(h.name).includes(n))
    .sort((a, b) => (normalizar(a.name).startsWith(n) ? 0 : 1) - (normalizar(b.name).startsWith(n) ? 0 : 1) ||
      a.gen - b.gen || a.name.localeCompare(b.name))
    .slice(0, 25)
    .map((h) => ({ name: `${h.name} · Gen ${h.gen}`, value: h.name }));
}

/* Pura. "S", "A"... ou "-" para o que a base marca como "—"/vazio. */
export function notaDaFuncao(v) {
  const t = String(v ?? "").trim().toUpperCase();
  return ORDEM_DAS_NOTAS.includes(t) ? t : "-";
}

/* Pura. As funções da árvore, da nota mais alta para a mais baixa. Herói de
   coleta (geração 0) não luta: a árvore dele é só a coleta. */
export function funcoesDoHeroi(h) {
  if (h.gathering) return [["gathering", notaDaFuncao(h.gathering)]];
  return ["garrison", "rally", "bear", "joiner"]
    .map((k) => [k, notaDaFuncao(h[k])])
    .sort((a, b) => ORDEM_DAS_NOTAS.indexOf(a[1]) - ORDEM_DAS_NOTAS.indexOf(b[1]));
}

/* Pura. A ficha. `e(nome, reserva)` devolve o emoji do aplicativo (ou a
   reserva, enquanto ele não subiu); `t` são os textos já na língua certa,
   mais `melhor` e `sobre` (o melhor uso e a descrição, já traduzidos). Tudo
   na descrição, e não no título: emoji próprio não aparece em título de
   cartão. A nota vem ANTES do nome da função: emoji tem largura fixa, então
   as notas ficam alinhadas em coluna. */
export function fichaDoHeroi(h, { e, t, foto = "attachment://heroi.png" }) {
  const funcoes = funcoesDoHeroi(h);
  const linhas = [
    `${e("ks_brilho", "✨")} **${h.name}**`,
    `${e(EMOJI_DA_TROPA[h.troop], "")} ${t.tropa[h.troop] || h.troop}  │  ${e(`ks_gen_${h.gen}`, "")} ${t.gen} ${h.gen}`,
    `${e(EMOJI_DA_RARIDADE[h.rarity], "")} **${t.raridade[h.rarity] || h.rarity}**`,
    `${e("ks_medalha", "🏅")} **${t.melhor}**`,
    ...funcoes.map(([k, nota], i) =>
      `${e(i === funcoes.length - 1 ? "ks_galho_fim" : "ks_galho", i === funcoes.length - 1 ? "└" : "├")}` +
      `${e(EMOJI_DA_FUNCAO[k], "")} ${e(EMOJI_DA_NOTA[nota], nota === "-" ? "—" : nota)} ${t.funcao[k] || k}`),
    `> ${e("ks_bau", "🎁")} *${h.f2p ? t.f2p : h.vip ? t.vip : t.pago}*`,
    "",
    `${e("ks_pergaminho", "📜")} **${t.sobre}**`,
    t.descricao,
  ];
  return {
    color: COR_DA_RARIDADE[h.rarity] ?? 0x5865F2,
    description: linhas.join("\n").slice(0, 4000),
    ...(foto ? { thumbnail: { url: foto } } : {}),
    footer: { text: `CYRON · ${t.dados}: ${FONTE_DOS_HEROIS}` },
  };
}

/* Pura. A foto no hexágono, com a moldura na cor da raridade e um brilho no
   aro. Sem foto (herói novo, ainda sem imagem), a inicial no lugar. O
   index.js passa isto pelo sharp e anexa como PNG.

   A inicial chega como DESENHO (`letra`, o contorno da letra que o index.js
   tira da fonte com o opentype), e nunca como <text>: texto dentro do SVG
   vai para o motor de texto do sistema, e esse motor já derrubou o processo
   inteiro do bot (ver "A LETRA VIRA DESENHO" no index.js). */
const SO_CAMINHO = /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]*$/;
export function svgDoRetrato(h, fotoBase64 = "", lado = 256, letra = "") {
  const cor = COR_EM_TEXTO[h.rarity] || "#5865f2";
  const fora = "128,8 238,72 238,184 128,248 18,184 18,72";
  const dentro = "128,26 222,80 222,176 128,230 34,176 34,80";
  const desenho = SO_CAMINHO.test(letra) ? letra : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${lado}" height="${lado}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="aro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".35" stop-color="${cor}"/><stop offset="1" stop-color="#000000" stop-opacity=".55"/></linearGradient>
    <clipPath id="miolo"><polygon points="${dentro}"/></clipPath>
  </defs>
  <polygon points="${fora}" fill="${cor}"/>
  <polygon points="${fora}" fill="url(#aro)" opacity=".6"/>
  <polygon points="${dentro}" fill="#1e1f22"/>
  ${fotoBase64
    ? `<image xlink:href="data:image/png;base64,${fotoBase64}" href="data:image/png;base64,${fotoBase64}" x="22" y="16" width="212" height="224" preserveAspectRatio="xMidYMid slice" clip-path="url(#miolo)"/>`
    : desenho ? `<path d="${desenho}" fill="${cor}"/>` : ""}
  <polygon points="${dentro}" fill="none" stroke="#000000" stroke-opacity=".35" stroke-width="3"/>
</svg>`;
}

/* ---------------- 🐻 o Urso (Armadilha do Urso / Bear Trap) ----------------

   "Podemos começar com o urso e dicas de heróis" (dono, 16/11). Quem lidera
   o rally, quem entra nele e o que mais rende -- tudo tirado das notas da
   base, nada escrito à mão: se a base mudar, a ficha muda junto. As dicas
   também saem dos dados (os nomes são calculados); só o texto em volta é
   nosso. */
export const TEXTOS_DO_URSO = {
  titulo: "Heróis para o Urso",
  subtitulo: "Os melhores para a Armadilha do Urso (Bear Trap), pela nota da comunidade.",
  liderar: "Para liderar o rally",
  entrar: "Para entrar no rally",
  tambem: "Também rendem no Urso",
  legenda: "dá para ter sem gastar",
  dicas: "Dicas",
};
const BOA = new Set(["S+", "S", "A"]);
const FORTE = new Set(["S+", "S"]);
const posicao = (v) => ORDEM_DAS_NOTAS.indexOf(notaDaFuncao(v));

/* Pura. Os três grupos, sem repetir ninguém. Herói de coleta não luta. */
export function heroisDoUrso(herois = HEROIS) {
  const luta = herois.filter((h) => !h.gathering);
  const lideres = luta
    .filter((h) => BOA.has(notaDaFuncao(h.bear)) && FORTE.has(notaDaFuncao(h.rally)))
    .sort((a, b) => posicao(a.bear) - posicao(b.bear) || posicao(a.rally) - posicao(b.rally) || b.gen - a.gen);
  const ja = new Set(lideres.map((h) => h.name));
  const entram = luta
    .filter((h) => !ja.has(h.name) && FORTE.has(notaDaFuncao(h.bear)) && BOA.has(notaDaFuncao(h.joiner)))
    .sort((a, b) => posicao(a.joiner) - posicao(b.joiner) || posicao(a.bear) - posicao(b.bear) ||
      Number(!!b.f2p) - Number(!!a.f2p) || a.gen - b.gen);
  for (const h of entram) ja.add(h.name);
  const tambem = luta
    .filter((h) => !ja.has(h.name) && BOA.has(notaDaFuncao(h.bear)))
    .sort((a, b) => posicao(a.bear) - posicao(b.bear) || a.gen - b.gen);
  return { lideres, entram, tambem };
}

/* Pura. "A, B e C". */
function emLista(hs) {
  const n = hs.map((h) => h.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} e ${n.at(-1)}` : n[0] || "";
}

/* Pura. As dicas, em português (o index.js traduz). Cada uma só entra se o
   dado que a sustenta estiver na base. */
export function dicasDoUrso({ lideres, entram }, herois = HEROIS) {
  const dicas = [];
  const gratis = entram.filter((h) => h.f2p);
  if (gratis.length) dicas.push(`Quem só entra no rally: ${emLista(gratis)} estão entre os melhores no Urso, e dá para ter sem gastar.`);
  const liderGratis = lideres.filter((h) => h.f2p);
  if (liderGratis.length) {
    dicas.push(`Para liderar sem gastar, o caminho é ${emLista(liderGratis)}` +
      (liderGratis.length === 1 && liderGratis[0].name === "Yang" ? ": guarde fragmentos dele a partir da Gen 5." : "."));
  }
  if (entram.some((h) => h.name === "Amane")) dicas.push("Amane rende mais num time com muitos arqueiros.");
  if (herois.some((h) => h.gathering)) dicas.push("Herói de coleta (Gen 0) não luta: deixe de fora do Urso.");
  dicas.push("O Urso dura 30 minutos e volta a cada 48 horas. Crie o evento com /evento e a CYRON avisa antes.");
  return dicas;
}

/* Pura. A ficha do Urso, no mesmo estilo da ficha de herói. A nota de cada
   linha é a do Urso; o baú marca quem dá para ter sem gastar. */
export function fichaDoUrso({ lideres, entram, tambem }, { e, t, dicas = [], foto = "attachment://urso.png" }) {
  const linha = (h, i, todos) => {
    const fim = i === todos.length - 1;
    const nota = notaDaFuncao(h.bear);
    return `${e(fim ? "ks_galho_fim" : "ks_galho", fim ? "└" : "├")}${e(EMOJI_DA_NOTA[nota], nota)} ` +
      `${e(EMOJI_DA_TROPA[h.troop], "")} **${h.name}** ${e(`ks_gen_${h.gen}`, `Gen ${h.gen}`)}` +
      (h.f2p ? ` ${e("ks_bau", "🎁")}` : h.vip ? " VIP" : "");
  };
  const bloco = (titulo, emoji, hs) => (hs.length ? ["", `${e(emoji, "")} **${titulo}**`, ...hs.map(linha)] : []);
  const linhas = [
    `${e("ks_urso", "🐻")} **${t.titulo}**`,
    t.subtitulo,
    ...bloco(t.liderar, "ks_rally", lideres),
    ...bloco(t.entrar, "ks_joiner", entram),
    ...(tambem.length ? ["", `${e("ks_medalha", "🏅")} **${t.tambem}**`,
      tambem.map((h) => `${e(EMOJI_DA_TROPA[h.troop], "")} ${h.name}`).join("  ·  ")] : []),
    "",
    `> ${e("ks_bau", "🎁")} *= ${t.legenda}*`,
    ...(dicas.length ? ["", `${e("ks_pergaminho", "📜")} **${t.dicas}**`, ...dicas.map((d) => `${e("ks_brilho", "•")} ${d}`)] : []),
  ];
  return {
    color: 0xB8641E,
    description: linhas.join("\n").slice(0, 4000),
    ...(foto ? { thumbnail: { url: foto } } : {}),
    footer: { text: `CYRON · ${t.dados || "dados"}: ${FONTE_DOS_HEROIS}` },
  };
}

/* Pura. O emblema do canto: a cabeça do urso num hexágono de ouro. Só
   formas, nenhum texto (pelo mesmo motivo do retrato). */
export function svgDoUrso(lado = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="aro" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff7cf"/><stop offset=".28" stop-color="#f6c945"/><stop offset=".55" stop-color="#b07c0c"/><stop offset=".74" stop-color="#ffe58a"/><stop offset="1" stop-color="#7a4f00"/></linearGradient>
    <radialGradient id="fundo" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#f0a050"/><stop offset=".55" stop-color="#9a4612"/><stop offset="1" stop-color="#3a1806"/></radialGradient>
    <radialGradient id="pelo" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#9a6a46"/><stop offset=".6" stop-color="#5a3620"/><stop offset="1" stop-color="#2e1a0e"/></radialGradient>
    <clipPath id="miolo"><polygon points="128,26 222,80 222,176 128,230 34,176 34,80"/></clipPath>
  </defs>
  <polygon points="128,8 238,72 238,184 128,248 18,184 18,72" fill="url(#aro)" stroke="#4a3000" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="128,26 222,80 222,176 128,230 34,176 34,80" fill="url(#fundo)"/>
  <g clip-path="url(#miolo)">
    <circle cx="80" cy="86" r="27" fill="url(#pelo)"/><circle cx="176" cy="86" r="27" fill="url(#pelo)"/>
    <circle cx="80" cy="86" r="13" fill="#c98a5e"/><circle cx="176" cy="86" r="13" fill="#c98a5e"/>
    <ellipse cx="128" cy="140" rx="72" ry="66" fill="url(#pelo)"/>
    <ellipse cx="128" cy="168" rx="35" ry="27" fill="#dcae80"/>
    <ellipse cx="128" cy="155" rx="14" ry="10" fill="#1a0f08"/>
    <path d="M128 164v9M128 173q-9 8-18 2M128 173q9 8 18 2" fill="none" stroke="#1a0f08" stroke-width="4" stroke-linecap="round"/>
    <circle cx="102" cy="128" r="8" fill="#1a0f08"/><circle cx="154" cy="128" r="8" fill="#1a0f08"/>
    <circle cx="105" cy="125" r="2.6" fill="#fff"/><circle cx="157" cy="125" r="2.6" fill="#fff"/>
    <path d="M34 80L128 26 222 80V112Q128 86 34 112z" fill="#fff" opacity=".1"/>
  </g>
  <polygon points="128,26 222,80 222,176 128,230 34,176 34,80" fill="none" stroke="#2a1800" stroke-opacity=".5" stroke-width="3"/>
</svg>`;
}
