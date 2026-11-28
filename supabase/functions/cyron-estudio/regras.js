/* AS REGRAS DO ESTÚDIO CYRON: o que dá para personalizar e o que cada voto
   no top.gg libera.

   O dono (24/11): "podemos lançar como se fosse personalização, aí para
   liberar a pessoa vota", e depois: uma página do site, sem login, "onde a
   pessoa podia personalizar como a mensagem chega, a cor e detalhes",
   "mostraria a prévia de como vai ficar e todas as opções".

   Este arquivo existe em TRÊS lugares, iguais byte a byte (um teste confere):
   - discord-bot-gateway/estudio-regras.js  → o bot desenha com ele;
   - cyron/estudio-regras.js                → a página mostra com ele;
   - supabase/functions/cyron-estudio/regras.js → quem salva confere com ele.
   Mudou um, copia nos outros dois. Assim a página nunca oferece o que o bot
   não sabe desenhar, e ninguém salva pelo navegador o que não liberou.

   A regra do voto cabe numa linha:
   - sem voto: o padrão (e as três opções úteis do cartão -- jeito, texto
     original e letra grande --, que são de graça);
   - o 1º voto libera as cores, as molduras, as letras, os efeitos, os
     enfeites do título, o fundo da CYRON, a frase e o primeiro herói;
   - cada voto a mais libera mais um herói (fundo do perfil e figura do
     cartão), na ordem desta lista;
   - o que foi liberado fica para sempre. Castigo afasta; coleção traz de
     volta. Voto de fim de semana vale 2 no top.gg, e vale 2 aqui. */

/* "ceu" é a cor de sempre do /perfil e "cyron" (o laranja do bot) a de
   sempre do cartão; as duas ficam abertas sem voto, para o padrão de cada um
   continuar escolhível. */
export const CORES = [
  { id: "ceu", pt: "Céu", en: "Sky", c1: "#7FD3FF", c2: "#5865F2" },
  { id: "cyron", pt: "CYRON", en: "CYRON", c1: "#FFD08A", c2: "#F5A623" },
  { id: "roxo", pt: "Roxo", en: "Purple", c1: "#D2B4FF", c2: "#7B4DFF" },
  { id: "rosa", pt: "Rosa", en: "Pink", c1: "#FFB3DE", c2: "#E0457B" },
  { id: "ouro", pt: "Ouro", en: "Gold", c1: "#FFE08A", c2: "#D99A0B" },
  { id: "esmeralda", pt: "Esmeralda", en: "Emerald", c1: "#9AF5C9", c2: "#1F9E6E" },
  { id: "fogo", pt: "Fogo", en: "Fire", c1: "#FFC18A", c2: "#E5482E" },
  { id: "gelo", pt: "Gelo", en: "Ice", c1: "#F0FAFF", c2: "#7FB8FF" },
  { id: "noite", pt: "Noite", en: "Night", c1: "#B3BBFF", c2: "#3B3FA8" },
  { id: "turquesa", pt: "Turquesa", en: "Turquoise", c1: "#8FF0E6", c2: "#10A6A0" },
  { id: "coral", pt: "Coral", en: "Coral", c1: "#FFB0A0", c2: "#F0552E" },
  { id: "vinho", pt: "Vinho", en: "Wine", c1: "#E6A6BA", c2: "#7E1E3A" },
  { id: "cobre", pt: "Cobre", en: "Copper", c1: "#F2CBA2", c2: "#B06A2C" },
  { id: "aurora", pt: "Aurora", en: "Aurora", c1: "#AEEFD6", c2: "#6A5AE0" },
  { id: "grafite", pt: "Grafite", en: "Graphite", c1: "#C9CED8", c2: "#363B45" },
];

export const MOLDURAS = [
  { id: "classica", pt: "Clássica", en: "Classic" },
  { id: "dourada", pt: "Dourada", en: "Gold" },
  { id: "prata", pt: "Prata", en: "Silver" },
  { id: "neon", pt: "Neon", en: "Neon" },
  { id: "dupla", pt: "Dupla", en: "Double" },
  { id: "arcoiris", pt: "Arco-íris", en: "Rainbow" },
];

/* Os heróis do Duelo, na ordem em que os votos liberam (a mesma do elenco;
   um teste confere). Os retratos moram em img/duelo/<id>.jpg no bot e no site. */
