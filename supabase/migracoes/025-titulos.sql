-- 🏷️ Os títulos do Estúdio: o botão embaixo da mensagem da pessoa nas outras
-- salas ("💜 Apoiador"). Cada título se ganha jogando; as regras moram em
-- estudio-regras.js (TITULOS). Aqui: o que falta guardar e a consulta que
-- junta tudo de uma vez.

-- As línguas para as quais a pessoa já traduziu com bandeira (o Poliglota
-- pede 5). Só o código da língua, sem mensagem nenhuma.
alter table cyron_perfil add column if not exists linguas text[] not null default '{}'
  check (cardinality(linguas) <= 150);

-- Anota uma língua, uma vez só. Não escreve nada se ela já estava lá.
create or replace function cyron_anotar_lingua(p_user text, p_lingua text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user !~ '^[0-9]{5,25}$' or p_lingua !~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$' then return; end if;
  insert into cyron_perfil as p (user_id, linguas) values (p_user, array[p_lingua])
  on conflict (user_id) do update set linguas = array_append(p.linguas, p_lingua)
   where not (p_lingua = any(p.linguas)) and cardinality(p.linguas) < 150;
end $$;

-- O que a pessoa já fez, numa ida só ao banco: votos, línguas, vitórias no
-- Duelo e a melhor sequência do /diario. Quem decide o título com isso é
-- titulosConquistados (estudio-regras.js), no bot e na função do Estúdio.
create or replace function cyron_conquistas(p_user text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'votos',     coalesce((select votos from cyron_perfil where user_id = p_user), 0),
    'linguas',   coalesce((select cardinality(linguas) from cyron_perfil where user_id = p_user), 0),
    'vitorias',  coalesce((select sum(vitorias) from cyron_duelo_personagem where user_id = p_user), 0),
    'sequencia', coalesce((select melhor from cyron_diario where user_id = p_user), 0));
$$;

revoke all on function cyron_anotar_lingua(text, text) from public, anon, authenticated;
revoke all on function cyron_conquistas(text) from public, anon, authenticated;
grant execute on function cyron_anotar_lingua(text, text) to service_role;
grant execute on function cyron_conquistas(text) to service_role;
