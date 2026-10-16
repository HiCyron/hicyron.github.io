/* As figurinhas da CYRON.
 *
 * Arquivo de DADOS, como o catalogo.js e o duelo-elenco.js: nenhuma linha
 * daqui abre conexão, e os testes o importam direto.
 *
 * A arte é a própria CYRON, desenhada para o bot (as folhas que o dono
 * mandou), recortada uma a uma com fundo transparente. Cada figurinha mora em
 * img/figurinhas/<id>.png, e o id também é o nome do EMOJI do aplicativo: as
 * mesmas imagens viram emojis que a CYRON usa em qualquer servidor, sem ocupar
 * vaga de emoji de ninguém.
 *
 * O id segue a regra de nome de emoji do Discord: de 2 a 32 letras, números
 * ou "_" (o teste confere). `pt` e `en` são o nome que aparece na lista do
 * /figurinha; `busca` são as palavras que acham a figurinha, em várias
 * línguas, porque cada um procura "obrigado" na sua.
 *
 * A ORDEM importa: com nada digitado, a lista mostra as 25 primeiras.
 */

export const FIGURINHAS = [
  { id: "gg", pt: "GG", en: "GG", busca: ["gg", "good game", "ganhei", "vitoria", "venci", "win", "victory", "boa partida"] },
  { id: "kkk", pt: "KKKKK", en: "Haha (KKKKK)", busca: ["kkk", "kkkkk", "haha", "hahaha", "rsrs", "risada", "rindo", "laugh", "jaja", "jajaja", "www", "ㅋㅋ"] },
  { id: "oi", pt: "Oi! (HI!)", en: "Hi!", busca: ["oi", "ola", "hi", "hello", "hey", "hola", "salut", "hallo", "ciao", "privet"] },
  { id: "obrigado", pt: "Obrigado! (THANK YOU!)", en: "Thank you!", busca: ["obrigado", "obrigada", "valeu", "vlw", "thanks", "thank you", "thx", "ty", "gracias", "merci", "danke", "grazie", "arigato", "spasibo"] },
  { id: "bora", pt: "BORA!", en: "Let's go! (BORA!)", busca: ["bora", "vamos", "lets go", "go", "partiu", "vamo"] },
  { id: "traduz_ai", pt: "TRADUZ AÍ!", en: "Translate it! (TRADUZ AÍ!)", busca: ["traduz", "traduzir", "traducao", "translate", "translation", "traducir", "nao entendi", "what language"] },
  { id: "boa_noite", pt: "Boa noite (GOOD NIGHT)", en: "Good night", busca: ["boa noite", "good night", "gn", "buenas noches", "bonne nuit", "gute nacht", "dormir", "sleep"] },
  { id: "tchau", pt: "Tchau! (BYE!)", en: "Bye!", busca: ["tchau", "bye", "adeus", "flw", "falou", "adios", "ciao", "see you", "ate mais"] },
  { id: "lol", pt: "LOL", en: "LOL", busca: ["lol", "haha", "kkk", "rofl", "lmao"] },
  { id: "s2", pt: "S2", en: "<3 (S2)", busca: ["s2", "love", "amor", "coracao", "heart", "te amo"] },
  { id: "que", pt: "Quê?! (WHAT?!)", en: "What?!", busca: ["que", "what", "oque", "o que", "hein", "como", "wtf"] },
  { id: "omg", pt: "OMG!", en: "OMG!", busca: ["omg", "meu deus", "nossa", "oh my god", "dios mio", "caramba"] },
  { id: "uau", pt: "Uau! (WOW!)", en: "Wow!", busca: ["uau", "wow", "nossa", "incrivel", "amazing", "guau"] },
  { id: "vamos", pt: "VAMOS! LET'S GO!", en: "Let's go! (VAMOS!)", busca: ["vamos", "lets go", "bora", "fogo", "fire", "animada", "hype"] },
  { id: "nem_pensar", pt: "Nem pensar! (NO WAY!)", en: "No way!", busca: ["nem pensar", "no way", "nao", "jamais", "nunca", "nope", "de jeito nenhum"] },
  { id: "voce", pt: "Você! (YOU!)", en: "You!", busca: ["voce", "you", "vc", "tu", "eu escolho voce"] },
  { id: "ja_volto", pt: "Já volto (BRB)", en: "BRB", busca: ["brb", "ja volto", "be right back", "pera", "afk", "um minuto"] },
  { id: "depois", pt: "Depois... (LATER...)", en: "Later...", busca: ["depois", "later", "mais tarde", "amanha", "luego"] },
  { id: "hehe", pt: "HEHE~", en: "Hehe~", busca: ["hehe", "hihi", "rs", "travessa"] },
  { id: "hmm", pt: "HMM...", en: "Hmm...", busca: ["hmm", "hm", "sei la", "sera", "duvido", "suspeito"] },
  { id: "de_boa", pt: "De boa (CHILL)", en: "Chill", busca: ["de boa", "chill", "relax", "tranquilo", "suave", "tranquila"] },
  { id: "aff", pt: "Aff... (AYYY...)", en: "Ayyy...", busca: ["aff", "ayy", "ai ai", "facepalm", "vergonha", "affs", "pqp"] },
  { id: "calma", pt: "CALMA", en: "Calm down (CALMA)", busca: ["calma", "calm", "calm down", "relaxa", "morri", "skull", "dead"] },
  { id: "cafe", pt: "Café & tradução", en: "Coffee & translation", busca: ["cafe", "coffee", "bom dia", "good morning", "manha", "morning"] },
  { id: "zzz", pt: "Zzz (sono)", en: "Zzz (sleepy)", busca: ["zzz", "sono", "dormindo", "sleepy", "sleep", "cansada", "cansado", "tired"] },
  { id: "chorando", pt: "Chorando", en: "Crying", busca: ["chorando", "chorar", "triste", "sad", "cry", "crying", "t t", "buaa", "snif"] },
  { id: "coracao", pt: "Coração", en: "Heart", busca: ["coracao", "heart", "amor", "love", "carinho", "corazon"] },
  { id: "amei", pt: "Amei", en: "Love it", busca: ["amei", "love it", "feliz", "happy", "fofo", "alegria", "yay"] },
  { id: "piscadinha", pt: "Piscadinha", en: "Wink", busca: ["piscadinha", "piscar", "wink", "isso ai", "boa"] },
  { id: "paz", pt: "Paz", en: "Peace", busca: ["paz", "peace", "beleza", "yeah", "suave", "joia"] },
  { id: "eita", pt: "Eita!?", en: "Huh!?", busca: ["eita", "surpresa", "surprised", "huh", "oxe", "como assim"] },
  { id: "pensando", pt: "Pensando", en: "Thinking", busca: ["pensando", "thinking", "duvida", "hmm", "sera", "pregunta"] },
  { id: "brava", pt: "Brava", en: "Angry", busca: ["brava", "bravo", "raiva", "angry", "mad", "irritada", "irritado", "grr"] },
  { id: "timida", pt: "Tímida", en: "Shy", busca: ["timida", "timido", "vergonha", "shy", "blush", "corada"] },
  { id: "choque", pt: "Choque", en: "Shocked", busca: ["choque", "shock", "shocked", "medo", "horror", "socorro", "susto"] },
  { id: "brilho", pt: "Olhos brilhando", en: "Starstruck", busca: ["brilho", "brilhando", "starstruck", "animada", "excited", "estrela", "uau"] },
  { id: "estilo", pt: "Estilo", en: "Deal with it", busca: ["estilo", "cool", "deal with it", "oculos", "sunglasses", "swag", "top", "chique"] },
  { id: "aceno", pt: "Aceno", en: "Wave", busca: ["aceno", "acenar", "wave", "oi", "tchau", "hello"] },
  { id: "mundo", pt: "Mundo", en: "World", busca: ["mundo", "world", "terra", "earth", "global", "planeta"] },
  { id: "online", pt: "ON LINE", en: "Online", busca: ["online", "on", "cheguei", "aqui", "here", "on line"] },
  { id: "foco", pt: "Foco (FOCUS)", en: "Focus", busca: ["foco", "focus", "estudando", "study", "concentrada"] },
  { id: "trabalhando", pt: "Modo trabalho (WORK MODE)", en: "Work mode", busca: ["trabalhando", "trabalho", "work", "work mode", "ocupada", "busy"] },
  { id: "nham", pt: "Nham nham (NOM NOM)", en: "Nom nom", busca: ["nham", "nom nom", "comer", "comida", "food", "eat", "fome", "hungry", "almoco", "janta"] },
  { id: "nerd", pt: "Nerd", en: "Nerd", busca: ["nerd", "oculos", "glasses", "geek", "discord"] },
  { id: "ninja", pt: "Ninja", en: "Ninja", busca: ["ninja", "segredo", "secret", "stealth", "escondida", "mascara"] },
  { id: "espiando", pt: "Espiando", en: "Peeking", busca: ["espiando", "espiar", "peek", "peeking", "sus", "desconfiada", "olhando"] },
  { id: "rawr", pt: "RAWR!", en: "Rawr!", busca: ["rawr", "grr", "monstro", "rugido", "roar"] },
  { id: "cyron", pt: "CYRON", en: "CYRON", busca: ["cyron", "logo", "bot"] },
];

