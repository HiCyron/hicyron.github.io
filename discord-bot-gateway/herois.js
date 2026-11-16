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
   index.js passa isto pelo sharp e anexa como PNG. */
export function svgDoRetrato(h, fotoBase64 = "", lado = 256) {
  const cor = COR_EM_TEXTO[h.rarity] || "#5865f2";
  const fora = "128,8 238,72 238,184 128,248 18,184 18,72";
  const dentro = "128,26 222,80 222,176 128,230 34,176 34,80";
  const inicial = String(h.name || "?").trim().charAt(0).toUpperCase().replace(/[<&>]/g, "");
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
    : `<text x="128" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="800" fill="${cor}">${inicial}</text>`}
  <polygon points="${dentro}" fill="none" stroke="#000000" stroke-opacity=".35" stroke-width="3"/>
</svg>`;
}
