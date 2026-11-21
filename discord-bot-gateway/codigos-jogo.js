/* ---------------- 🎁 os CÓDIGOS DE PRESENTE do Kingshot ----------------

   O dono (21/11): "bora do resgate de códigos". Quando sai um código novo do
   Kingshot, a CYRON avisa nas salas de cada língua dos servidores que usam o
   jogo, com o botão que abre o site OFICIAL de resgate e um botão que entrega
   só o código (para copiar no celular).

   O resgate é feito pelo jogador no site oficial: resgatar por ele exigiria a
   API escondida do site (assinatura e captcha), o que pode ir contra os
   termos do jogo. A lista de códigos vem do dono (o painel /admin) e dos
   anúncios OFICIAIS do jogo seguidos pelo botão "Seguir" do Discord -- nunca
   de site de terceiros que não deixa robô ler.

   Aqui só o que é puro (sem Discord e sem banco): o index monta e envia. */

export const URL_DO_RESGATE = "https://ks-giftcode.centurygame.com/";

export const TEXTOS_DO_CODIGO = {
  titulo: "Código novo do Kingshot",
  premio: "Prêmio",
  vale: "Vale até",
  como: "Toque em **Resgatar**, ponha o ID do seu perfil no jogo e cole o código. O prêmio chega no correio do jogo.",
  resgatar: "Resgatar",
  copiar: "Copiar código",
  expirou: "Este código expirou",
  rodape: "CYRON · códigos de presente do Kingshot",
};

/* Pura. O código digitado, limpo: só letras e números, de 4 a 24. O jogo
   diferencia maiúscula de minúscula ("Bw8Gkp9Kn"), então fica como veio. */
