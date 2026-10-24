-- 🧹 O diário do relógio do banco.
--
-- O pg_cron anota cada volta em cron.job_run_details e nunca apaga nada. Com o
-- top_avisos rodando de minuto em minuto, isso virou 104 mil linhas (17 MB de
-- um banco de 45 MB) em dois meses: o maior pedaço do banco era o diário do
-- próprio relógio, e ele entra em todo backup.
--
-- Uma semana basta para investigar qualquer volta que falhou. A limpeza roda
-- todo dia (e não toda semana) para o diário nunca passar de 8 dias: cada
-- volta apaga só um dia de linhas, então é rápida e não segura o banco.
--
-- A primeira limpeza, das 94 mil linhas velhas, foi um delete feito à mão
-- logo antes de agendar isto.

select cron.schedule(
  'limpar_historico_do_cron',
  '20 4 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$
);
