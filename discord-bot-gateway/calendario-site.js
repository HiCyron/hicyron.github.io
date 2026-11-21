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
   "...Showdown" (o jogo em português chama os dois de "Confronto"; o
   "Confronto entre..." é o das alianças, o Tri-Alliance Clash). */
const PALAVRAS_IRMAS = {
  feira: ["fair"], confronto: ["clash", "showdown"], entre: ["alliance"], banca: ["stall"], oficina: ["workshop"], fundo: ["fund"],
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
  const par = new Map(), livres = new Set(doSite.map((_, j) => j)), repartidos = new Map();
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
  /* Os que sobram em grupo: barras de mesmas datas que só podem ser os
     mesmos N eventos do site, N barras para N eventos. "Confronto..." e
     "Confronto entre..." (o Swordland e o Tri-Alliance Clash, as duas de
     segunda em diante; ou uma delas lida e a outra que a IA pulou) e as
     duas barras só com ícone de quarta (Desert Trial e Officer Project).
     Reparte na ordem: cada linha sai certa (nome e datas vêm do mesmo evento
     do site), só não sei qual ícone é de qual -- então nem emoji nasce daí. */
  const grupos = new Map();
  for (const i of soltos()) {
    const e = eventos[i];
    const cs = candidatos(i).filter((j) => e.soIcone || nomesParecem(e.nome, doSite[j].nome)).sort((x, y) => x - y);
    if (!cs.length) continue;
    const k = `${e.inicio}|${e.fim}|${cs.join(",")}`;
    grupos.set(k, { cs, is: [...(grupos.get(k)?.is || []), i] });
  }
  for (const { cs, is } of grupos.values()) {
    if (is.length < 2 || cs.length !== is.length) continue;
    is.forEach((i, n) => { par.set(i, cs[n]); livres.delete(cs[n]); repartidos.set(i, cs); });
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
    /* A ponta que o print não mostra (começou antes da 1ª coluna, segue depois
       da última) vem do site: "qua 18/11 → sáb 21/11" em vez de "até sáb". */
    return {
      ...e, site: s.nome, hora: horaDoSite(s), peloSite: semNome, certo: !par.repartidos.has(i),
      inicio: e.inicio ?? diaDe(s.inicio), fim: e.fim ?? viradaDe(s.fim), inicioExato: s.inicio, fimExato: s.fim,
      ...(semNome ? { nome: nomeEmPortugues(s.nome, { memoria, fichaDe }), soIcone: false, cortado: false } : {}),
    };
  });
  const usados = new Set(par.values());
  const depois = doSite.filter((s, j) => !usados.has(j) && s.inicio >= ultimoDia + DIA).map((s) => ({
    nome: nomeEmPortugues(s.nome, { memoria, fichaDe }), site: s.nome, inicio: diaDe(s.inicio), fim: viradaDe(s.fim), hora: horaDoSite(s), doSite: true,
    inicioExato: s.inicio, fimExato: s.fim,
  }));
  const pares = [...par.entries()].sort((x, y) => x[0] - y[0]).filter(([i]) => eventos[i].lido).map(([i, j]) => ({ nome: eventos[i].nome, en: doSite[j].nome }));
  return { eventos: [...saida, ...depois], casados: par.size, pares };
}

/* ---------------- a AGENDA DO JOGO: o cartão da semana e o aviso do dia ----------------

   O que vai para a 📅 agenda de cada língua (a prévia que o dono aprovou,
   21/11): um cartão da semana só, que se atualiza, e um aviso por dia na
   virada do dia do jogo (00:00 UTC), com o que começa e o que termina. O
   texto sai em português; o index.js traduz para cada sala. `eventos` são os
   do site (nome já em português quando a CYRON sabe), com a hora exata. */
const DIAS_DA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const dd = (ms) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
const curto = (ms) => `${CURTOS[new Date(ms).getUTCDay()]} ${dd(ms)}`;

export const TEXTOS_DA_AGENDA = {
  semana: "Semana do reino", agora: "Rolando agora", ate: "até", hoje: "Hoje no reino", comeca: "Começa hoje",
  ultimo: "Último dia", rodape: "Do calendário do jogo (mightpulse.com) · horário UTC: o dia do jogo vira às 00:00 UTC",
  comoFunciona: "Como funciona cada evento…",
  virada: "Novo dia do jogo", comeca2: "começa", termina: "termina",
};

/* Pura. A próxima virada do dia do jogo (00:00 UTC). */
export function proximaVirada(agora) {
  return diaDe(agora) + DIA;
}

