# CYRON

Bot de tradução para Discord, e o site dele: https://hicyron.github.io

| Pasta | O que é |
|---|---|
| `discord-bot-gateway/` | o bot (Node, roda no Fly.io) e os testes (`node testes.js`) |
| `cyron/` | o site, publicado aqui pelo `publicar.yml` |
| `supabase/migracoes/` | as migrações do banco, em ordem |
| `supabase/functions/` | as funções da CYRON no Supabase: login do painel e pagamentos |

Até outubro de 2026 tudo isso morava em `portal-alianca/portal-alianca.github.io`. A história anterior a
esta mudança continua lá.

## Robôs (Actions)

| Arquivo | Quando roda | Segredos |
|---|---|---|
| `testes-bot.yml` | em todo PR que mexe no bot, no site ou nas migrações | — |
| `deploy-bot.yml` | push na `main` em `discord-bot-gateway/` | `FLY_API_TOKEN` |
| `vigia-do-bot.yml` | a cada 15 min | `FLY_API_TOKEN`, `DISCORD_WEBHOOK_ERROS` |
| `estado-do-bot.yml`, `ligar-o-bot.yml` | na mão | `FLY_API_TOKEN` |
| `backup-do-banco.yml` | todo dia | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_FRASE_SECRETA` |
| `publicar.yml` | push na `main` em `cyron/` | — |

Segredo se cadastra em **Settings → Secrets and variables → Actions**, e nunca num chat ou commit.