export const HEROIS = [
  { id: "alexandre", nome: "Alexandre", bandeira: "🇬🇷" },
  { id: "napoleao", nome: "Napoleão", bandeira: "🇫🇷" },
  { id: "cleopatra", nome: "Cleópatra", bandeira: "🇪🇬" },
  { id: "musashi", nome: "Musashi", bandeira: "🇯🇵" },
  { id: "joana", nome: "Joana d'Arc", bandeira: "🇫🇷" },
  { id: "gengis", nome: "Gengis Khan", bandeira: "🇲🇳" },
  { id: "leonidas", nome: "Leônidas", bandeira: "🇬🇷" },
  { id: "anibal", nome: "Aníbal", bandeira: "🇹🇳" },
  { id: "zumbi", nome: "Zumbi", bandeira: "🇧🇷" },
  { id: "suntzu", nome: "Sun Tzu", bandeira: "🇨🇳" },
  { id: "ragnar", nome: "Ragnar", bandeira: "🇳🇴" },
  { id: "tesla", nome: "Tesla", bandeira: "🇷🇸" },
];

/* O enfeite depois do nome da língua, no título do cartão. */
export const EMOJIS_DO_TITULO = ["✨", "🌸", "⚔️", "🐻", "🔥", "💜", "👑", "🌙", "⭐", "🌊", "🍀", "⚡", "🌹", "❄️", "🦋", "🎀"];

/* A letra do nome no /perfil. As três fontes já moram no bot (as fichas do
   Duelo usam Cinzel e EB Garamond); "moderna" é a de sempre. */
export const LETRAS = [
  { id: "moderna", pt: "Moderna", en: "Modern" },
  { id: "medieval", pt: "Medieval", en: "Medieval" },
  { id: "classica", pt: "Clássica", en: "Classic" },
];

/* O fundo do /perfil: desfocado (o de sempre), nítido ou tingido na cor. */
export const EFEITOS = [
  { id: "desfocado", pt: "Desfocado", en: "Blurred" },
  { id: "nitido", pt: "Nítido", en: "Sharp" },
  { id: "tingido", pt: "Tingido", en: "Tinted" },
  { id: "cinza", pt: "Cinza", en: "Grayscale" },
  { id: "escurecido", pt: "Escurecido", en: "Darkened" },
];

/* OS TÍTULOS: um botão embaixo da mensagem da pessoa nas outras salas
   ("💜 Apoiador"); quem toca vê o cartão dela e como conseguir o título.
   Cada um se ganha jogando -- `precisa` diz com o quê -- e a pessoa escolhe
   no Estúdio qual mostrar (ou nenhum). O emoji animado de cada um mora em
   img/titulos/tt_<id>.gif no bot e no site; o `emoji` daqui é a reserva. */
export const TITULOS = [
  { id: "apoiador", emoji: "💜", pt: "Apoiador", en: "Supporter", precisa: { votos: 1 },
    como_pt: "Votar na CYRON no top.gg.", como_en: "Vote for CYRON on top.gg." },
  { id: "duelista", emoji: "⚔️", pt: "Duelista", en: "Duelist", precisa: { vitorias: 10 },
    como_pt: "Vencer 10 duelos no /duelo.", como_en: "Win 10 duels in /duel." },
  { id: "poliglota", emoji: "🌍", pt: "Poliglota", en: "Polyglot", precisa: { linguas: 5 },
    como_pt: "Traduzir com bandeira para 5 línguas diferentes.", como_en: "Translate with flags into 5 different languages." },
  { id: "sequencia", emoji: "🔥", pt: "Sequência", en: "Streak", precisa: { sequencia: 30 },
    como_pt: "Pegar o /diario 30 dias seguidos.", como_en: "Claim /daily 30 days in a row." },
  { id: "lenda", emoji: "👑", pt: "Lenda", en: "Legend", precisa: { votos: 12 },
    como_pt: "Liberar os 12 heróis do Estúdio (12 votos no top.gg).", como_en: "Unlock all 12 Studio heroes (12 votes on top.gg)." },
];

/* Pura. Os títulos que alguém já ganhou. `feitos`: { votos, vitorias,
   linguas, sequencia } -- o que faltar conta como zero. */
export function titulosConquistados(feitos = {}) {
  return TITULOS.filter((t) => Object.entries(t.precisa).every(([campo, minimo]) => (Number(feitos?.[campo]) || 0) >= minimo))
    .map((t) => t.id);
}

export const ESTILOS_DO_CARTAO = ["completo", "compacto"];
export const FRASE_MAX = 40;
/* O nome do link no pé do cartão nas salas. O nome no TOPO continua o
   verdadeiro, sempre: livre, qualquer um apareceria como "CYRON" ou com o
   nome de outro membro. O link leva ao perfil de verdade. */
export const ASSINATURA_MAX = 32;

export const PADRAO = {
  perfil_cor: "ceu", perfil_moldura: "classica", perfil_fundo: "servidor", perfil_frase: "",
  perfil_letra: "moderna", perfil_efeito: "desfocado",
  cartao_cor: "cyron", cartao_heroi: "", cartao_original: false, cartao_estilo: "completo",
  cartao_grande: false, cartao_emoji: "", titulo: "",
  /* A SUA MENSAGEM NAS SALAS (o cartão que chega nas outras salas): a cor da
     barra ("" = a automática, presa ao seu id) e um enfeite depois do nome. */
  sala_cor: "", sala_emoji: "", sala_assinatura: "",
};

