#!/usr/bin/env bash
# Prepara a pasta para gravar: as figuras da CYRON e as fontes (latim, chinês, tailandês).
# Uso: bash preparar.sh   (de dentro de video-divulgacao/)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p img fontes
for f in cyron aceno gg kkk amei mundo traduz_ai uau; do cp ../discord-bot-gateway/img/figurinhas/$f.png img/; done
cp ../cyron/img/cyron-corpo.webp ../cyron/img/cyron-og.jpg img/
cd fontes
for p in noto-sans noto-sans-sc noto-sans-thai; do
  [ -d "$p" ] && continue
  npm pack -q "@fontsource/$p@5.1.1" >/dev/null
  mkdir -p "$p" && tar -xzf "fontsource-$p-5.1.1.tgz" -C "$p" && rm "fontsource-$p-5.1.1.tgz"
done
echo "pronto"
