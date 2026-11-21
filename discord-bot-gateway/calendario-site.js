/* 🌐 O calendário do reino pelo mightpulse.com.

   O dono achou (21/11): o mightpulse.com mostra o calendário de cada reino,
   e a API dele é aberta (/api/kingdoms/<reino>/events; o robots.txt só
   fecha /api/admin, /api/crawl e /api/cluster). Conferido com os 3 prints
   do reino 2311 do mesmo dia: os 20 eventos batem, com a hora exata (a
   Batalha do Castelo, 12:00-17:00 UTC) e o que vem depois do print (Desert
   Trial, Officer Project). O que falta nele: os nomes vêm em inglês, e
   algumas ofertas da loja (o Fundo de Ascensão do Herói) não aparecem.

   Então os dois se completam: o print dá o nome em português e o ícone (o
   emoji); o site dá o nome inteiro do que o jogo cortou, a hora, e a
   sequência quando o R4 esquece de mandar os prints. O site é de terceiros:
   pode cair ou mudar, e a CYRON nunca depende só dele. */

const DIA = 86400000;

/* Pura. O endereço da API, ou null se o reino não é um número. */
export function urlDoSite(reino) {
  const r = /^\d{1,6}$/.exec(String(reino ?? "").trim());
  return r ? `https://mightpulse.com/api/kingdoms/${r[0]}/events` : null;
}

/* Pura. A resposta da API vira a lista de eventos { id, nome, categoria,
   inicio, fim } (ms, UTC). Resposta estranha: null (nunca adivinho). */
