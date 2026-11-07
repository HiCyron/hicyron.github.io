# Vídeos de divulgação da CYRON

Vídeo vertical (1080×1920, ~30 s) no estilo dos Reels/TikTok: narração com voz neural,
legenda palavra por palavra, cena animada mostrando a tradução entre salas e trilha própria
(sintetizada aqui, sem direito autoral de ninguém).

1. `bash preparar.sh` — copia as figuras da CYRON e baixa as fontes.
2. `python3 narrar.py roteiro-en.json saida-en` — voz (edge-tts) e o tempo de cada palavra.
3. `python3 musica.py <duração> saida-en/musica.wav` — a trilha (duração = `total` do `tempos.json`).
4. `node gravar.mjs roteiro-en.json saida-en previa` — uma foto por cena, para conferir.
5. `node gravar.mjs roteiro-en.json saida-en` — o vídeo (`saida-en/video.mp4`).
6. Volume para o Instagram: `ffmpeg -i saida-en/video.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 final.mp4`.

Outra língua: copie `roteiro-en.json`, troque `voz`, as `falas` e os `textos`.

**A CYRON na prática** (`roteiro-pt-demo.json` + `cena-demo.html`, ~65 s, em português): um celular
com as telas do Discord mostrando cada função funcionando — escolher a língua, boas-vindas nas salas,
conversa espelhada, resposta traduzida, figurinha e emoji, reação com bandeira, menu de tradução nos
avisos, evento com lembrete e o painel de funções. O roteiro diz qual cena usar (`"cena"`); os mesmos
passos 2 a 6 servem: `python3 narrar.py roteiro-pt-demo.json saida-pt` e assim por diante.
Vozes: `python3 -m edge_tts --list-voices` (ex.: `id-ID-GadisNeural`, `zh-CN-XiaoxiaoNeural`, `th-TH-PremwadeeNeural`).

No ambiente da nuvem, o `narrar.py` usa sozinho o certificado do proxy (`/root/.ccr/ca-bundle.crt`).
