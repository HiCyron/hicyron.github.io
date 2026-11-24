-- 🎨 O Estúdio CYRON: a personalização de cada pessoa e os votos no top.gg.
--
-- O dono (24/11/2026): votar no top.gg libera a personalização, escolhida
-- numa página do site, sem login, com prévia ao vivo. As regras (o que cada
-- voto libera) moram em estudio-regras.js; aqui só se guarda.
--
-- Sem policy de propósito: só o bot e a função cyron-estudio (service role)
-- leem e escrevem.

-- O estilo e os votos de cada pessoa. É da PESSOA, não do servidor: o mesmo
-- /perfil e o mesmo cartão em todo servidor onde ela estiver.
create table if not exists cyron_perfil (
  user_id       text        primary key check (user_id ~ '^[0-9]{5,25}$'),
  votos         integer     not null default 0 check (votos >= 0),
  -- O created_at do último voto contado, como o top.gg devolve. É o que
  -- impede contar o mesmo voto duas vezes (ver cyron_contar_voto).
  voto_em       timestamptz,
  estilo        jsonb       not null default '{}'::jsonb
                check (jsonb_typeof(estilo) = 'object' and pg_column_size(estilo) < 4000),
  atualizado_em timestamptz not null default now()
);
alter table cyron_perfil enable row level security;

-- O link pessoal do estúdio. A chave vai no link (depois do "#") e só o
-- resumo dela (sha256) fica aqui: quem ler esta tabela não consegue montar
-- um link que funcione. Nome e foto vêm junto para a página mostrar a
-- prévia com a cara da pessoa sem perguntar nada ao Discord.
create table if not exists cyron_estudio_link (
  resumo    text        primary key check (resumo ~ '^[0-9a-f]{64}$'),
  user_id   text        not null check (user_id ~ '^[0-9]{5,25}$'),
  nome      text        not null default '' check (length(nome) <= 100),
  avatar    text        not null default '' check (length(avatar) <= 300),
  expira_em timestamptz not null
);
alter table cyron_estudio_link enable row level security;
create index if not exists cyron_estudio_link_expira on cyron_estudio_link (expira_em);

-- Conta um voto, uma vez só. Soma só se este voto é mais novo que o último
-- contado (mais a folga: 0 quando o top.gg diz a hora do voto; 11 horas
-- quando só diz "votou nas últimas 12 horas"). Peso 2 no fim de semana,
-- como no top.gg. Devolve o total de votos, ou NULL se esse voto já tinha
-- sido contado.
create or replace function cyron_contar_voto(p_user text, p_quando timestamptz, p_peso integer,
  p_folga interval default '0 seconds')
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_peso  integer := greatest(1, least(coalesce(p_peso, 1), 2));
  v_total integer;
begin
  insert into cyron_perfil as p (user_id, votos, voto_em)
  values (p_user, v_peso, p_quando)
  on conflict (user_id) do update
     set votos = p.votos + v_peso, voto_em = p_quando, atualizado_em = now()
   where p.voto_em is null or p_quando > p.voto_em + p_folga
  returning p.votos into v_total;
  return v_total;
end $$;

revoke all on function cyron_contar_voto(text, timestamptz, integer, interval) from public, anon, authenticated;
grant execute on function cyron_contar_voto(text, timestamptz, integer, interval) to service_role;
