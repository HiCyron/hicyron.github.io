/* A página da CYRON no top.gg, escrita aqui e enviada pela própria CYRON.

   O dono (23/11): "você consegue cuidar? sou inútil para isso". O token do
   top.gg mora cifrado na CYRON (/admin → 🗳️ top.gg); este arquivo é o texto.
   Mudou aqui e publicou, a CYRON manda para o top.gg sozinha na volta
   seguinte do relógio -- só quando o texto muda, nunca o mesmo duas vezes.

   Regras do top.gg (docs.top.gg, PATCH /api/v1/projects/@me):
   - headline: 3 a 140 caracteres por língua;
   - page_content: 300 a 50.000 caracteres por língua, em Markdown;
   - línguas aceitas: en, de, fr, pt, tr, hi, ja, ar, nl, ko, it, es, ru, uk,
     vi, zh (sem pt-BR: é "pt").
   Um teste confere os três.

   A frase do beta vem do estado de verdade: quando o beta acabar, a página
   troca sozinha para a frase dos planos, sem alguém lembrar de editar. */

export const LINGUAS_DO_TOPGG = ["en", "de", "fr", "pt", "tr", "hi", "ja", "ar", "nl", "ko", "it", "es", "ru", "uk", "vi", "zh"];

const SITE = "https://hicyron.github.io";
const SUPORTE = "https://discord.gg/yDwePceB38";
const CONVITE = "https://discord.com/oauth2/authorize?client_id=1498142929041096856&permissions=327223209040&scope=bot%20applications.commands";

/* As artes (video-divulgacao/arte-topgg.html → cyron/img/topgg/), servidas pelo
   site. O ?v= muda quando a arte muda: o top.gg guarda imagem em cache, e sem
   isso a página continuaria mostrando a velha. */
const VERSAO_DAS_ARTES = "2";
function arte(nome, lingua, alt) {
  return `![${alt}](${SITE}/img/topgg/${nome}-${lingua}.jpg?v=${VERSAO_DAS_ARTES})`;
}

