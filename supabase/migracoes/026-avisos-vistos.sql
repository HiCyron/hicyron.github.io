-- 🆕 Os avisos de novidade que cada pessoa já viu (por exemplo o do Estúdio
-- no cartão da bandeira). Uma linha por pessoa e aviso: é o que impede o
-- mesmo aviso de voltar a cada reinício do bot. A limpeza do bot apaga o que
-- tem mais de 180 dias (GUARDO_POR).
-- Sem policy de propósito: só o bot (service role) lê e escreve.
create table if not exists cyron_aviso_visto (
  user_id  text        not null check (user_id ~ '^[0-9]{5,25}$'),
  aviso    text        not null check (aviso ~ '^[a-z_]{2,30}$'),
  visto_em timestamptz not null default now(),
  primary key (user_id, aviso)
);
alter table cyron_aviso_visto enable row level security;
