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

**A CYRON em uso** (`roteiro-pt-uso.json` + `cena-uso.html`, ~2 min, em português): a versão fluida,
como uma gravação de tela — a lista de canais desliza, o teclado sobe e digita, aparece "fulano está
digitando…", os menus abrem de baixo, a notificação chega e é tocada, e cada toque do dedo acontece
na palavra em que a narração fala dele (a cena lê o tempo de cada palavra no `tempos.json`).
Prévia em instantes escolhidos: `node gravar.mjs roteiro-pt-uso.json saida-uso previa 17.3,36.7,81.1`.

**Diário da CYRON — Ep. 1: Como eu surgi** (`roteiro-historia-pt.json` + `cena-historia.html`, ~1 min 37 s,
em português): a CYRON conta a própria história em primeira pessoa — a aliança [TOP] Best de Kingshot,
os bots que não davam conta, as traduções erradas, o portal, o bot com GIF de rosas, o chat espelhado,
o dia em que ganhou o nome e a virada para qualquer servidor. Cada cena tem a data real do histórico
do projeto, e a expressão da mascote muda conforme a fala (`cara` em `CENAS`, dentro da cena).

Versões asiáticas, nas línguas que mais aparecem entre os jogadores do bot: `roteiro-historia-zh.json`
(chinês simplificado), `roteiro-historia-id.json` (indonésio) e `roteiro-historia-vi.json` (vietnamita).
O roteiro traz em `textos` tudo o que aparece escrito na tela e, em `textos.gatilhos`, a palavra da
narração que faz o papel de cada gatilho em português (`"palavra"` ou `["palavra", n]` para a n-ésima
vez que ela aparece). `"cjk": true` junta a legenda sem espaços, como se escreve em chinês.
Depois de narrar, `node checar-gatilhos.mjs roteiro-historia-zh.json:saida-hist-zh` diz se algum
gatilho não achou a palavra na fala (aí o elemento cairia no meio da cena).
Vozes: `python3 -m edge_tts --list-voices` (ex.: `id-ID-GadisNeural`, `zh-CN-XiaoxiaoNeural`, `th-TH-PremwadeeNeural`).

No ambiente da nuvem, o `narrar.py` usa sozinho o certificado do proxy (`/root/.ccr/ca-bundle.crt`).
