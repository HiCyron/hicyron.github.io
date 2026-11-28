-- 🚩 A tradução por bandeira (reagir com a bandeira de um país e a mensagem
-- sai naquela língua) sempre esteve ligada e sem jeito de desligar: o código
-- só olhava `tradutor_bandeira === false`, mas a coluna não existia, então
-- ninguém nunca conseguia pôr `false`. Agora ela existe, e nasce LIGADA (true)
-- para não mudar nada em quem já usa — só passa a dar para desligar (pelo app,
-- no botão de Funções).
-- Sem policy de propósito: só o bot (service role) lê e escreve.
alter table cyron_servidor
  add column if not exists tradutor_bandeira boolean not null default true;