/* Pura. O contador até a virada (dono, 21/11: "um contador de quanto tempo
   falta para as 00 UTC"). O marcador <t:...:R> do Discord conta sozinho no
   aparelho de cada um ("em 6 horas", "em 5 horas"...), na língua do Discord
   dele; o <t:...:t> mostra a hora da virada no fuso de cada um. */
export function linhaDaVirada(agora, rotulo = TEXTOS_DA_AGENDA.virada) {
  const s = Math.floor(proximaVirada(agora) / 1000);
  return `⏳ **${rotulo}** <t:${s}:R> · <t:${s}:t>`;
}

/* Pura. O cartão da semana: o que está rolando e o que começa nos próximos
   7 dias, dia a dia. `emoji(nome)` dá o emoji; `t` os textos (traduzidos). */
export function cartaoDaSemana(eventos, agora, { reino, emoji = () => "▫️", t = TEXTOS_DA_AGENDA } = {}) {
  const hojeDia = diaDe(agora), fimDaJanela = hojeDia + 8 * DIA;
  const linha = (e, comData) => {
    const hora = horaDoSite(e);
    const quando = hora ? `${comData ? `${curto(e.inicio)} · ` : ""}${hora}` : `${t.ate} ${curto(viradaDe(e.fim) - DIA)}`;
    return `${emoji(e.nome)} **${e.nome}** · ${quando}`;
  };
  const porNome = (a, b) => a.nome.localeCompare(b.nome);
  const rolando = eventos.filter((e) => e.inicio <= agora && e.fim > agora).sort(porNome);
  const vem = eventos.filter((e) => e.inicio > agora && e.inicio < fimDaJanela);
  const dias = [...new Set(vem.map((e) => diaDe(e.inicio)))].sort((a, b) => a - b);
  const partes = [];
  if (rolando.length) partes.push(`🔴 **${t.agora}**`, ...rolando.map((e) => linha(e, true)));
  for (const d of dias) {
    const nome = DIAS_DA_SEMANA[new Date(d).getUTCDay()];
    partes.push("", `⏭️ **${nome[0].toUpperCase()}${nome.slice(1)} ${dd(d)}**`, ...vem.filter((e) => diaDe(e.inicio) === d).sort(porNome).map((e) => linha(e, false)));
  }
  return {
    color: 0xC8962E,
    title: `📅 ${t.semana}${reino ? ` #${reino}` : ""}`.slice(0, 256),
    description: partes.join("\n").trim().slice(0, 4000) || "—",
    footer: { text: t.rodape.slice(0, 2000) },
  };
}

/* Pura. O aviso do dia `dia` (00:00 UTC): o que começa hoje (com a primeira
   dica da ficha, quando a CYRON tem) e o que tem hoje como último dia. Dia
   sem nada começando nem terminando: null (sem aviso, sem barulho). */
/* Os enfeites do aviso, sem os emojis do jogo (o index troca pelos do
   Kingshot: as chamas e os galhos dourados). */
export const ENFEITES_DO_AVISO = { comeca: "🟢", ultimo: "🏁", galho: "├", fim: "└" };

/* Pura. Os eventos do aviso do dia que ainda valem: o que começa hoje e o
   que tem hoje como último dia. O que já acabou sai (dono, 21/11: "o evento
   do castelo já acabou, pois já passou das 17... ele deveria sair dali"). */
function doAviso(eventos, agora) {
  const d = diaDe(agora);
  const vivos = eventos.filter((e) => e.fim > agora);
  return {
    comeca: vivos.filter((e) => diaDe(e.inicio) === d).sort((a, b) => a.inicio - b.inicio || a.nome.localeCompare(b.nome)),
    acaba: vivos.filter((e) => viradaDe(e.fim) - DIA === d && diaDe(e.inicio) !== d).sort((a, b) => a.nome.localeCompare(b.nome)),
  };
}

/* Pura. A chave do aviso do dia: muda quando um evento com hora começa ou
   acaba (aí o aviso é editado no meio do dia), e com o dia. */
export function chaveDoAviso(eventos, agora) {
  const { comeca, acaba } = doAviso(eventos, agora);
  return `${diaDe(agora)}|` + [...comeca, ...acaba].map((e) => `${e.site || e.nome}@${e.inicio > agora ? "antes" : "agora"}`).sort().join(",");
}

