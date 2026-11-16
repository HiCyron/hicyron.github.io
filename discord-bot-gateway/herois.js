/* 🃏 A ficha de um herói do Kingshot (/heroi).

   A ideia do dono (16/11): a CYRON fazer parte do dia a dia de quem joga
   esses jogos de estratégia -- e consultar um herói é coisa de todo dia.

   Os DADOS são uma base CONFERIDA da CYRON (dados/kingshot-herois.json), feita
   a pedido do dono ("para não espalhar fake news"):
   - nome, geração, raridade e tropa: a base aberta da KingshotPro (CC-BY-4.0)
     conferida com outro site; a geração 7 conferida em dois;
   - as notas (Rally, Guarnição, Urso): a lista de novembro/2026 do
     kingshotmastery.com -- opinião da comunidade, e a ficha diz isso;
   - "dá para ter sem gastar" só quando duas fontes concordam;
   - a geração 8 fica de fora até sair de verdade;
   - nada de texto livre ("Sobre"): era ali que moravam as afirmações que
     não se confirmavam. O que a ficha diz sai das notas (melhorUso e
     dicasDoHeroi), e o rodapé diz de onde vieram.

   O VISUAL é nosso: os emojis ks_* (img/kingshot) foram desenhados para a
   CYRON e sobem como emojis do aplicativo, todos animados. Emoji padrão do
   Discord ficou de fora: o dono achou feio -- quebra o clima de jogo. */
import { readFileSync } from "node:fs";

const DADOS = JSON.parse(readFileSync(new URL("./dados/kingshot-herois.json", import.meta.url), "utf8"));
export const HEROIS = DADOS.heroes || [];
export const FONTE_DOS_HEROIS = "kingshotpro.com";
export const FONTE_DAS_NOTAS = "kingshotmastery.com";

export const COR_DA_RARIDADE = { legendary: 0xF0B232, epic: 0xA855F7, rare: 0x3B9CF5 };
const COR_EM_TEXTO = { legendary: "#f0b232", epic: "#a855f7", rare: "#3b9cf5" };
const EMOJI_DA_RARIDADE = { legendary: "ks_fogo_lendario", epic: "ks_fogo_epico", rare: "ks_fogo_raro" };
const EMOJI_DA_TROPA = { infantry: "ks_tropa_infantaria", cavalry: "ks_tropa_cavalaria", archer: "ks_tropa_arqueiro" };
const EMOJI_DA_FUNCAO = { garrison: "ks_guarnicao", rally: "ks_rally", bear: "ks_urso" };
const EMOJI_DA_NOTA = { "S+": "ks_nota_splus", S: "ks_nota_s", A: "ks_nota_a", B: "ks_nota_b", C: "ks_nota_c", D: "ks_nota_d", "-": "ks_nota_nada" };
const ORDEM_DAS_NOTAS = ["S+", "S", "A", "B", "C", "D", "-"];
const RARIDADE_EM_INGLES = { epic: "Epic", rare: "Rare" };

/* Quem NÃO mandar como joiner no Urso: a 1ª habilidade deles não é de ataque
   (kingshotmastery.com, guia do Bear Hunt; a lista de notas concorda: "Not
   Useful"). Só os que estão na base. */
export const NUNCA_NO_URSO = ["Jabel", "Helga", "Long Fei", "Gordon", "Diana", "Edwin", "Charles"];

/* Os textos fixos da ficha, em português: o index.js traduz para a língua de
   quem pediu, com os termos do jogo protegidos. */
