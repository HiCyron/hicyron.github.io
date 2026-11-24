/* O ESTÚDIO CYRON: lê e salva o estilo de uma pessoa, pelo link pessoal.

   A pessoa toca em 🎨 Personalizar no Discord; a CYRON cria uma chave
   aleatória, guarda só o resumo dela (sha256) em cyron_estudio_link, com
   prazo de algumas horas, e manda o link estudio.html#t=<chave>. A página
   chama esta função com a chave; sem chave válida, nada sai e nada entra.

   Sem login de propósito ("anônima", o dono): o link já diz quem é, e
   ninguém precisa autorizar app nenhum para escolher uma cor.

   O que pode ser salvo quem decide é estudio-regras.js (regras.js aqui, o
   mesmo arquivo que o bot e a página usam): o estilo pedido passa por
   estiloValido com os votos DO BANCO, então mexer no navegador para salvar
   um herói que não liberou só salva o padrão. */

import { estiloValido, titulosConquistados } from "./regras.js";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/* Lista fechada, como na cyron-entrar: com "*", qualquer site poderia
   ler o estilo de quem abrisse um link nosso por lá. */
const ORIGENS = new Set([
  "https://hicyron.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8765",
]);

function cabecalhos(origem: string | null) {
  return {
    "Access-Control-Allow-Origin": origem && ORIGENS.has(origem) ? origem : "",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}

function responder(corpo: unknown, status: number, h: Record<string, string>) {
  return new Response(JSON.stringify(corpo), { status, headers: h });
}

async function resumoDe(chave: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(chave));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sb(caminho: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${caminho}`, {
    ...init,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json",
      ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

Deno.serve(async (req) => {
  const h = cabecalhos(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return responder({ erro: "use POST" }, 405, h);

  let corpo: any;
  try { corpo = await req.json(); } catch { return responder({ erro: "corpo inválido" }, 400, h); }

  const chave = String(corpo?.token || "");
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(chave)) return responder({ erro: "link inválido" }, 401, h);

  try {
    const resumo = await resumoDe(chave);
    const [link] = await sb(`cyron_estudio_link?resumo=eq.${resumo}&select=user_id,nome,avatar,expira_em`) || [];
    if (!link || Date.parse(link.expira_em) < Date.now()) return responder({ erro: "link vencido" }, 401, h);

    const [perfil] = await sb(`cyron_perfil?user_id=eq.${link.user_id}&select=votos,voto_em,estilo`) || [];
    const votos = Number(perfil?.votos) || 0;
    /* O que a pessoa já fez (votos, línguas, vitórias, sequência), numa ida
       só: é com isso que se sabe quais títulos ela pode escolher. */
    const feitos = await sb("rpc/cyron_conquistas", { method: "POST", body: JSON.stringify({ p_user: link.user_id }) })
      .catch(() => null) || { votos };
    const titulos = titulosConquistados(feitos);

    if (corpo.acao === "ler") {
      return responder({ nome: link.nome, avatar: link.avatar, votos, voto_em: perfil?.voto_em || null,
        feitos, titulos, estilo: estiloValido(perfil?.estilo, votos, titulos) }, 200, h);
    }

    if (corpo.acao === "salvar") {
      const estilo = estiloValido(corpo.estilo, votos, titulos);
      /* Upsert só com estilo e hora: num perfil novo, votos nasce 0 (o
         padrão da tabela); num existente, os votos ficam como estão. */
      await sb("cyron_perfil", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: link.user_id, estilo, atualizado_em: new Date().toISOString() }) });
      return responder({ ok: true, estilo }, 200, h);
    }

    return responder({ erro: "ação desconhecida" }, 400, h);
  } catch (e) {
    console.error("cyron-estudio:", String((e as Error)?.message || e).slice(0, 200));
    return responder({ erro: "falha ao falar com o banco" }, 500, h);
  }
});
