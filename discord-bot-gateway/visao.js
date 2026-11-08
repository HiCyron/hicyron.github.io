/* A Visao da CYRON: o que o bot ve, para quem opera o bot -- sem o token
   sair daqui.

   Antes disto, o dono usava um aplicativo de terceiros ("Discord Bot
   Client") para entrar como a CYRON. Funciona, mas cobra caro: o aplicativo
   pede o TOKEN do bot, e quem fez o aplicativo passa a poder fazer tudo o que
   a CYRON faz, em todos os servidores dela. Ninguem consegue saber o que um
   aplicativo desses faz com o token depois.

   Aqui o caminho e' o contrario. O token continua so' neste processo, no
   cofre do Fly. A pagina (cyron/visao.html) entra com o login do DONO no
   Discord, e a cada pedido eu confiro com o proprio Discord de quem e' aquele
   login e se essa pessoa e' dona do aplicativo (ehDono, a mesma regra do
   /admin). Quem nao e' dono nao ve nada -- nem a lista de servidores.

   O que a pagina pede:
     GET  /visao/eu                     -> quem e' o bot e quem entrou
     GET  /visao/servidores             -> os servidores da CYRON
     GET  /visao/canais?g=<id>          -> os canais de texto de um servidor
     GET  /visao/mensagens?c=<id>[&antes=<id>|&depois=<id>]
     POST /visao/enviar  {c, texto}     -> fala no canal como a CYRON

   O index.js chama `ligarVisao` uma vez, entregando o que este arquivo usa de
   la' (o client e o ehDono). Assim nao ha' import circular, e importar este
   arquivo nos testes nao liga servidor nenhum. */

import { createServer } from "node:http";
import { createHash } from "node:crypto";

const API = "https://discord.com/api/v10";

/* O Fly entrega o trafego do endereco publico nesta porta (fly.toml,
   [http_service] internal_port). */
export const PORTA_DA_VISAO = 8080;

/* Lista fechada, e nao "*". O CORS nao e' a protecao (o login e'), mas sem
   ele qualquer site poderia usar o navegador de um dono logado como ponte. */