export const TEXTOS_DA_FICHA = {
  tropa: { infantry: "Infantaria", cavalry: "Cavalaria", archer: "Arqueiro" },
  raridade: { legendary: "Lendário", epic: "Épico", rare: "Raro" },
  funcao: { garrison: "Guarnição", rally: "Rally", bear: "Urso (joiner)" },
  gen: "Gen",
  f2p: "Dá para ter sem gastar",
  vip: "Herói VIP: vem nos pacotes de VIP (pago)",
  dicas: "Dicas",
  notas: "notas",
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

/* Pura. Como o herói aparece na lista: "Gen 5" para lendário, "Epic"/"Rare"
   para os outros (épico e raro não têm geração; os termos do jogo ficam em
   inglês, como o jogador lê no jogo). */
export function rotuloDoHeroi(h) {
  return h.gen != null ? `Gen ${h.gen}` : RARIDADE_EM_INGLES[h.rarity] || "";
}

/* Pura. A lista do autocompletar: quem começa com o que foi digitado vem
   primeiro, depois quem contém; dentro disso, lendários por geração e depois
   os épicos e raros. No máximo 25 (o teto do Discord). */
export function sugestoesDeHeroi(texto) {
  const n = normalizar(texto);
  const ordem = (h) => (h.gen != null ? h.gen : h.rarity === "epic" ? 50 : 60);
  return HEROIS
    .filter((h) => !n || normalizar(h.name).includes(n))
    .sort((a, b) => (normalizar(a.name).startsWith(n) ? 0 : 1) - (normalizar(b.name).startsWith(n) ? 0 : 1) ||
      ordem(a) - ordem(b) || a.name.localeCompare(b.name))
    .slice(0, 25)
    .map((h) => ({ name: `${h.name} · ${rotuloDoHeroi(h)}`, value: h.name }));
}

/* Pura. "S", "A"... ou "-" para o que a base marca como "—"/vazio. */
export function notaDaFuncao(v) {
  const t = String(v ?? "").trim().toUpperCase();
  return ORDEM_DAS_NOTAS.includes(t) ? t : "-";
}
const posicao = (v) => ORDEM_DAS_NOTAS.indexOf(notaDaFuncao(v));

/* Pura. As funções da árvore, da nota mais alta para a mais baixa. */
export function funcoesDoHeroi(h) {
  return ["rally", "garrison", "bear"]
    .map((k) => [k, notaDaFuncao(h[k])])
    .sort((a, b) => ORDEM_DAS_NOTAS.indexOf(a[1]) - ORDEM_DAS_NOTAS.indexOf(b[1]));
}

/* "Dá para ter sem gastar": só o que duas fontes confirmam (a base marca
   f2p=true só nesses). O Yang fica em disputa: a lista de novembro diz que
   sim, outro guia diz que ele só sai em loja paga. */
export function ehF2P(h) {
  return h.f2p === true;
}

/* Pura. O melhor uso, tirado das notas: TUDO em que o herói é forte (S ou
   S+), liderar rally primeiro. Era só a nota mais alta, e o Amadeus -- S+
   para entrar no Urso, S para liderar -- saía só "Entrar no rally do Urso",
   quando todo mundo (e todas as fontes) o conhece como líder de rally. Sem
   nada forte, a melhor nota. Herói de coleta é de coleta. Em português; o
   index.js traduz. */
const USO = { rally: "Liderar rally", garrison: "Guarnição (defesa da cidade)", bear: "Entrar no rally do Urso" };
const ORDEM_DO_USO = ["rally", "bear", "garrison"];
export function melhorUso(h) {
  if (h.coleta) return `Coleta de ${h.coleta}`;
  const fortes = ORDEM_DO_USO.filter((k) => FORTE.has(notaDaFuncao(h[k])));
  if (fortes.length) return fortes.map((k) => USO[k]).join(" · ");
  const funcoes = funcoesDoHeroi(h);
  const topo = funcoes[0][1];
  if (posicao(topo) > posicao("B")) return "Pouco uso em batalha";
  return funcoes.filter(([, n]) => n === topo).map(([k]) => USO[k]).join(" · ");
}

/* Pura. As dicas do herói, só com o que a base sustenta. */
export function dicasDoHeroi(h) {
  const dicas = [];
  if (h.coleta) dicas.push(`Herói de coleta: aumenta a coleta de ${h.coleta}. Não leve para a batalha.`);
  if (FORTE.has(notaDaFuncao(h.bear))) dicas.push("Para entrar no rally do Urso, use como 1º herói: só a 1ª habilidade do 1º herói conta.");
  else if (NUNCA_NO_URSO.includes(h.name) && !h.coleta) dicas.push("Não mande como joiner no Urso: a 1ª habilidade não é de ataque.");
  if (FORTE.has(notaDaFuncao(h.rally)) && !h.coleta) dicas.push("Bom para liderar rally: quem lidera leva as 3 habilidades para o rally inteiro.");
  if (FORTE.has(notaDaFuncao(h.garrison)) && !h.coleta) dicas.push("Forte na guarnição: segura a cidade quando atacam.");
  return dicas;
}
const FORTE = new Set(["S+", "S"]);

/* Pura. A ficha. `e(nome, reserva)` devolve o emoji do aplicativo (ou a
   reserva, enquanto ele não subiu); `t` são os textos já na língua certa,
   mais `melhor` e `dicas` (já traduzidos). Tudo na descrição, e não no
   título: emoji próprio não aparece em título de cartão. A nota vem ANTES do
   nome da função: emoji tem largura fixa, então as notas ficam em coluna. */
export function fichaDoHeroi(h, { e, t, foto = "attachment://heroi.png" }) {
  const funcoes = funcoesDoHeroi(h);
  const geracao = h.gen != null ? `  │  ${e(`ks_gen_${h.gen}`, "")} ${t.gen} ${h.gen}` : "";
  const dicas = t.dicas_do_heroi || [];
  const linhas = [
    `${e("ks_brilho", "✨")} **${h.name}**`,
    `${e(EMOJI_DA_TROPA[h.troop], "")} ${t.tropa[h.troop] || h.troop}${geracao}`,
    `${e(EMOJI_DA_RARIDADE[h.rarity], "")} **${t.raridade[h.rarity] || h.rarity}**`,
    `${e("ks_medalha", "🏅")} **${t.melhor}**`,
    ...funcoes.map(([k, nota], i) =>
      `${e(i === funcoes.length - 1 ? "ks_galho_fim" : "ks_galho", i === funcoes.length - 1 ? "└" : "├")}` +
      `${e(EMOJI_DA_FUNCAO[k], "")} ${e(EMOJI_DA_NOTA[nota], nota === "-" ? "—" : nota)} ${t.funcao[k] || k}`),
    ...(ehF2P(h) ? [`> ${e("ks_bau", "🎁")} *${t.f2p}*`] : h.vip ? [`> ${e("ks_bau", "🎁")} *${t.vip}*`] : []),
    ...(dicas.length ? ["", `${e("ks_pergaminho", "📜")} **${t.dicas}**`, ...dicas.map((d) => `${e("ks_brilho", "•")} ${d}`)] : []),
  ];
  return {
    color: COR_DA_RARIDADE[h.rarity] ?? 0x5865F2,
    description: linhas.join("\n").slice(0, 4000),
    ...(foto ? { thumbnail: { url: foto } } : {}),
    footer: { text: `CYRON · ${t.notas}: ${FONTE_DAS_NOTAS} · ${t.dados}: ${FONTE_DOS_HEROIS}` },
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

   "Podemos começar com o urso e dicas de heróis" (dono, 16/11). Quem entra
   no rally sai da nota do Urso na base; quem lidera vem do guia do Bear Hunt
   do kingshotmastery.com, por geração: Amadeus é o melhor na Gen 1, a Vivian
   substitui os líderes antigos (Gen 5), o Yang fica com o lugar de arqueiro
   (Gen 6) e a Ava lidera depois de evoluída (Gen 7).

   "Verifica se as dicas estão certas para não espalhar fake news" (dono,
   16/11). Conferido em guias independentes (kingshotmastery.com, o guia de
   dados do g2384 e outros) antes de ir para um canal de verdade:
   - joiners Chenko, Amane e Yeonwoo: os melhores, em todas as fontes;
   - quem entra no rally só leva a 1ª habilidade do 1º herói; o líder leva
     as 3 habilidades dos 3 heróis: duas fontes;
   - tropa com a maior parte arqueiros (10/10/80 a 1/10/89): duas fontes;
   - 30 minutos, uma vez a cada 2 dias: todas as fontes;
   - misturar letalidade (Chenko, Yeonwoo) com ataque (Amane, Margot)
     multiplica em vez de somar: kingshotmastery.
   O que CAIU na conferência: a lista "também rendem no Urso" (um guia diz
   para nunca mandar o Long Fei no rally do Urso) e a dica de liderar sem
   gastar com o Yang (as fontes brigam sobre ele ser grátis).
   O que ENTROU (16/11, lista de novembro): a geração 7 -- Ava e Wee & Woo
   estão entre os melhores para entrar no rally do Urso -- e a lista de quem
   nunca mandar como joiner.

   QUEM LIDERA, geração por geração ("tem heróis de outras gerações que
   podem liderar?", dono, 16/11). O guia do Urso só nomeia quatro (Amadeus,
   Vivian, Yang, Ava) e deixava um buraco nas gerações 2, 3 e 4. Agora sai
   da nota de rally da mesma lista: em cada geração, o(s) de melhor nota (A
   ou melhor) -- Marlin, Petra e Rosa entram, e os quatro do guia continuam. */
export function lideresPorGeracao(herois = HEROIS) {
  const porGeracao = new Map();
  for (const h of herois) {
    if (h.gen == null || h.coleta) continue;
    if (!porGeracao.has(h.gen)) porGeracao.set(h.gen, []);
    porGeracao.get(h.gen).push(h);
  }
  const lideres = [];
  for (const gen of [...porGeracao.keys()].sort((a, b) => a - b)) {
    const hs = porGeracao.get(gen);
    const melhor = Math.min(...hs.map((h) => posicao(h.rally)));
    if (melhor > posicao("A")) continue;
    lideres.push(...hs.filter((h) => posicao(h.rally) === melhor).sort((a, b) => a.name.localeCompare(b.name)));
  }
  return lideres;
}
export const TEXTOS_DO_URSO = {
  titulo: "Heróis para o Urso",
  subtitulo: "Os melhores para a Armadilha do Urso (Bear Trap), pela nota da comunidade.",
  liderar: "Para liderar o rally (o melhor de cada geração)",
  entrar: "Para entrar no rally",
  legenda: "dá para ter sem gastar",
  dicas: "Dicas",
};
const BOA = new Set(["S+", "S", "A"]);

/* Pura. Os dois grupos. Quem lidera e também é ótimo para entrar (Amadeus,
   Vivian, Ava) aparece nos dois: serve para os dois papéis. Entre os que
   entram: a nota, depois quem é grátis, depois a geração (épico antes). */
export function heroisDoUrso(herois = HEROIS) {
  const lideres = lideresPorGeracao(herois);
  const geracao = (h) => (h.gen != null ? h.gen : 0);
  const entram = herois
    .filter((h) => !h.coleta && BOA.has(notaDaFuncao(h.bear)))
    .sort((a, b) => posicao(a.bear) - posicao(b.bear) || Number(ehF2P(b)) - Number(ehF2P(a)) || geracao(a) - geracao(b) ||
      a.name.localeCompare(b.name));
  return { lideres, entram };
}

/* Pura. "A, B e C" (ou "A, B ou C"). */
function emLista(hs, junta = "e") {
  const n = hs.map((h) => h.name);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} ${junta} ${n.at(-1)}` : n[0] || "";
}

/* Pura. As dicas, em português (o index.js traduz). Só o que passou na
   conferência (ver o comentário do começo desta parte); as que citam herói
   só entram se o herói estiver na lista. */
export function dicasDoUrso({ lideres, entram }, herois = HEROIS) {
  const dicas = [];
  const gratis = entram.filter(ehF2P);
  if (gratis.length) {
    dicas.push(`Para entrar no rally, só conta a 1ª habilidade do 1º herói: coloque ${emLista(gratis, "ou")} na frente ` +
      "(dá para ter sem gastar). Os outros dois heróis só aumentam a tropa.");
  }
  const tem = (n) => entram.some((h) => h.name === n);
  if ((tem("Chenko") || tem("Yeonwoo")) && (tem("Amane") || tem("Margot"))) {
    dicas.push("Misturar letalidade (Chenko, Yeonwoo) com ataque (Amane, Margot) rende mais do que repetir o mesmo herói.");
  }
  if (lideres.length) dicas.push("Quem lidera o rally usa os 3 heróis de ataque mais fortes: as 3 habilidades valem para o rally inteiro.");
  dicas.push("Tropa: a maior parte arqueiros (os guias falam em 80% ou mais).");
  const nunca = NUNCA_NO_URSO.map((n) => herois.find((h) => h.name === n)).filter(Boolean);
  if (nunca.length) dicas.push(`Nunca mande como joiner: ${emLista(nunca)}. A 1ª habilidade deles não é de ataque.`);
  dicas.push("O Urso dura 30 minutos e volta a cada 2 dias. Crie o evento com /evento e a CYRON avisa antes.");
  return dicas;
}

/* Pura. A ficha do Urso, no mesmo estilo da ficha de herói. Quem lidera
   mostra a nota de RALLY (é o que ele faz ali; a de entrar no Urso faria o
   Yang parecer ruim); quem entra mostra a nota do Urso. O baú marca quem dá
   para ter sem gastar. */
export function fichaDoUrso({ lideres, entram }, { e, t, dicas = [], foto = "attachment://urso.png" }) {
  const linha = (campo) => (h, i, todos) => {
    const fim = i === todos.length - 1;
    const nota = notaDaFuncao(h[campo]);
    return `${e(fim ? "ks_galho_fim" : "ks_galho", fim ? "└" : "├")}${e(EMOJI_DA_NOTA[nota], nota)} ` +
      `${e(EMOJI_DA_TROPA[h.troop], "")} **${h.name}**` +
      (h.gen != null ? ` ${e(`ks_gen_${h.gen}`, `Gen ${h.gen}`)}` : "") +
      (ehF2P(h) ? ` ${e("ks_bau", "🎁")}` : h.vip ? " VIP" : "");
  };
  const bloco = (titulo, emoji, hs, campo) => (hs.length ? ["", `${e(emoji, "")} **${titulo}**`, ...hs.map(linha(campo))] : []);
  const linhas = [
    `${e("ks_urso", "🐻")} **${t.titulo}**`,
    t.subtitulo,
    ...bloco(t.liderar, "ks_rally", lideres, "rally"),
    ...bloco(t.entrar, "ks_joiner", entram, "bear"),
    "",
    `> ${e("ks_bau", "🎁")} *= ${t.legenda}*`,
    ...(dicas.length ? ["", `${e("ks_pergaminho", "📜")} **${t.dicas}**`, ...dicas.map((d) => `${e("ks_brilho", "•")} ${d}`)] : []),
  ];
  return {
    color: 0xB8641E,
    description: linhas.join("\n").slice(0, 4000),
    ...(foto ? { thumbnail: { url: foto } } : {}),
    footer: { text: `CYRON · ${t.notas || "notas"}: ${FONTE_DAS_NOTAS} · ${t.dados || "dados"}: ${FONTE_DOS_HEROIS}` },
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
