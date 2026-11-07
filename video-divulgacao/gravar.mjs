// Grava a cena quadro a quadro e junta com a voz e a trilha.
// Uso: node gravar.mjs roteiro.json saida/ [previa]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

const [roteiroArq, pasta, modo] = process.argv.slice(2);
const roteiro = JSON.parse(readFileSync(roteiroArq, "utf8"));
const tempos = JSON.parse(readFileSync(path.join(pasta, "tempos.json"), "utf8"));
const FPS = 30;
const aqui = path.dirname(new URL(import.meta.url).pathname);

const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await pag.goto(pathToFileURL(path.join(aqui, roteiro.cena || "cena.html")).href);
await pag.evaluate(([tl, tx]) => window.montar(tl, tx), [tempos, roteiro.textos]);
// passa por todas as cenas uma vez: as fontes de cada escrita carregam antes de gravar
for (const c of tempos.cenas) await pag.evaluate((t) => window.render(t), (c.inicio + c.fim) / 2);
await pag.evaluate(() => document.fonts.ready);
await pag.waitForTimeout(1500);

if (modo === "previa") {
  mkdirSync(path.join(pasta, "previa"), { recursive: true });
  for (const [i, c] of tempos.cenas.entries()) {
    const prox = (tempos.cenas[i + 1] || { inicio: tempos.total }).inicio;
    for (const fr of [0.35, 0.85]) {
      const t = c.inicio + (prox - c.inicio) * fr;
      for (let k = 6; k >= 0; k--) await pag.evaluate((t) => window.render(t), t - k / 30); // anima ate o ponto
      await pag.screenshot({ path: path.join(pasta, "previa", `${String(i).padStart(2, "0")}-${c.id}-${fr}.jpg`), type: "jpeg", quality: 80 });
    }
  }
  await nav.close();
  console.log("prévias prontas");
  process.exit(0);
}

const quadros = path.join(pasta, "quadros");
rmSync(quadros, { recursive: true, force: true });
mkdirSync(quadros, { recursive: true });
const total = Math.ceil(tempos.total * FPS);
for (let f = 0; f < total; f++) {
  await pag.evaluate((t) => window.render(t), f / FPS);
  await pag.screenshot({ path: path.join(quadros, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 });
  if (f % 150 === 0) console.log(`quadro ${f}/${total}`);
}
await nav.close();

// voz por cima; a trilha abaixa sozinha quando ela fala
const saida = path.join(pasta, "video.mp4");
execFileSync("ffmpeg", ["-y", "-v", "error", "-framerate", String(FPS), "-i", path.join(quadros, "%05d.jpg"),
  "-i", path.join(pasta, "voz.wav"), "-i", path.join(pasta, "musica.wav"),
  "-filter_complex",
  "[2:a]volume=0.42[m];[1:a]asplit=2[v1][v2];[m][v2]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350[md];" +
  "[v1]volume=1.15,acompressor=threshold=0.2:ratio=3:attack=5:release=80[vc];[vc][md]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]",
  "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
console.log("vídeo pronto:", saida);
