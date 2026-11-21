/* ℹ️ Como funciona cada evento do Kingshot.

   O pedido do dono (20/11): "tem como conectar com o calendário do jogo? E
   sempre que iniciar um evento ele mostrar dicas e como funciona". O jogo
   não tem API do calendário; o que a CYRON sabe dos eventos é o que os R4
   criam na agenda (/evento). Então o aviso do evento ("começa em 15 min",
   "começou") ganha o botão "How it works", que abre esta ficha na língua
   de quem tocou, como o "Bear heroes" faz com o Urso.

   O CONTEÚDO foi conferido em vários guias da comunidade (20/11) e só entra
   o que eles CONCORDAM: kingshotmastery.com, kingshotwiki.com, kingshot.wiki,
   kingshotalmanach.com, kingshotdata, heaven-guardian.com, kingshotguide e o
   anúncio oficial do Duelo dos Governadores. Os números que os guias contam
   diferente (o tempo para segurar o Castelo: 2h30 ou 3h; os pontos de cada
   item) NÃO entram: a ficha manda conferir no evento. "Para não espalhar
   fake news" vale aqui também.

   Os nomes em português são os do jogo (o calendário do reino 2311, print
   do dono). Swordland e Tri-Alliance Clash ficam com o nome em inglês: o
   jogo em português corta o nome no calendário ("Confr..."), e eu não
   invento tradução. Em português; o index.js traduz para quem tocou. */

/* `ciclo`: de quantos em quantos dias o evento volta, SÓ onde os guias
   concordam (kingshotmastery.com/guides/event-calendar, kingshotguide.org/calendar,
   kingshotpro.com/events-guide.html, 21/11): o Campeonato toda semana; a
   Tri-Aliança, o Governador mais Forte e a Mobilização no ciclo de 4 semanas.
   O Swordland fica sem: uns guias dizem 14 dias, outros 28. É o que a CYRON
   usa para prever a sequência quando o R4 não manda os prints novos
   (calendario-jogo.js, previstosPeloCiclo). */