/* Minúsculas, sem acento e sem pontuação: "Obrigado!" e "obrigado" são a
   mesma busca. Pura. */
export function semAcento(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/* O nome na lista: o português para quem usa o Discord em português, o
   inglês para o resto. Pura. */
export function nomeDaFigurinha(f, locale) {
  return String(locale || "").toLowerCase().startsWith("pt") ? f.pt : f.en;
}

/* Quanto a figurinha casa com o que foi digitado: 3 igual, 2 começa com,
   1 contém, 0 nada. Vazio casa com todas. Pura. */
function pontosDaFigurinha(f, q) {
  if (!q) return 1;
  const palavras = [f.id.replace(/_/g, " "), f.pt, f.en, ...f.busca].map(semAcento);
  if (palavras.includes(q)) return 3;
  if (palavras.some((p) => p.startsWith(q))) return 2;
  if (palavras.some((p) => p.includes(q))) return 1;
  return 0;
}

/* O que aparece enquanto a pessoa digita: as que casam melhor primeiro, e
   no empate a ordem do catálogo. Pura. */
export function sugestoesDeFigurinha(digitado, locale, max = 25) {
  const q = semAcento(digitado);
  return FIGURINHAS
    .map((f, i) => ({ f, i, p: pontosDaFigurinha(f, q) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .slice(0, max)
    .map(({ f }) => ({ name: nomeDaFigurinha(f, locale), value: f.id }));
}

/* A figurinha pedida: o id que veio da lista, ou o que a pessoa digitou sem
   escolher (a que casa melhor). null quando nada casa. Pura. */
export function acharFigurinha(valor) {
  const bruto = String(valor || "").trim().toLowerCase();
  const exata = FIGURINHAS.find((f) => f.id === bruto);
  if (exata) return exata;
  const [melhor] = sugestoesDeFigurinha(bruto, "pt", 1);
  return semAcento(bruto) && melhor ? FIGURINHAS.find((f) => f.id === melhor.value) : null;
}
