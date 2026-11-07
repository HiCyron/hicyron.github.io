"""Trilha de fundo sintetizada (sem direito autoral de ninguém): pop leve a 104 BPM.

Uso: python3 musica.py duracao_em_segundos saida.wav
"""
import sys, wave
import numpy as np

SR = 48000
BPM = 104
dur = float(sys.argv[1])
n = int(SR * dur)
t = np.arange(n) / SR
beat = 60 / BPM
rng = np.random.default_rng(7)


def nota(m):  # número MIDI -> Hz
    return 440.0 * 2 ** ((m - 69) / 12)


def env(tam, ataque=0.01, queda=0.3):
    x = np.arange(tam) / SR
    a = np.clip(x / ataque, 0, 1)
    return a * np.exp(-x / queda)


def tom(freq, tam, forma="tri"):
    x = np.arange(tam) / SR
    fase = (freq * x) % 1.0
    if forma == "tri":
        return 4 * np.abs(fase - 0.5) - 1
    return np.sin(2 * np.pi * freq * x)


mix = np.zeros((n, 2))


def por(sinal, inicio, pan=0.0, vol=1.0):
    i = int(inicio * SR)
    if i >= n:
        return
    s = sinal[: n - i] * vol
    mix[i:i + len(s), 0] += s * (1 - pan) * 0.5 ** 0.5 * 1.2
    mix[i:i + len(s), 1] += s * (1 + pan) * 0.5 ** 0.5 * 1.2


# Am - F - C - G, um acorde por compasso (4 tempos)
acordes = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
baixos = [45, 41, 36, 43]
compasso = 4 * beat
k = 0
while k * compasso < dur:
    ac, bx = acordes[k % 4], baixos[k % 4]
    ini = k * compasso
    tam = int(compasso * SR)
    # pad suave (seno com leve desafino)
    for m in ac:
        for desafino, pan in ((-0.07, -0.4), (0.07, 0.4)):
            p = tom(nota(m + 12) * (1 + desafino / 100), tam, "seno") * env(tam, 0.4, 3.0)
            por(p, ini, pan, 0.045)
    # baixo nos tempos 1 e 3
    for b in (0, 2):
        tb = int(beat * 1.8 * SR)
        por(tom(nota(bx), tb, "tri") * env(tb, 0.005, 0.35), ini + b * beat, 0, 0.16)
    # arpejo em colcheias
    seq = ac + [ac[1] + 12, ac[2], ac[1]] + ac[:2]
    for j, m in enumerate(seq):
        ta = int(beat * 0.9 * SR)
        s = tom(nota(m + 12), ta, "tri") * env(ta, 0.003, 0.18)
        por(s, ini + j * beat / 2, -0.3 if j % 2 else 0.3, 0.07)
    # bateria leve: bumbo em 1 e 3, palma em 2 e 4, chimbal em colcheias
    for b in range(4):
        tb = int(0.35 * SR)
        x = np.arange(tb) / SR
        if b in (0, 2):
            f = 50 + 90 * np.exp(-x * 30)
            bumbo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9)
            por(bumbo, ini + b * beat, 0, 0.42)
        else:
            ruido = rng.standard_normal(tb) * np.exp(-x * 22)
            palma = np.diff(ruido, prepend=0)
            por(palma, ini + b * beat, 0.1, 0.06)
    for c in range(8):
        th = int(0.06 * SR)
        x = np.arange(th) / SR
        chimbal = np.diff(np.diff(rng.standard_normal(th), prepend=0), prepend=0) * np.exp(-x * 60)
        por(chimbal, ini + c * beat / 2, -0.2, 0.025 if c % 2 else 0.04)
    k += 1

# reverb curta por convolução (FFT)
ir_t = int(1.2 * SR)
ir = rng.standard_normal(ir_t) * np.exp(-np.arange(ir_t) / SR * 4.5)
ir /= np.abs(ir).sum() / 6
for c in range(2):
    tamfft = 1 << int(np.ceil(np.log2(n + ir_t)))
    molhado = np.fft.irfft(np.fft.rfft(mix[:, c], tamfft) * np.fft.rfft(ir, tamfft), tamfft)[:n]
    mix[:, c] = mix[:, c] * 0.85 + molhado * 0.25

# entrada e saída suaves, e limitador
fade = np.ones(n)
fi, fo = int(0.8 * SR), int(1.5 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.9 / max(1e-9, np.abs(mix).max())

with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"trilha pronta: {dur:.1f}s")