export function eventosDoSite(json) {
  if (!json || json.ok === false || !Array.isArray(json.categories)) return null;
  const vistos = new Set(), lista = [];
  for (const c of json.categories) {
    for (const e of Array.isArray(c?.events) ? c.events : []) {
      const inicio = Number(e?.begin_ts) * 1000, fim = Number(e?.end_ts) * 1000;
      const nome = String(e?.name || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (!nome || !(inicio > 0) || !(fim > inicio)) continue;
      const k = `${e?.id ?? nome}|${inicio}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      lista.push({ id: e?.id ?? null, nome, categoria: String(c?.name || e?.category || "").slice(0, 60), inicio, fim });
    }
  }
  return lista.sort((a, b) => a.inicio - b.inicio || a.nome.localeCompare(b.nome));
}

function normal(t) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
const CORTADO = /\s*(\.{2,}|…)\s*$/;

/* Palavras do jogo em português e o que o jogo usa em inglês. Serve para
   casar "Feira ..." com "Champagne Fair" e "Confr..." com "...Clash" e
   "...Showdown" (o jogo em português chama os dois de "Confronto"). */
const PALAVRAS_IRMAS = {
  feira: ["fair"], confronto: ["clash", "showdown"], banca: ["stall"], oficina: ["workshop"], fundo: ["fund"],
  ascensao: ["ascension"], heroi: ["hero"], rally: ["rally"], batalha: ["battle"], campeonato: ["championship"],
  governador: ["governor"], duelo: ["duel"], mobilizacao: ["mobilization"], competicao: ["competition"],
  armamentos: ["armament"], viagem: ["voyage"], voyage: ["voyage"], luz: ["light"], pesca: ["fishing"], torneio: ["tournament"],
  santuario: ["sanctuary"], castelo: ["castle"], deserto: ["desert"], prova: ["trial"], oficial: ["officer"], projeto: ["project"],
  mestre: ["master", "brewmaster"], pocoes: ["brew", "potion"], vingança: ["vengeance"], vinganca: ["vengeance"], viking: ["viking"],
};

/* Pura. As palavras em inglês que um nome em português pode ter. Nome
   cortado: a última palavra vale pelo começo ("Confr" -> confronto). */
function palavrasEmIngles(nome) {
  const cortado = CORTADO.test(nome);
  const ps = normal(String(nome).replace(CORTADO, "")).split(/[^a-z0-9]+/).filter(Boolean);
  const saida = new Set();
  ps.forEach((p, i) => {
    const ultima = cortado && i === ps.length - 1;
    for (const [pt, en] of Object.entries(PALAVRAS_IRMAS)) {
      if (normal(pt) === p || (ultima && p.length >= 3 && normal(pt).startsWith(p))) en.forEach((x) => saida.add(x));
    }
    if (p.length >= 4) saida.add(p);
  });
  return saida;
}
/* Quantas palavras os dois nomes têm em comum (pelo dicionário acima). */
function parecenca(nomeDoPrint, nomeDoSite) {
  const en = palavrasEmIngles(nomeDoPrint);
  return new Set(normal(nomeDoSite).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && en.has(w))).size;
}
const nomesParecem = (a, b) => parecenca(a, b) > 0;

/* As datas do print batem com as do site? O print mede em dias (UTC):
   começo null = começou na 1ª coluna ou antes; fim null = segue depois da
   última coluna. O site tem hora: conta o dia em que começa e a virada do
   dia em que termina. */
const diaDe = (ms) => Math.floor(ms / DIA) * DIA;
const viradaDe = (ms) => Math.ceil(ms / DIA) * DIA;
function datasBatem(e, s, primeiroDia, ultimoDia) {
  const comeco = e.inicio == null ? diaDe(s.inicio) <= primeiroDia : diaDe(s.inicio) === e.inicio;
  const fim = e.fim == null ? viradaDe(s.fim) >= ultimoDia + DIA : viradaDe(s.fim) === e.fim;
  return comeco && fim;
}

/* Pura. Casa cada evento do print com um evento do site: as datas têm que
   bater, e entre os que batem fica o único que (1) é o mesmo evento
   conhecido (a ficha da CYRON), (2) tem nome parecido ("Voyage da Luz" e
   "Voyage of Light"), (3) é o único com essas datas, de ida e de volta. Nome
   cortado que só pode ser certos eventos ("Batalha do..." = Santuário ou
   Castelo) só casa com eles. Repetidos iguais ("Confr..." duas vezes, e dois
   eventos do site nas mesmas datas com nome parecido) se repartem. Devolve
   Map(índice do print -> evento do site). Sem certeza, não casa. */
export function casarComOSite(eventos, doSite, { primeiroDia, ultimoDia, chaveDe = () => null, chavesPossiveis = () => null } = {}) {
  const par = new Map(), livres = new Set(doSite.map((_, j) => j)), repartidos = new Set();
  const candidatos = (i) => {
    const e = eventos[i];
    const pode = e.soIcone || CORTADO.test(e.nome) ? chavesPossiveis(e.nome) : null;
    return [...livres].filter((j) => {
      const s = doSite[j];
      if (!datasBatem(e, s, primeiroDia, ultimoDia)) return false;
      const k = chaveDe(s.nome);
      if (pode && pode.size && !pode.has(k)) return false;
      const minha = !e.soIcone && !CORTADO.test(e.nome) ? chaveDe(e.nome) : null;
      return !(minha && k && minha !== k);
    });
  };
  const soltos = () => eventos.map((e, i) => i).filter((i) => !par.has(i) && !eventos[i].previsto);
  const passo = (filtro, deVolta = false) => {
    let achou = false;
    for (const i of soltos()) {
      const cs = candidatos(i).filter((j) => filtro(eventos[i], doSite[j]));
      if (cs.length !== 1) continue;
      if (deVolta && soltos().filter((o) => o !== i && candidatos(o).includes(cs[0])).length) continue;
      par.set(i, cs[0]); livres.delete(cs[0]); achou = true;
    }
    return achou;
  };
  /* Pelo nome parecido: o mais parecido dos dois lados ("Rally do Herói" e
     "Hero Rally" têm 2 palavras em comum; "Fundo de Ascensão do Herói", só 1,
     e fica sem par -- o site não tem o Fundo). Empate: não casa. */
  const pelosNomes = () => {
    let achou = false;
    for (const i of soltos()) {
      if (eventos[i].soIcone) continue;
      const notas = candidatos(i).map((j) => [j, parecenca(eventos[i].nome, doSite[j].nome)]).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]);
      if (!notas.length || (notas[1] && notas[1][1] === notas[0][1])) continue;
      const [j, nota] = notas[0];
      const rival = soltos().some((o) => o !== i && !eventos[o].soIcone && candidatos(o).includes(j) && parecenca(eventos[o].nome, doSite[j].nome) >= nota);
      if (rival) continue;
      par.set(i, j); livres.delete(j); achou = true;
    }
    return achou;
  };
  passo((e, s) => !e.soIcone && !CORTADO.test(e.nome) && !!chaveDe(e.nome) && chaveDe(e.nome) === chaveDe(s.nome));
  for (let volta = 0; volta < 6; volta++) {
    const a = pelosNomes();
    const b = passo(() => true, true);
    if (!a && !b) break;
  }
  /* Repetidos iguais: o mesmo nome e as mesmas datas, tantos quantos os do
     site com nome parecido. Reparte na ordem (os nomes ficam certos como
     conjunto; o emoji nunca nasce daqui, só de nome lido). */
  const grupos = new Map();
  for (const i of soltos()) {
    const e = eventos[i];
    if (e.soIcone) continue;
    const k = `${normal(e.nome)}|${e.inicio}|${e.fim}`;
    grupos.set(k, [...(grupos.get(k) || []), i]);
  }
  for (const is of grupos.values()) {
    if (is.length < 2) continue;
    const cs = candidatos(is[0]).filter((j) => nomesParecem(eventos[is[0]].nome, doSite[j].nome));
    if (cs.length !== is.length) continue;
    is.forEach((i, n) => { par.set(i, cs[n]); livres.delete(cs[n]); repartidos.add(i); });
  }
  par.repartidos = repartidos;
  return par;
}

/* Pura. A hora do evento do site, quando não é o dia inteiro. */
export function horaDoSite(s) {
  if (!s || (s.inicio % DIA === 0 && s.fim % DIA === 0)) return "";
  const h = (ms) => new Date(ms).toISOString().slice(11, 16);
  return `${h(s.inicio)}–${h(s.fim)} UTC`;
}

/* Pura. O nome em português do evento do site: o que a CYRON já viu no
   print desse mesmo evento (a memória), senão o nome da ficha, senão o do
   site (em inglês). */
export function nomeEmPortugues(nomeDoSite, { memoria = [], fichaDe = () => null } = {}) {
  const visto = memoria.find((m) => m.en && normal(m.en) === normal(nomeDoSite));
  return visto?.nome || fichaDe(nomeDoSite)?.nome || nomeDoSite;
}

/* Pura. Junta o site na leitura do print: o par de cada barra (o nome
   inteiro do que o jogo cortou ou só mostrou o ícone, e a hora) e o que o
   site mostra depois do print. Devolve os eventos novos, quantos casaram,
   e os pares nome do print -> nome do site, para a memória. */
export function juntarComOSite(eventos, doSite, { primeiroDia, ultimoDia, chaveDe, chavesPossiveis, memoria = [], fichaDe } = {}) {
  const par = casarComOSite(eventos, doSite, { primeiroDia, ultimoDia, chaveDe, chavesPossiveis });
  const saida = eventos.map((e, i) => {
    if (!par.has(i)) return e;
    const s = doSite[par.get(i)];
    const semNome = e.soIcone || CORTADO.test(e.nome);
    return {
      ...e, site: s.nome, hora: horaDoSite(s), peloSite: semNome, certo: !par.repartidos.has(i),
      ...(semNome ? { nome: nomeEmPortugues(s.nome, { memoria, fichaDe }), soIcone: false, cortado: false } : {}),
    };
  });
  const usados = new Set(par.values());
  const depois = doSite.filter((s, j) => !usados.has(j) && s.inicio >= ultimoDia + DIA).map((s) => ({
    nome: nomeEmPortugues(s.nome, { memoria, fichaDe }), site: s.nome, inicio: diaDe(s.inicio), fim: viradaDe(s.fim), hora: horaDoSite(s), doSite: true,
  }));
  const pares = [...par.entries()].sort((x, y) => x[0] - y[0]).filter(([i]) => eventos[i].lido).map(([i, j]) => ({ nome: eventos[i].nome, en: doSite[j].nome }));
  return { eventos: [...saida, ...depois], casados: par.size, pares };
}