export function corPorId(id) {
  return CORES.find((c) => c.id === id) || CORES[0];
}

/* Pura. O que cada número de votos libera, e o herói do próximo voto. */
export function liberados(votos) {
  const v = Math.max(0, Math.floor(Number(votos) || 0));
  const herois = HEROIS.slice(0, v).map((h) => h.id);
  return {
    cores: v ? CORES.map((c) => c.id) : ["ceu", "cyron"],
    coresDaSala: v ? CORES.map((c) => c.id) : [],
    molduras: v ? MOLDURAS.map((m) => m.id) : ["classica"],
    letras: v ? LETRAS.map((l) => l.id) : ["moderna"],
    efeitos: v ? EFEITOS.map((e) => e.id) : ["desfocado"],
    emojis: v ? [...EMOJIS_DO_TITULO] : [],
    fundos: ["servidor", ...(v ? ["cyron"] : []), ...herois.map((h) => `heroi:${h}`)],
    herois,
    frase: v > 0,
    proximo: HEROIS[v] || null,
  };
}

/* Os caracteres invisíveis e de controle (servem para esconder texto ou
   virar a frase de trás para frente). Montados por número, e não escritos
   no código: escritos, eles mesmos seriam invisíveis -- e o U+2028 quebra a
   linha do JavaScript no meio de uma expressão regular. */
const INVISIVEIS = new RegExp("[" + [[0x00, 0x1f], [0x7f, 0x7f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]]
  .map(([de, ate]) => `${String.fromCharCode(de)}-${String.fromCharCode(ate)}`).join("") + "]", "g");

/* Pura. A frase do perfil: curta, sem link, sem menção, sem marcação do
   Discord e sem caractere invisível. */
export function limparFrase(texto) {
  return String(texto ?? "")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "")
    .replace(/[<>@#&`*_~|\\]/g, "")
    .replace(INVISIVEIS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FRASE_MAX);
}

/* Pura. O nome do link do cartão: as regras da frase, sem os colchetes e
   parênteses (que fechariam o link do Discord) e mais curto. */
export function limparAssinatura(texto) {
  return limparFrase(texto).replace(/[[\]()]/g, "").replace(/\s+/g, " ").trim().slice(0, ASSINATURA_MAX);
}

/* Pura. O estilo pedido, valendo só o que está liberado: o resto volta ao
   padrão. Quem salva usa isto antes de gravar; o bot, antes de desenhar
   (um item que deixou de existir não quebra o perfil de ninguém).
   `conquistados`: os títulos já ganhos (titulosConquistados); título que a
   pessoa não ganhou não fica escolhido. */
export function estiloValido(pedido, votos, conquistados = []) {
  const p = pedido && typeof pedido === "object" ? pedido : {};
  const lib = liberados(votos);
  const de = (lista, valor, padrao) => (lista.includes(valor) ? valor : padrao);
  return {
    perfil_cor: de(lib.cores, p.perfil_cor, PADRAO.perfil_cor),
    perfil_moldura: de(lib.molduras, p.perfil_moldura, PADRAO.perfil_moldura),
    perfil_fundo: de(lib.fundos, p.perfil_fundo, PADRAO.perfil_fundo),
    perfil_frase: lib.frase ? limparFrase(p.perfil_frase) : "",
    perfil_letra: de(lib.letras, p.perfil_letra, PADRAO.perfil_letra),
    perfil_efeito: de(lib.efeitos, p.perfil_efeito, PADRAO.perfil_efeito),
    cartao_cor: de(lib.cores, p.cartao_cor, PADRAO.cartao_cor),
    cartao_heroi: de(lib.herois, p.cartao_heroi, ""),
    cartao_original: p.cartao_original === true,
    cartao_estilo: de(ESTILOS_DO_CARTAO, p.cartao_estilo, PADRAO.cartao_estilo),
    cartao_grande: p.cartao_grande === true,
    cartao_emoji: de(lib.emojis, p.cartao_emoji, ""),
    titulo: de(Array.isArray(conquistados) ? conquistados : [], p.titulo, ""),
    sala_cor: de(lib.coresDaSala, p.sala_cor, ""),
    /* O enfeite do nome: um dos emojis comuns (o voto libera) ou o emoji
       ANIMADO de um título que a pessoa já conquistou ("tt:<id>"), exclusivo
       de quem tem o título. */
    sala_emoji: de([...lib.emojis, ...(Array.isArray(conquistados) ? conquistados : []).map((id) => `tt:${id}`)], p.sala_emoji, ""),
    sala_assinatura: lib.frase ? limparAssinatura(p.sala_assinatura) : "",
  };
}