export const ORIGENS_DA_VISAO = new Set([
  "https://hicyron.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const MAX_TEXTO = 2000;          // o limite do Discord para uma mensagem
const MAX_CORPO = 16 * 1024;     // pedido maior que isso nao e' uma mensagem
const MENSAGENS_POR_VEZ = 50;    // o maximo que o Discord devolve num pedido
const LOGIN_VALE = 10 * 60 * 1000;
const RECUSA_VALE = 60 * 1000;   // login recusado nao volta a perguntar ao Discord por um minuto
const MAX_LOGINS_LEMBRADOS = 200;

let d = null;
export function ligarVisao(dependencias, porta = PORTA_DA_VISAO) {
  d = dependencias;
  const servidor = createServer((req, res) => {
    atender(req, res).catch((e) => {
      console.error("visao: pedido estourou:", e?.message || e);
      if (!res.headersSent) responder(res, 500, { erro: "falhei aqui dentro" }, cabecalhosDaVisao(req.headers.origin));
      else res.end();
    });
  });
  /* Porta ocupada ou qualquer outro tropeco aqui nao pode derrubar o bot: a
     Visao e' uma janela, o bot e' a casa. */
  servidor.on("error", (e) => console.error("visao: o servidor da Visao nao subiu:", e?.message || e));
  servidor.listen(porta, "0.0.0.0", () => console.log(`visao: ouvindo na porta ${servidor.address()?.port}`));
  return servidor;
}

/* ---------------- pecas puras (testadas) ---------------- */

/* O login vem como "Bearer <token do Discord>". Pura. */
export function lerBearer(cabecalho) {
  const m = /^Bearer\s+([A-Za-z0-9._~+/=-]{10,200})$/.exec(String(cabecalho || "").trim());
  return m ? m[1] : "";
}

/* Pura. A resposta e' sobre UMA pessoa e muda a cada segundo: nada de cache. */
export function cabecalhosDaVisao(origem) {
  const cab = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origem && ORIGENS_DA_VISAO.has(origem)) {
    cab["Access-Control-Allow-Origin"] = origem;
    cab["Access-Control-Allow-Headers"] = "authorization, content-type";
    cab["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    cab["Access-Control-Max-Age"] = "600";
  }
  return cab;
}

const ehId = (s) => /^\d{15,25}$/.test(String(s || ""));

/* O nome que aparece: apelido no servidor, nome de exibicao, nome de usuario. */
function nomeDe(usuario, membro) {
  return membro?.displayName || usuario?.globalName || usuario?.username || "?";
}

/* Uma mensagem do jeito que a pagina desenha. Pura: so' le o objeto. */
export function mensagemParaVisao(m) {
  const valores = (colecao) => (colecao?.values ? [...colecao.values()] : Array.isArray(colecao) ? colecao : []);
  const nomes = { u: {}, c: {}, r: {} };
  for (const u of valores(m.mentions?.users)) nomes.u[u.id] = nomeDe(u, m.mentions?.members?.get?.(u.id));
  for (const c of valores(m.mentions?.channels)) nomes.c[c.id] = c.name || "canal";
  for (const r of valores(m.mentions?.roles)) nomes.r[r.id] = r.name || "cargo";
  return {
    id: m.id,
    quando: m.createdTimestamp || 0,
    editada: m.editedTimestamp || null,
    autor: {
      id: m.author?.id || "",
      nome: m.webhookId ? (m.author?.username || "?") : nomeDe(m.author, m.member),
      avatar: m.author?.displayAvatarURL?.({ size: 64 }) || "",
      bot: !!m.author?.bot,
      webhook: !!m.webhookId,
    },
    texto: m.content || "",
    responde: m.reference?.messageId || null,
    anexos: valores(m.attachments).map((a) => ({
      url: a.url, nome: a.name || "arquivo", tipo: a.contentType || "",
      largura: a.width || null, altura: a.height || null,
    })),
    figurinhas: valores(m.stickers).map((s) => ({ nome: s.name || "", url: s.url || "" })),
    cartoes: (m.embeds || []).map((e) => ({
      cor: e.hexColor || (Number.isInteger(e.color) ? `#${e.color.toString(16).padStart(6, "0")}` : null),
      autor: e.author?.name || "",
      titulo: e.title || "",
      url: e.url || "",
      texto: e.description || "",
      campos: (e.fields || []).map((f) => ({ nome: f.name || "", valor: f.value || "" })),
      imagem: e.image?.url || "",
      miniatura: e.thumbnail?.url || "",
      rodape: e.footer?.text || "",
    })),
    nomes,
  };
}

/* Os canais de texto de um servidor, na ordem em que o Discord mostra:
   categorias pela posicao, e dentro de cada uma os canais pela posicao. Os
   sem categoria vem primeiro, como no aplicativo. Pura: recebe a lista de
   canais e quem e' o bot (para as permissoes). */
const TIPOS_DE_TEXTO = { 0: "texto", 5: "avisos" }; // GuildText, GuildAnnouncement
export function canaisParaVisao(canais, eu) {
  const lista = canais?.values ? [...canais.values()] : (canais || []);
  const categorias = new Map(lista.filter((c) => c.type === 4).map((c) => [c.id, c]));
  const pode = (c, perm) => {
    try { return !!c.permissionsFor?.(eu)?.has?.(perm); } catch { return false; }
  };
  return lista
    .filter((c) => TIPOS_DE_TEXTO[c.type])
    .map((c) => {
      const cat = c.parentId ? categorias.get(c.parentId) : null;
      return {
        id: c.id,
        nome: c.name || "",
        tipo: TIPOS_DE_TEXTO[c.type],
        topico: c.topic || "",
        categoria: cat ? cat.name : "",
        posCategoria: cat ? (cat.rawPosition ?? cat.position ?? 0) : -1,
        pos: c.rawPosition ?? c.position ?? 0,
        ler: pode(c, "ViewChannel") && pode(c, "ReadMessageHistory"),
        escrever: pode(c, "ViewChannel") && pode(c, "SendMessages"),
      };
    })
    .sort((a, b) => a.posCategoria - b.posCategoria || a.pos - b.pos || a.nome.localeCompare(b.nome));
}

/* Os servidores, em ordem alfabetica. Pura. */
export function servidoresParaVisao(guilds) {
  const lista = guilds?.values ? [...guilds.values()] : (guilds || []);
  return lista.map((g) => ({
    id: g.id,
    nome: g.name || "",
    icone: g.iconURL?.({ size: 64 }) || "",
    membros: g.memberCount || 0,
  })).sort((a, b) => a.nome.localeCompare(b.nome));
}

/* O que a pagina manda para falar num canal. Pura: devolve o erro, ou os
   campos ja' limpos. */
export function lerEnvio(corpo) {
  const canal = String(corpo?.c || "");
  const texto = String(corpo?.texto ?? "").trim();
  if (!ehId(canal)) return { erro: "canal invalido" };
  if (!texto) return { erro: "mensagem vazia" };
  if (texto.length > MAX_TEXTO) return { erro: `mensagem passa de ${MAX_TEXTO} caracteres` };
  return { canal, texto };
}

/* ---------------- quem esta pedindo ---------------- */

/* Login ja' conferido: hash do token -> { id (ou null se recusado), ate }.
   Guardo o hash, e nao o token, para que nem a memoria do bot carregue o
   login de ninguem. */
const logins = new Map();

async function donoDoLogin(token) {
  const chave = createHash("sha256").update(token).digest("hex");
  const lembrado = logins.get(chave);
  if (lembrado && lembrado.ate > Date.now()) return lembrado.id;

  const buscar = d.buscar || fetch;
  let usuario = null;
  try {
    const r = await buscar(`${API}/users/@me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) usuario = await r.json();
  } catch (e) {
    console.error("visao: o Discord nao respondeu quem e' o login:", e?.message || e);
    return null; // falha de rede nao vira recusa lembrada: o proximo pedido tenta de novo
  }
  const id = usuario?.id && await d.ehDono(usuario.id) ? String(usuario.id) : null;
  logins.set(chave, { id, ate: Date.now() + (id ? LOGIN_VALE : RECUSA_VALE) });
  while (logins.size > MAX_LOGINS_LEMBRADOS) logins.delete(logins.keys().next().value);
  return id;
}

/* ---------------- o atendimento ---------------- */

function responder(res, status, corpo, cab) {
  res.writeHead(status, cab);
  res.end(corpo === null ? "" : JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const pedacos = [];
    req.on("data", (p) => {
      tamanho += p.length;
      if (tamanho > MAX_CORPO) { reject(new Error("corpo grande demais")); req.destroy(); return; }
      pedacos.push(p);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(pedacos).toString("utf8") || "{}")); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

/* O canal pedido, se for de texto e de um servidor onde a CYRON esta. */
async function canalDeTexto(id) {
  if (!ehId(id)) return null;
  const c = d.client.channels.cache.get(id) || await d.client.channels.fetch(id).catch(() => null);
  return c?.guild && c.isTextBased?.() ? c : null;
}

async function atender(req, res) {
  const cab = cabecalhosDaVisao(req.headers.origin);
  if (req.method === "OPTIONS") return responder(res, 204, null, cab);

  const url = new URL(req.url || "/", "http://visao");
  if (url.pathname === "/" || url.pathname === "/saude") return responder(res, 200, { ok: true }, cab);
  if (!url.pathname.startsWith("/visao/")) return responder(res, 404, { erro: "nao existe" }, cab);

  const token = lerBearer(req.headers.authorization);
  if (!token) return responder(res, 401, { erro: "entre com o Discord" }, cab);
  const dono = await donoDoLogin(token);
  if (!dono) return responder(res, 403, { erro: "este acesso e' so' de quem opera a CYRON" }, cab);

  const rota = `${req.method} ${url.pathname}`;
  const c = d.client;

  if (rota === "GET /visao/eu") {
    return responder(res, 200, {
      voce: dono,
      bot: { id: c.user?.id || "", nome: c.user?.tag || c.user?.username || "CYRON", avatar: c.user?.displayAvatarURL?.({ size: 128 }) || "" },
      servidores: c.guilds.cache.size,
    }, cab);
  }

  if (rota === "GET /visao/servidores") {
    return responder(res, 200, { servidores: servidoresParaVisao(c.guilds.cache) }, cab);
  }

  if (rota === "GET /visao/canais") {
    const guild = c.guilds.cache.get(url.searchParams.get("g") || "");
    if (!guild) return responder(res, 404, { erro: "a CYRON nao esta nesse servidor" }, cab);
    const eu = guild.members.me || await guild.members.fetchMe().catch(() => null);
    return responder(res, 200, {
      servidor: { id: guild.id, nome: guild.name, icone: guild.iconURL?.({ size: 64 }) || "" },
      canais: canaisParaVisao(guild.channels.cache, eu),
    }, cab);
  }

  if (rota === "GET /visao/mensagens") {
    const canal = await canalDeTexto(url.searchParams.get("c"));
    if (!canal) return responder(res, 404, { erro: "canal nao encontrado" }, cab);
    const antes = url.searchParams.get("antes"), depois = url.searchParams.get("depois");
    const pedido = { limit: MENSAGENS_POR_VEZ, cache: false };
    if (ehId(antes)) pedido.before = antes;
    else if (ehId(depois)) pedido.after = depois;
    let lidas;
    try { lidas = await canal.messages.fetch(pedido); }
    catch (e) {
      return responder(res, 403, { erro: "a CYRON nao tem permissao de ler esse canal" }, cab);
    }
    /* O Discord devolve da mais nova para a mais velha; a pagina desenha de
       cima para baixo, como uma conversa. */
    const mensagens = [...lidas.values()].map(mensagemParaVisao).sort((a, b) => a.quando - b.quando);
    return responder(res, 200, {
      canal: { id: canal.id, nome: canal.name, servidor: canal.guild.id },
      mensagens,
    }, cab);
  }

  if (rota === "POST /visao/enviar") {
    let corpo;
    try { corpo = await lerCorpo(req); }
    catch { return responder(res, 413, { erro: "pedido grande demais" }, cab); }
    const envio = lerEnvio(corpo);
    if (envio.erro) return responder(res, 400, { erro: envio.erro }, cab);
    const canal = await canalDeTexto(envio.canal);
    if (!canal) return responder(res, 404, { erro: "canal nao encontrado" }, cab);
    try {
      /* Mencao a pessoa toca sino, como o dono espera ao escrever @alguem.
         @everyone e cargo, nao: um toque errado no celular nao pode chamar um
         servidor inteiro. */
      const enviada = await canal.send({ content: envio.texto, allowedMentions: { parse: ["users"] } });
      console.log(`visao: o dono ${dono} falou como a CYRON em #${canal.name} (${canal.guild.name})`);
      return responder(res, 200, { mensagem: mensagemParaVisao(enviada) }, cab);
    } catch (e) {
      console.error("visao: nao consegui mandar:", e?.message || e);
      return responder(res, 403, { erro: "a CYRON nao conseguiu falar nesse canal (permissao?)" }, cab);
    }
  }

  return responder(res, 404, { erro: "nao existe" }, cab);
}