export function paginaDoTopgg({ beta = false } = {}) {
  const precoEn = beta
    ? "Flags, the Translate menu and the translate button are free forever. **During the beta, every Alliance feature — language rooms, copied channels, screenshots and voice — is unlocked for free.**"
    : "Flags, the Translate menu and the translate button are free forever. Language rooms, copied channels, screenshots and voice come with the Pro and Alliance plans.";
  const precoPt = beta
    ? "Bandeiras, o menu Traduzir e o botão de tradução são grátis para sempre. **Durante o beta, tudo do plano Aliança — salas por idioma, canais copiados, prints e áudios — está liberado de graça.**"
    : "Bandeiras, o menu Traduzir e o botão de tradução são grátis para sempre. Salas por idioma, canais copiados, prints e áudios vêm nos planos Pro e Aliança.";

  return {
    headline: {
      en: "Everyone writes in their own language and reads everyone else in theirs. Live multilingual chat for Discord.",
      pt: "Cada um escreve na sua língua e lê os outros na sua. Chat multilíngue ao vivo no Discord.",
    },
    page_content: {
      en: [
        arte("topo", "en", "CYRON — One server. Every language."),
        "",
        "# 🌐 CYRON — One server. Every language.",
        "",
        "People write in their own language and read everyone else in theirs. Same conversation, same moment, and nobody types a command.",
        "",
        "## How it works",
        arte("como", "en", "The same message in Portuguese, English and Arabic rooms"),
        "1. Members pick their language with one click (language rooms in 22 languages).",
        "2. They chat in their own room (`#chat-pt`, `#chat-en`…) and every message shows up in the other rooms, already translated, with their name and avatar.",
        "3. Replies, mentions, edits, stickers, GIFs and emojis follow the message.",
        "",
        "## Why CYRON",
        arte("comparacao", "en", "Typical free plan versus CYRON"),
        "- Typical free plans stop at around 100 translations a month per member (or 10,000 characters), and ask for votes to unlock more.",
        "- CYRON's flag and translate button have no monthly limit. Members pick a language at the door and CYRON builds the rooms — no linking channels by hand. And it ships Kingshot tools no translator has.",
        "",
        "## Translate with a flag",
        arte("bandeira", "en", "React with a flag, read it in private, pick your language"),
        "React with any country flag and the translation arrives in your DMs. Countries with several languages let you pick yours.",
        "",
        "## Translation everywhere",
        arte("recursos", "en", "Flags, announcements, screenshots, voice notes, glossary and events"),
        "- 🏳️ **React with a flag** — any message, in **100+ languages**, translated privately for whoever reacted. Country with several languages (🇮🇳 🇪🇸 🇨🇭)? Pick yours from a menu.",
        "- 📢 **Announcements** — post once, it lands in every language.",
        "- 🖼️ **Screenshots** — reads the text in an image and translates it.",
        "- 🎧 **Voice notes** — transcribed and translated.",
        "- 📖 **Glossary** — nicknames and alliance tags are never translated.",
        "- ⏰ **Events** (`/evento`) — set \"20:30\" once, everyone sees it in their own time zone, with a reminder.",
        "",
        "## Made for game alliances ⚔️",
        arte("kingshot", "en", "Bear Trap card, hero book, duels and levels"),
        "Built first for Kingshot alliances with players from all over the world:",
        "- 🐻 **Bear Trap** card with the best heroes, in every language (`/urso`).",
        "- 📖 **Hero book** — every hero with tips for leading and joining rallies (`/heroi`).",
        "- ⚔️ **Duels**, hero cards, levels (`/perfil`, `/top`), role panels (`/cargos`) and welcome images.",
        "",
        "## Price",
        precoEn,
        "",
        "## Setup",
        "Add CYRON, and members choose their language at the door. Everything else is in `/cyron` (admins) and `/help` (everyone).",
        "",
        `[${arte("botao", "en", "Add CYRON to Discord — free")}](${CONVITE})`,
        "",
        `🔗 Website: ${SITE}`,
        `💬 Support: ${SUPORTE}`,
        `🔒 Privacy: ${SITE}/privacidade.html`,
      ].join("\n"),
      pt: [
        arte("topo", "pt", "CYRON — Um servidor. Todas as línguas."),
        "",
        "# 🌐 CYRON — Um servidor. Todas as línguas.",
        "",
        "Cada um escreve na sua língua e lê os outros na sua. A mesma conversa, na mesma hora, e ninguém precisa digitar comando.",
        "",
        "## Como funciona",
        arte("como", "pt", "A mesma mensagem nas salas em português, inglês e árabe"),
        "1. Cada membro escolhe a língua com um clique (salas em 22 línguas).",
        "2. Conversa na sala dele (`#chat-pt`, `#chat-en`…) e cada mensagem aparece nas outras salas já traduzida, com o nome e a foto de quem escreveu.",
        "3. Respostas, menções, edições, figurinhas, GIFs e emojis acompanham a mensagem.",
        "",
        "## Por que a CYRON",
        arte("comparacao", "pt", "Plano grátis comum contra a CYRON"),
        "- Os planos grátis comuns param em umas 100 traduções por mês por pessoa (ou 10 mil caracteres) e pedem voto para liberar mais.",
        "- Na CYRON a bandeira e o botão de tradução não têm limite mensal. Cada um escolhe a língua na entrada e a CYRON monta as salas — sem ligar canal na mão. E ela traz ferramentas de Kingshot que nenhum tradutor tem.",
        "",
        "## Traduza com uma bandeira",
        arte("bandeira", "pt", "Reaja com a bandeira, leia no privado, escolha sua língua"),
        "Reaja com a bandeira de qualquer país e a tradução chega no seu privado. País com várias línguas deixa você escolher a sua.",
        "",
        "## Tradução em todo lugar",
        arte("recursos", "pt", "Bandeiras, avisos, prints, áudios, glossário e eventos"),
        "- 🏳️ **Reaja com uma bandeira** — qualquer mensagem, em **mais de 100 línguas**, traduzida no privado de quem reagiu. País com várias línguas (🇮🇳 🇪🇸 🇨🇭)? Você escolhe a sua num menu.",
        "- 📢 **Avisos** — você posta uma vez e chega em todas as línguas.",
        "- 🖼️ **Prints** — lê o texto da imagem e traduz.",
        "- 🎧 **Áudios** — transcritos e traduzidos.",
        "- 📖 **Glossário** — apelidos e tags da aliança nunca são traduzidos.",
        "- ⏰ **Eventos** (`/evento`) — marque \"20:30\" uma vez e cada um vê no próprio fuso, com lembrete.",
        "",
        "## Feita para alianças de jogo ⚔️",
        arte("kingshot", "pt", "Ficha do Urso, livro dos heróis, duelos e níveis"),
        "Nasceu para alianças de Kingshot com jogadores do mundo todo:",
        "- 🐻 **Ficha do Urso** com os melhores heróis, em todas as línguas (`/urso`).",
        "- 📖 **Livro dos heróis** — cada herói com dicas para liderar e entrar em rally (`/heroi`).",
        "- ⚔️ **Duelos**, cartas de herói, níveis (`/perfil`, `/top`), painel de cargos (`/cargos`) e imagens de boas-vindas.",
        "",
        "## Preço",
        precoPt,
        "",
        "## Como começar",
        "Adicione a CYRON e cada membro escolhe a língua na entrada. O resto fica no `/cyron` (ADMs) e no `/help` (todo mundo).",
        "",
        `[${arte("botao", "pt", "Adicionar a CYRON — grátis")}](${CONVITE})`,
        "",
        `🔗 Site: ${SITE}`,
        `💬 Suporte: ${SUPORTE}`,
        `🔒 Privacidade: ${SITE}/privacidade.html`,
      ].join("\n"),
    },
  };
}

/* NOVIDADES NA PÁGINA DO TOP.GG (dono, 23/11: "pode postar lá na página").

   Cada uma vai uma vez só: a CYRON guarda os ids que já foram (ajuste
   `topgg_novidades`) e posta a próxima da lista na volta do relógio. O
   top.gg aceita uma a cada 4 horas -- se recusar por isso, ela tenta na
   volta seguinte. Regras (docs.top.gg, POST /api/v1/projects/@me/announcements):
   título de 3 a 100 caracteres, texto de 10 a 2.000, categoria announcement,
   event ou new_feature. Novidade é uma língua só (não tem mapa de línguas):
   vai em inglês, com uma linha em português no fim.

   Para postar outra: acrescentar no FIM da lista, com id novo. Nunca mudar
   o id de uma que já foi -- ela seria postada de novo. */
export const NOVIDADES_DO_TOPGG = [
  {
    id: "chegou-ao-topgg",
    category: "announcement",
    title: "CYRON is on Top.gg! 🎉",
    content: [
      "One server, every language. Members pick their language and chat in their own room, and every message shows up in the other rooms already translated, with the author's name and avatar.",
      "",
      "🏳️ React with a flag to translate any message · 🖼️ screenshots and 🎧 voice notes translated · ⏰ events in everyone's time zone · 🐻 Kingshot tools: Bear Trap card and hero book.",
      "",
      "Free to start, and everything is unlocked during the beta. Questions or ideas? https://discord.gg/yDwePceB38",
      "",
      "🇧🇷 A CYRON chegou ao top.gg! Cada um escreve na sua língua e lê os outros na sua.",
    ].join("\n"),
  },
];