export const EVENTOS_DO_JOGO = [
  {
    chave: "santuario", emoji: "🏛️", nome: "Batalha do Santuário",
    nomes: /santuario|sanctuary/,
    como: "Aliança contra aliança pelos Santuários e Fortalezas do mapa. A aliança se inscreve e escolhe o horário. " +
      "Vence quem segurar a construção pelo tempo que o evento pede; se ninguém conseguir, fica com quem estiver nela quando a batalha acabar.",
    dicas: [
      "Escolha horários em que a maior parte da aliança está online.",
      "Dispute só o que dá para segurar: espalhar a aliança em muitos alvos é o erro mais comum.",
      "Deixe defensores escalados durante a batalha inteira, para a construção nunca ficar vazia.",
      "É batalha de objetivo, não de matar: o que conta é segurar a construção.",
      "Entre na aliança antes do dia: trocar de aliança no dia da batalha pode deixar você de fora.",
    ],
  },
  {
    chave: "castelo", emoji: "🏰", nome: "Batalha do Castelo",
    nomes: /batalha do castelo|castle battle|kings? castle|castelo do rei|\bcastelo\b|\bcastle\b/,
    como: "As alianças do reino disputam o Castelo do Rei e as torres em volta. Vence quem segurar o Castelo pelo tempo seguido que o evento pede; " +
      "se ninguém chegar lá, vence quem ficou mais tempo somando. Dentro do Castelo cabe uma marcha só (a do rally).",
    dicas: [
      "Tome as torres primeiro: cada torre na mão do inimigo machuca quem está no Castelo.",
      "Esvazie o hospital antes: a tropa ferida vai para o hospital e só se perde se ele lotar.",
      "Rally duplo: o de ataque primeiro e o de guarnição poucos segundos depois. Se o ataque tomar o Castelo, ele volta e a guarnição fica.",
      "Cada um segura uma construção por vez: uma torre ou o Castelo.",
      "Combinem por voz, com um líder chamando a hora dos rallies.",
    ],
  },
  {
    chave: "swordland", emoji: "⚔️", nome: "Swordland Showdown",
    nomes: /swordland/,
    como: "Batalha entre alianças num mapa próprio. Os pontos vêm de tomar e segurar construções; vence a aliança com mais pontos no fim. " +
      "Cada legião tem 30 titulares e 10 reservas, que entram se alguém faltar.",
    dicas: [
      "Inscreva só quem vai entrar de verdade: inscrito que falta atrapalha o pareamento.",
      "Dividam a aliança em ataque, defesa e apoio.",
      "Construção perdida deixa suprimentos no chão que qualquer lado pode pegar: recolham os seus.",
      "O centro (Swordshrine) vale muito, mas os guias mandam ir nele só no fim.",
      "Não juntem todos os mais fortes na mesma guarnição.",
    ],
  },
  {
    chave: "tri", emoji: "🛡️", nome: "Tri-Alliance Clash", ciclo: 28,
    nomes: /tri.?alian|tri.?alliance|tres aliancas|three alliance/,
    como: "Três alianças no mesmo mapa. A batalha vai por fases: tomar construções, depois as guarnições e, no fim, o Templo. " +
      "A energia serve para andar, atacar e recuperar tropa, e volta mais rápido para quem está numa construção da aliança.",
    dicas: [
      "Definam antes um líder que chama os alvos (e um reserva) e os grupos de cada rota.",
      "Posição vale mais que caçar inimigo: segurem as rotas e as guarnições.",
      "Cheguem juntos à fase do Templo.",
      "Ferido? Recue para uma construção da aliança: é mais rápido do que voltar para a base.",
      "Inscreva só quem vai entrar de verdade.",
    ],
  },
  {
    chave: "governador", emoji: "👑", nome: "O Governador mais Forte", ciclo: 28,
    nomes: /governador mais forte|strongest governor/,
    como: "Evento de 7 dias, com um tema por dia (construção, heróis, habilidades, treino de tropa...). " +
      "Você pontua com o que gasta no tema do dia, e há prêmios por meta e por ranking.",
    dicas: [
      "Veja o tema de amanhã no evento e se prepare na véspera.",
      "Guarde os itens de herói (fragmentos míticos, martelos de forja, mithril) para o dia de Desenvolvimento de Herói.",
      "Guarde aceleradores e Truegold para o dia que pontua cada um, em vez de gastar antes.",
    ],
  },
  {
    chave: "campeonato", emoji: "🏆", nome: "Campeonato da Aliança", ciclo: 7,
    nomes: /campeonato|alliance championship/,
    como: "Seis alianças, cinco rodadas. Cada rodada é disputada em três pistas de até 20 membros; quem ganha duas pistas ganha a rodada.",
    dicas: [
      "O jeito mais comum é o 2-1: os mais fortes em duas pistas, e a terceira fica como sacrifício.",
      "Revejam as pistas entre as rodadas.",
      "Tropa que os guias sugerem nas pistas fortes: perto de 50% infantaria, 20% cavalaria e 30% arqueiros.",
    ],
  },
  {
    chave: "duelo", emoji: "🤺", nome: "Duelo dos Governadores",
    nomes: /duelo dos governadores|governors? duel|duel of governors/,
    como: "Duelo individual, 3 esquadrões contra 3. A inscrição é individual; durante o evento, todo dia você cai num grupo e desafia os outros do grupo. " +
      "Cada esquadrão que vence vale pontos, e o ranking do grupo fecha no fim do dia.",
    dicas: [
      "Monte os 3 esquadrões pensando em vencer formações: veja o que os rivais do grupo usam.",
      "Use todos os desafios do dia: perder não tira ponto.",
    ],
  },
  {
    chave: "vaicomtudo", emoji: "🗡️", nome: "Vai com Tudo",
    nomes: /vai com tudo|all out/,
    como: "Evento de matar (PvP) no reino inteiro, de uns 2 dias: pontos por tropa inimiga ferida grave ou morta, atacando ou defendendo. " +
      "Quanto maior o nível da tropa, mais pontos.",
    dicas: [
      "Escudo ligado sempre que estiver offline ou sem atacar.",
      "Esvazie o hospital antes e chame de volta quem está coletando: coleta longe de casa é alvo fácil.",
      "Sigam as regras do reino e da aliança (alguns reinos proíbem rally em cidade).",
      "Atacar cidade nem sempre compensa: o defensor tem bônus e às vezes faz mais pontos que quem ataca.",
    ],
  },
  {
    chave: "mobilizacao", emoji: "📋", nome: "Mobilização da Aliança", ciclo: 28,
    nomes: /mobiliza/,
    como: "Missões que somam pontos para a aliança inteira; quando a aliança bate a meta, todo mundo ganha os prêmios. " +
      "Cada membro tem um número limitado de missões, e a vaga de 200% dobra os pontos de uma missão.",
    dicas: [
      "Use a vaga de 200% numa missão de muitos pontos que você vai mesmo terminar.",
      "Pegue missões do que você já ia fazer no dia: os guias dizem que não vale gastar além disso.",
      "R4 e R5 podem trocar as missões públicas fracas.",
    ],
  },
  {
    chave: "armamento", emoji: "🔨", nome: "Competição de Armamentos",
    nomes: /armament|armamento/,
    como: "Evento de 2 dias por pontos, sem combate: pontua quem gasta os materiais do tipo da vez (equipamentos, Truegold, fragmentos de herói). " +
      "Abre quando o reino chega na Era do Truegold.",
    dicas: [
      "Veja qual é o tipo desta vez antes de gastar: cada tipo pontua materiais diferentes.",
      "Guarde os materiais certos para o tipo certo.",
      "Escolha uma meta de prêmio e gaste só o que precisa para chegar nela.",
    ],
  },
  {
    chave: "viking", emoji: "🪓", nome: "Vingança Viking",
    nomes: /viking/,
    como: "Ondas de vikings atacam as cidades da aliança. Seus pontos vêm dos vikings que morrem na sua cidade; reforçar um aliado não tira ponto dele " +
      "e rende pontos de reforço para você. As ondas 10 e 20 atacam a sede (HQ) da aliança.",
    dicas: [
      "Mande infantaria e cavalaria reforçar aliados: tropa parada em casa rouba abates de quem reforça você.",
      "Reforce quem está online: algumas ondas atacam só quem está online.",
      "Mande uma marcha forte para a sede antes das ondas 10 e 20.",
      "Para reforçar, coloque na frente um herói de ataque (Chenko, Amadeus, Yeonwoo, Amane), não um defensivo.",
      "Perdeu duas batalhas? Os vikings param de atacar você, mas você ainda pontua reforçando.",
    ],
  },
  {
    chave: "pesca", emoji: "🎣", nome: "Torneio de Pesca",
    nomes: /pesca|fishing/,
    como: "Minijogo de pesca: pegue peixes e objetos do fundo para ganhar prêmios. Peixe raro e do fundo vale mais.",
    dicas: [
      "Use a isca grátis antes de ela lotar.",
      "Melhore linha e anzol primeiro.",
      "Guarde os itens especiais para os lançamentos que valem mais.",
    ],
  },
];