export function codigoLimpo(texto) {
  const c = String(texto ?? "").trim().replace(/^[`*_"'“”‘’]+|[`*_"'“”‘’.,;!]+$/g, "");
  return /^[A-Za-z0-9]{4,24}$/.test(c) ? c : "";
}

/* Palavras que aparecem em volta de um código e não são código. */
const NAO_E_CODIGO = new Set(["CODE", "CODES", "GIFT", "GIFTCODE", "REDEEM", "REWARD", "REWARDS", "HTTPS", "HTTP", "KINGSHOT",
  "EVENT", "EVENTS", "VALID", "UNTIL", "EXPIRES", "EXPIRE", "PLEASE", "THANKS", "CENTURY", "GAMES", "DISCORD", "CODIGO", "CÓDIGO",
  "NOVO", "NEW", "HERE", "BELOW", "ENJOY", "GOVERNORS", "GOVERNOR", "LORDS"]);

/* Pura. Os códigos de um anúncio OFICIAL (o canal seguido): o que vem logo
   depois de "code:"/"código:"/"兑换码" é FORTE (vai sozinho); o que só está em
   negrito ou entre crases, num anúncio que fala de código, é FRACO (o dono
   confirma com um toque). Sem falar de código, nada. */
export function codigosDoAnuncio(texto) {
  const t = String(texto ?? "");
  const fala = /gift\s*codes?|redeem|redemption|c[oó]digos?|兑换码|礼包码|コード|giftcode/i.test(t);
  if (!fala) return { fortes: [], fracos: [] };
  const fortes = new Set(), fracos = new Set();
  const aceita = (c) => { const x = codigoLimpo(c); return x && !NAO_E_CODIGO.has(x.toUpperCase()) && /[A-Za-z]/.test(x) ? x : ""; };
  const rotulo = /(?:gift\s*code|redeem\s*code|redemption\s*code|code|c[oó]digo|兑换码|礼包码|コード)\s*(?:is)?\s*[:：\-–—]\s*[*_`"'“]*([A-Za-z0-9]{4,24})/gi;
  for (const m of t.matchAll(rotulo)) { const c = aceita(m[1]); if (c) fortes.add(c); }
  for (const m of t.matchAll(/(?:\*\*|__|`)([A-Za-z0-9]{4,24})(?:\*\*|__|`)/g)) { const c = aceita(m[1]); if (c && !fortes.has(c)) fracos.add(c); }
  return { fortes: [...fortes], fracos: [...fracos] };
}

/* Pura. A validade digitada pelo dono: "31/12", "31/12/2026", "2026-12-31"
   ou vazio. Vale até o FIM do dia, em UTC (o dia do jogo). Data inválida ou
   já passada: null. */
export function validadeDe(texto, agora = Date.now()) {
  const s = String(texto ?? "").trim();
  if (!s) return null;
  let d, m, a;
  let x = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (x) [a, m, d] = [Number(x[1]), Number(x[2]), Number(x[3])];
  else if ((x = s.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/))) {
    d = Number(x[1]); m = Number(x[2]);
    a = x[3] ? Number(x[3].length === 2 ? `20${x[3]}` : x[3]) : new Date(agora).getUTCFullYear();
    /* "05/01" digitado em dezembro é janeiro do ano que vem. */
    if (!x[3] && Date.UTC(a, m - 1, d + 1) <= agora) a += 1;
  } else return null;
  const fim = Date.UTC(a, m - 1, d + 1);
  const conferida = new Date(fim - 1);
  if (conferida.getUTCDate() !== d || conferida.getUTCMonth() !== m - 1) return null;
  return fim > agora ? fim : null;
}

/* Pura. O servidor parece de Kingshot? A função nasce ligada só nesses (o
   ADM liga ou desliga no 🧩): nome com Kingshot/Kingdom/KS, número de reino
   ou a etiqueta de aliança entre colchetes ("[TOP]", "[FTL]"). */
export function pareceKingshot(nome) {
  return /kingshot|kingdom|\bks\b|reino|#\s?\d{3,4}\b|\[\s*[A-Za-z0-9]{2,5}\s*\]/i.test(String(nome ?? ""));
}

/* Pura. Onde o código vai num servidor: as salas de 📢 anúncios (a original
   e as de cada língua); sem anúncios, as da 📆 agenda; sem nenhuma, as salas
   de conversa de cada língua. A original fala inglês (quem ainda não
   escolheu língua lê ali). */
export function salasDoCodigo(fontes, replicas, chats, { tipoAnuncio = "evento", tipoAgenda = "agenda" } = {}) {
  const doTipo = (tipo) => [
    ...[...(fontes || [])].filter(([, t]) => t === tipo).map(([canal]) => ({ canal: String(canal), idioma: "en" })),
    ...(replicas || []).filter((r) => r.tipo === tipo).map((r) => ({ canal: String(r.canal_id), idioma: r.idioma })),
  ];
  const anuncios = doTipo(tipoAnuncio);
  if (anuncios.length) return anuncios;
  const agenda = doTipo(tipoAgenda);
  if (agenda.length) return agenda;
  return (chats || []).filter((c) => c.canal_id).map((c) => ({ canal: String(c.canal_id), idioma: c.idioma }));
}

/* Pura. O cartão do código numa sala. `emoji` troca o baú pelo do jogo. */
export function cartaoDoCodigo({ codigo, premio = "", ate = null }, { t = TEXTOS_DO_CODIGO, bau = "🎁", expirado = false } = {}) {
  const linhas = [`${bau} **${t.titulo}**`, "", "```", codigo, "```"];
  if (premio) linhas.push(`🎁 **${t.premio}:** ${premio}`);
  if (ate) linhas.push(`⏳ **${t.vale}:** <t:${Math.floor(ate / 1000)}:D> (<t:${Math.floor(ate / 1000)}:R>)`);
  if (expirado) linhas.push("", `❌ **${t.expirou}**`);
  else linhas.push("", t.como);
  return {
    color: expirado ? 0x6B7280 : 0xF5B83D,
    description: linhas.join("\n").slice(0, 4000),
    footer: { text: t.rodape },
  };
}

/* Pura. Os botões: o site oficial (link) e o "copiar" (entrega só o código,
   só para quem tocou). Expirado: nenhum. */
export function botoesDoCodigo(codigo, { t = TEXTOS_DO_CODIGO, expirado = false } = {}) {
  if (expirado) return [];
  return [{ type: 1, components: [
    { type: 2, style: 5, label: t.resgatar.slice(0, 80), emoji: { name: "🎁" }, url: URL_DO_RESGATE },
    { type: 2, style: 2, label: t.copiar.slice(0, 80), emoji: { name: "📋" }, custom_id: `codigo:copiar:${codigo}` },
  ] }];
}

/* Pura. O código de um botão "copiar" (vazio: não é um). */
export function codigoDoBotao(customId) {
  const m = String(customId ?? "").match(/^codigo:copiar:([A-Za-z0-9]{4,24})$/);
  return m ? m[1] : "";
}

/* Pura. O registro de um código no banco (estragado: vazio). `enviados`:
   guildId -> { canalId: mensagemId }. */
export function estadoDoCodigo(valor) {
  try {
    const j = JSON.parse(String(valor || "{}"));
    return { codigo: codigoLimpo(j.codigo), premio: String(j.premio || ""), ate: Number(j.ate) || null,
      estado: String(j.estado || ""), enviados: { ...(j.enviados || {}) } };
  } catch { return { codigo: "", premio: "", ate: null, estado: "", enviados: {} }; }
}

export const MARCA_DO_CODIGO = (codigo) => `codigo_ks:${codigo}`;

/* ---- a busca SOZINHA (dono, 21/11: "mas eu não quero fazer isso manual") ----

   A página de códigos do kingshotguide.org: o robots.txt deles libera
   /gift-codes, e os termos deles aceitam robô onde o robots.txt deixa. A
   CYRON lê de meia em meia hora, com o nome dela no pedido, e só o que a
   página marca como ATIVO vira aviso. (A API do kingshot.net seria mais
   fácil, mas o robots.txt deles proíbe robô em /api/.) */
export const SITE_DOS_CODIGOS = "https://www.kingshotguide.org/gift-codes";

/* Pura. Os códigos da página: { codigo, ativo, ate, premio, rotulo }. Os
   dados vêm no JSON da página (Next.js), quebrado em pedaços de <script>:
   junta os pedaços, tira o escape e lê cada cartão (o que tem "isActive").
   Se o mesmo código aparece ativo num lugar e vencido em outro, vale o
   vencido (melhor não avisar que avisar código morto). Página que não tem
   nenhum cartão: [] (mudou de formato -- nunca adivinho). */
export function codigosDoSite(html) {
  const t = String(html ?? "")
    .replace(/"\]\)<\/script><script>self\.__next_f\.push\(\[1,"/g, "")
    .replace(/\\"/g, '"');
  const porCodigo = new Map();
  for (const m of t.matchAll(/\{"code":"([A-Za-z0-9]{4,24})"[^{}]*\}/g)) {
    let j = null;
    try { j = JSON.parse(m[0]); } catch { continue; }
    if (typeof j.isActive !== "boolean") continue;
    const ate = j.expiresAt ? Date.parse(j.expiresAt) || null : null;
    const novo = { codigo: j.code, ativo: j.isActive, ate, premio: typeof j.description === "string" ? j.description.trim().slice(0, 200) : "",
      rotulo: String(j.statusLabel || "") };
    const velho = porCodigo.get(j.code);
    porCodigo.set(j.code, velho ? { ...velho, ativo: velho.ativo && novo.ativo, ate: velho.ate || novo.ate, premio: velho.premio || novo.premio,
      rotulo: novo.ativo ? velho.rotulo : novo.rotulo } : novo);
  }
  return [...porCodigo.values()];
}

/* Pura. O que fazer com a leitura do site: os ativos que ainda não foram
   enviados (novos) e os enviados que o site agora diz vencidos. Muitos
   novos de uma vez é sinal de página estranha: não manda (teto). */
export function decisaoDoSite(doSite, estados, { teto = 4 } = {}) {
  const ja = (c) => ["enviado", "enviando", "expirado"].includes(estados[c]?.estado);
  const novos = doSite.filter((x) => x.ativo && !ja(x.codigo));
  const vencidos = doSite.filter((x) => !x.ativo && estados[x.codigo]?.estado === "enviado").map((x) => x.codigo);
  return { novos: novos.length > teto ? [] : novos, demais: novos.length > teto, vencidos };
}