export function avisoDoDia(eventos, dia, { emoji = () => "▫️", dica = () => "", t = TEXTOS_DA_AGENDA, enfeite = {} } = {}) {
  const f = { ...ENFEITES_DO_AVISO, ...enfeite };
  const d = diaDe(dia);
  const { comeca, acaba } = doAviso(eventos, dia);
  if (!comeca.length && !acaba.length) return null;
  const s = (ms) => Math.floor(ms / 1000);
  /* Os galhos ligam cada linha de baixo ao evento: ├ no meio, └ na última. */
  const ramos = (linhas) => linhas.map((x, i) => `${i === linhas.length - 1 ? f.fim : f.galho} ${x}`);
  const partes = [];
  if (comeca.length) {
    partes.push(`${f.comeca} **${t.comeca}**`);
    for (const e of comeca) {
      const hora = horaDoSite(e);
      partes.push(`${emoji(e.nome)} **${e.nome}** · ${hora || `${t.ate} ${curto(viradaDe(e.fim) - DIA)}`}`);
      const sub = [];
      /* Com hora: quanto falta para começar e, rolando, para acabar -- no
         relógio de cada um. */
      if (hora) sub.push(e.inicio > dia ? `⏳ ${t.comeca2 || TEXTOS_DA_AGENDA.comeca2} <t:${s(e.inicio)}:R>` : `🔴 ${t.termina || TEXTOS_DA_AGENDA.termina} <t:${s(e.fim)}:R>`);
      const dc = dica(e.nome);
      if (dc) sub.push(dc);
      partes.push(...ramos(sub));
    }
  }
  if (acaba.length) partes.push("", `${f.ultimo} **${t.ultimo}**`, ...ramos(acaba.map((e) => `${emoji(e.nome)} ${e.nome}`)));
  partes.push("", linhaDaVirada(d, t.virada || TEXTOS_DA_AGENDA.virada));
  const nome = DIAS_DA_SEMANA[new Date(d).getUTCDay()];
  return {
    color: 0x3BA55C,
    title: `☀️ ${t.hoje} · ${nome} ${dd(d)}`.slice(0, 256),
    description: partes.join("\n").trim().slice(0, 4000),
  };
}

/* ---------------- a publicação nas agendas ----------------

   O dono aprovou (21/11, "pode add então no top e vamos colocar no servidor
   reino 2311 na agenda"). Em cada sala da agenda (a original e as de cada
   língua): UMA imagem da semana, editada quando a semana muda (não manda
   mensagem nova), e um aviso por dia, que apaga o de ontem. O estado fica no
   banco (cyron_ajuste), em JSON. */

/* Pura. Os dias da semana na língua da sala, de domingo a sábado, curtos e
   em maiúsculas ("DOM", "SUN", "PAZ"...). */
export function diasDaSemanaEm(idioma) {
  try {
    const f = new Intl.DateTimeFormat(String(idioma || "en"), { weekday: "short", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2026, 10, 22 + i))).replace(/\.$/, "").toLocaleUpperCase(String(idioma || "en")));
  } catch {
    return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  }
}

/* Pura. A chave da semana: o dia e o que o site diz. Mudou a chave, a imagem
   é refeita (uma vez por dia, ou quando o site muda no meio do dia). */
export function chaveDaSemana(eventos, agora) {
  /* Só o que ainda não acabou: o evento que acaba no meio do dia (o castelo
     às 17:00) sai da imagem na hora, não só na virada. */
  const texto = eventos.filter((e) => e.fim > agora).map((e) => `${e.site || e.nome}|${e.inicio}|${e.fim}`).sort().join(";");
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
  return `${diaDe(agora)}|${h.toString(36)}`;
}

/* Pura. O estado da agenda de um servidor, lido do banco (estragado: vazio). */
export function estadoDaAgenda(valor) {
  try {
    const j = JSON.parse(String(valor || "{}"));
    return { chave: String(j.chave || ""), dia: Number(j.dia) || 0, aviso: String(j.aviso || ""), semana: { ...(j.semana || {}) }, avisos: { ...(j.avisos || {}) } };
  } catch { return { chave: "", dia: 0, aviso: "", semana: {}, avisos: {} }; }
}

/* Pura. O HISTÓRICO do reino, para a previsão: cada evento que o site mostrou
   (nome em inglês, começo, fim), sem repetir, os mais novos primeiro. O site
   só mostra uns 4 dias à frente e não guarda o passado; juntando o que ele
   mostra a cada dia, a CYRON descobre de quantos em quantos dias cada evento
   volta. */
export function historicoNovo(historico, eventos, teto = 300) {
  const vistos = new Set(), lista = [];
  for (const e of [...eventos.map((x) => ({ n: x.site || x.nome, i: x.inicio, f: x.fim })), ...(Array.isArray(historico) ? historico : [])]) {
    const k = `${e?.n}|${e?.i}`;
    if (!e?.n || !Number.isFinite(e.i) || vistos.has(k)) continue;
    vistos.add(k);
    lista.push({ n: e.n, i: e.i, f: e.f });
  }
  return lista.sort((a, b) => b.i - a.i).slice(0, teto);
}