export const TEXTOS_DO_EVENTO = {
  como: "Como funciona",
  dicas: "Dicas",
  aviso: "Guias da comunidade. Os números (tempo, pontos) mudam com o jogo: confira no evento.",
};

/* Os nomes que o tradutor não pode tocar. */
export const NOMES_DOS_EVENTOS = ["Swordland Showdown", "Swordland", "Tri-Alliance Clash", "Swordshrine"];

/* Pura. Nome sem acento e em minúsculas. */
function normalizado(t) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/* Pura. O evento do jogo pelo título do evento da agenda, ou null. O Urso
   fica fora: ele tem a ficha dele (/urso). */
export function eventoDoJogo(titulo) {
  const t = normalizado(titulo);
  if (!t.trim() || /\b(urso|bear|armadilha)\b/.test(t)) return null;
  return EVENTOS_DO_JOGO.find((e) => e.nomes.test(t)) || null;
}

export function acharEventoDoJogo(chave) {
  return EVENTOS_DO_JOGO.find((e) => e.chave === chave) || null;
}

/* Pura. A ficha. `t` são os textos fixos, `como` e `dicas` já na língua de
   quem tocou; `e(nome, reserva)` devolve o emoji do aplicativo. */
export function fichaDoEvento(ev, { t, como, dicas, nome = ev.nome, e = (n, r) => r }) {
  const linhas = [
    `${ev.emoji} **${nome}**`,
    "",
    `${e("ks_pergaminho", "📜")} **${t.como}**`,
    como,
    "",
    `${e("ks_brilho", "✨")} **${t.dicas}**`,
    ...dicas.map((d) => `${e("ks_brilho", "•")} ${d}`),
  ];
  return {
    color: 0xC8962E,
    description: linhas.join("\n").slice(0, 4000),
    footer: { text: `CYRON · ${t.aviso}`.slice(0, 2000) },
  };
}

/* O ÍCONE de cada evento, recortado dos prints do calendário do reino 2311
   (21/11) e guardado em img/eventos/ks_ev_*.png: sobe como emoji da CYRON
   junto com os outros do Kingshot. O dono (21/11): "mas todos aqui têm
   emoji" -- no jogo, todo evento tem ícone; a CYRON não precisa esperar uma
   leitura para mostrar. Vale o nome em inglês (o do site) e o em português
   (o do jogo). O par que o print não separa foi resolvido assim: o Desert
   Trial é o da caçada aos Dreadwolves (o lobo), o Officer Project o punho; o
   Swordland é o do Swordshrine (a torre) e o "Confronto entre..." do jogo em
   português é o Tri-Alliance Clash (as espadas). */
const ICONES_FIXOS = [
  [/brewmaster|banca do mestre/, "ks_ev_brewmaster"], [/brew workshop|oficina de poc/, "ks_ev_workshop"],
  [/fishing|torneio de pesca/, "ks_ev_fishing"], [/hero ascension|fundo de ascensao/, "ks_ev_hero_fund"],
  [/hero rally|rally do heroi/, "ks_ev_hero_rally"], [/voyage/, "ks_ev_voyage"], [/champagne|^feira\b/, "ks_ev_champagne"],
  [/sanctuary|santuario/, "ks_ev_sanctuary"], [/alliance championship|campeonato da alianca/, "ks_ev_championship"],
  [/governors? duel|duelo dos governadores/, "ks_ev_duel"], [/^all out|vai com tudo/, "ks_ev_all_out"],
  [/strongest governor|governador mais forte/, "ks_ev_strongest"], [/castle battle|batalha do castelo/, "ks_ev_castle"],
  [/armament|competicao de armamentos/, "ks_ev_armament"], [/swordland/, "ks_ev_swordland"], [/tri.?alliance/, "ks_ev_tri_alliance"],
  [/mobiliz/, "ks_ev_mobilization"], [/desert trial/, "ks_ev_desert_trial"], [/officer project/, "ks_ev_officer"],
];

/* Pura. O nome do emoji fixo do evento (ks_ev_...), ou "". */
export function iconeFixo(nome) {
  const t = normalizado(nome);
  return ICONES_FIXOS.find(([r]) => r.test(t))?.[1] || "";
}
