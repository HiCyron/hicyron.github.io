-- 🚨 A vigia da batida, dentro do banco.
--
-- O bot grava "visto" (a hora, em ms) no cyron_ajuste de dois em dois minutos,
-- e só grava quando está ouvindo o Discord. Quem confere se a batida parou não
-- pode ser o bot: morto não avisa que morreu. A esteira do GitHub devia olhar
-- de 15 em 15 minutos e, na prática, olha de 4 em 4 horas (o GitHub atrasa e
-- pula agendamento de repositório com pouco movimento).
--
-- O banco tem relógio próprio (pg_cron) e sabe fazer POST (pg_net). De dois em
-- dois minutos ele olha a batida: parada há mais de 10 minutos, avisa UMA vez
-- no 🐛-erros; quando ela volta, avisa de novo, dizendo quanto tempo ficou
-- parada. O aviso vai pelo webhook que o próprio bot cria e guarda em
-- cyron_ajuste.webhook_vigia (tabela sem policy: só a chave de serviço lê).
--
-- 10 minutos, e não 4: uma publicação derruba o bot por um ou dois minutos, e
-- a vigia não deve gritar a cada deploy.
--
-- p_testar = true manda um cartão de teste, para conferir o caminho inteiro
-- (banco -> pg_net -> Discord) sem precisar derrubar nada.

create or replace function public.cyron_vigiar_batida(p_testar boolean default false)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_gancho  text;
  v_visto   bigint;
  v_avisou  text;
  v_mb      text;
  v_parado  interval;
  v_seg     bigint;
  v_cartao  jsonb;
begin
  select valor into v_gancho from cyron_ajuste where chave = 'webhook_vigia';
  if coalesce(v_gancho, '') !~ '^https://(discord|discordapp)\.com/api/webhooks/\d+/[\w-]+$' then
    return 'sem webhook';
  end if;

  select valor::bigint into v_visto from cyron_ajuste where chave = 'visto' and valor ~ '^\d{10,16}$';
  select valor into v_avisou from cyron_ajuste where chave = 'vigia_avisou';
  select valor into v_mb from cyron_ajuste where chave = 'visto_mb';
  if v_visto is null and not p_testar then return 'sem batida'; end if;

  v_seg := floor(v_visto / 1000);
  v_parado := now() - to_timestamp(v_seg);

  if p_testar then
    v_cartao := jsonb_build_object(
      'title', '🧪 Teste da vigia do banco',
      'color', 5793266,
      'description',
        'O banco conseguiu falar com este canal: se a batida da CYRON parar por mais de '
        || '10 minutos, o aviso chega aqui.' || E'\n\n'
        || case when v_seg is null then 'Ainda não houve batida.'
                else format('Última batida: <t:%s:R>.', v_seg) end
        || E'\n\nNada está fora do ar. Pode apagar esta mensagem.');

  elsif v_parado > interval '10 minutes' then
    if v_avisou is not distinct from v_visto::text then return 'ja avisei'; end if;
    v_cartao := jsonb_build_object(
      'title', '🚨 A CYRON parou de bater',
      'color', 14695998,
      'description',
        format('A batida é o bot dizendo "estou vivo" de 2 em 2 minutos, e a última foi '
          || '**<t:%s:R>** (<t:%s:t>).', v_seg, v_seg) || E'\n\n'
        || 'Isto não é o bot avisando: ele não consegue. É o próprio banco, que confere '
        || 'a batida de 2 em 2 minutos.' || E'\n\n'
        || '**Pode ser:** a máquina caiu, o bot travou, ou ficou surdo para o Discord '
        || '(surdo ele para de bater de propósito).'
        || case when coalesce(v_mb, '') ~ '^\d+$'
                then format(E'\n**Memória na última batida:** %s MB.', v_mb) else '' end
        || E'\n\n**Para religar:** aba **Actions** do repositório → **Ligar o bot** → Run workflow.'
        || E'\nSe você desligou de propósito, pode ignorar.');
    insert into cyron_ajuste (chave, valor, atualizado_em) values ('vigia_avisou', v_visto::text, now())
      on conflict (chave) do update set valor = excluded.valor, atualizado_em = excluded.atualizado_em;

  elsif coalesce(v_avisou, '') ~ '^\d{10,16}$' then
    v_cartao := jsonb_build_object(
      'title', '✅ A CYRON voltou a bater',
      'color', 4437377,
      'description',
        format('Ficou parada uns **%s minutos** (de <t:%s:t> até <t:%s:t>).',
          greatest(1, round((v_visto - v_avisou::bigint) / 60000.0)),
          floor(v_avisou::bigint / 1000), v_seg) || E'\n\n'
        || 'Se ela foi derrubada, o cartão do reinício (com o motivo, quando dá para '
        || 'saber) vem do próprio bot.');
    update cyron_ajuste set valor = '', atualizado_em = now() where chave = 'vigia_avisou';

  else
    return 'de pe';
  end if;

  perform net.http_post(
    url := v_gancho,
    body := jsonb_build_object(
      'username', 'Vigia da CYRON',
      'allowed_mentions', jsonb_build_object('parse', '[]'::jsonb),
      'embeds', jsonb_build_array(v_cartao || jsonb_build_object(
        'timestamp', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))));
  return coalesce(v_cartao->>'title', 'avisei');
end $$;

-- Só o relógio chama. Sem isto a função ficaria exposta como /rpc para
-- qualquer um com a chave pública.
revoke all on function public.cyron_vigiar_batida(boolean) from public, anon, authenticated;

select cron.schedule('vigia_da_batida', '*/2 * * * *', 'select public.cyron_vigiar_batida()');
