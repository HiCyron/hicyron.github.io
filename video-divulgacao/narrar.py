"""Narração do vídeo: um trecho por cena, com o tempo de cada palavra.

Uso: python3 narrar.py roteiro-en.json saida/
Gera saida/voz.wav e saida/tempos.json (início/fim de cada cena e de cada palavra).
"""
import asyncio, json, os, subprocess, sys

import certifi
if os.path.exists("/root/.ccr/ca-bundle.crt"):  # o proxy do ambiente da nuvem
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts

PAUSA = 0.28  # respiro entre uma cena e outra, em segundos


async def falar(texto, voz, taxa, tom, destino):
    c = edge_tts.Communicate(texto, voz, rate=taxa, pitch=tom, boundary="WordBoundary",
                             proxy=os.environ.get("HTTPS_PROXY"))
    palavras, audio = [], bytearray()
    async for parte in c.stream():
        if parte["type"] == "audio":
            audio.extend(parte["data"])
        elif parte["type"] == "WordBoundary":
            palavras.append({"t0": parte["offset"] / 1e7, "t1": (parte["offset"] + parte["duration"]) / 1e7,
                             "texto": parte["text"]})
    with open(destino, "wb") as f:
        f.write(audio)
    return palavras


def marcar_quebras(fala, palavras):
    """A legenda quebra onde a frase original tem pontuação (a fala do edge-tts vem sem ela)."""
    pos = 0
    for p in palavras:
        i = fala.find(p["texto"], pos)
        if i < 0:
            continue
        pos = i + len(p["texto"])
        resto = fala[pos:pos + 3].lstrip("\"'”’)")
        p["quebra"] = bool(resto) and resto[0] in ".,?!…;:"


def duracao(arquivo):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", arquivo]).decode().strip())


async def main(roteiro_arq, pasta):
    os.makedirs(pasta, exist_ok=True)
    roteiro = json.load(open(roteiro_arq, encoding="utf-8"))
    voz, taxa, tom = roteiro["voz"], roteiro.get("taxa", "+0%"), roteiro.get("tom", "+0Hz")
    cenas, agora, lista = [], 0.35, []
    for i, cena in enumerate(roteiro["cenas"]):
        mp3 = os.path.join(pasta, f"trecho{i:02d}.mp3")
        for tentativa in range(4):
            palavras = await falar(cena["fala"], voz, taxa, tom, mp3)
            d = duracao(mp3)
            # edge-tts às vezes corta o fim: a última palavra tem que caber no áudio
            if palavras and palavras[-1]["t1"] <= d + 0.05:
                break
        marcar_quebras(cena["fala"], palavras)
        cenas.append({"id": cena["id"], "inicio": agora, "fim": agora + d,
                      "palavras": [{**p, "t0": p["t0"] + agora, "t1": p["t1"] + agora} for p in palavras]})
        lista.append((mp3, agora))
        agora += d + cena.get("pausa", PAUSA)  # cena com ação depois da fala pede respiro maior
    total = agora + roteiro.get("final", 1.2)
    # junta os trechos nos tempos certos, num wav só
    entradas, filtros = [], []
    for j, (mp3, t) in enumerate(lista):
        entradas += ["-i", mp3]
        filtros.append(f"[{j}:a]adelay={int(t * 1000)}|{int(t * 1000)},aresample=48000[a{j}]")
    mix = "".join(f"[a{j}]" for j in range(len(lista))) + f"amix=inputs={len(lista)}:normalize=0,apad=whole_dur={total}[v]"
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", *entradas, "-filter_complex", ";".join(filtros) + ";" + mix,
                           "-map", "[v]", "-ac", "2", "-ar", "48000", os.path.join(pasta, "voz.wav")])
    json.dump({"total": total, "cenas": cenas}, open(os.path.join(pasta, "tempos.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"voz pronta: {total:.2f}s, {len(cenas)} cenas")


asyncio.run(main(sys.argv[1], sys.argv[2]))
