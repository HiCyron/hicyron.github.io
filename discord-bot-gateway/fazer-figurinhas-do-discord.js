/* Desenha as figurinhas padrão do Discord (formato LOTTIE) em GIF.
 *
 * Roda FORA do bot, à mão, quando o Discord lançar pacote novo:
 *
 *   npm i --no-save lottie-web@5.12.2 playwright
 *   node fazer-figurinhas-do-discord.js
 *
 * Precisa de Playwright com Chromium e do ffmpeg na máquina (nada disso vai
 * para a imagem do bot). Escreve os GIFs em ../cyron/figurinhas-discord/<id>.gif
 * (o site os publica) e a lista em ./figurinhas-do-discord.js (o bot a lê).
 *
 * Por quê: essas figurinhas não existem como imagem -- o Discord só entrega
 * um .json de animação --, e webhook não manda figurinha. Sem isto, quem
 * mandava o Wumpus numa sala aparecia nas outras como "🎨 wumpus", só o nome.
 * Desenhar no bot custaria um navegador inteiro numa máquina de 256 MB;
 * desenhar uma vez aqui custa zero lá.
 *
 * As de formato APNG (o outro tipo dos pacotes oficiais) já têm imagem e não
 * passam por aqui. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(aqui, "..", "cyron", "figurinhas-discord");
const LADO = 160, FPS = 15, MAX_SEG = 4;

const require = createRequire(import.meta.url);
const lottieJs = readFileSync(require.resolve("lottie-web/build/player/lottie_canvas.min.js"), "utf8");

/* O fetch do Node é barrado pelo Cloudflare do Discord sem um User-Agent. */
const UA = { "User-Agent": "CYRON (https://hicyron.github.io, figurinhas)" };

const pacotes = (await (await fetch("https://discord.com/api/v10/sticker-packs", { headers: UA })).json()).sticker_packs;
const lottie = pacotes.flatMap((p) => p.stickers).filter((s) => s.format_type === 3);
mkdirSync(SAIDA, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: LADO, height: LADO } });
await page.setContent(`<div id="c" style="width:${LADO}px;height:${LADO}px"></div>`);
await page.addScriptTag({ content: lottieJs });

const feitas = [];
for (const s of lottie) {
  const gif = path.join(SAIDA, `${s.id}.gif`);
  if (!existsSync(gif)) {
    const r = await fetch(`https://cdn.discordapp.com/stickers/${s.id}.json`, { headers: UA });
    if (!r.ok) { console.error(`sem animação: ${s.id} ${s.name} (${r.status})`); continue; }
    const dados = await r.json();
    const quadros = await page.evaluate(async ({ dados, FPS, MAX_SEG }) => {
      const c = document.getElementById("c");
      c.innerHTML = "";
      const anim = lottie.loadAnimation({ container: c, renderer: "canvas", loop: false, autoplay: false,
        animationData: dados, rendererSettings: { clearCanvas: true, preserveAspectRatio: "xMidYMid meet" } });
      await new Promise((ok) => (anim.isLoaded ? ok() : anim.addEventListener("DOMLoaded", ok)));
      const total = anim.totalFrames, fr = anim.frameRate || 60;
      const n = Math.max(1, Math.round(Math.min(total / fr, MAX_SEG) * FPS));
      const canvas = c.querySelector("canvas");
      const fora = [];
      for (let i = 0; i < n; i++) {
        anim.goToAndStop(Math.min(total - 1, (i * fr) / FPS), true);
        fora.push(canvas.toDataURL("image/png"));
      }
      anim.destroy();
      return fora;
    }, { dados, FPS, MAX_SEG });
    const pasta = path.join(SAIDA, `.quadros-${s.id}`);
    mkdirSync(pasta, { recursive: true });
    quadros.forEach((q, i) => writeFileSync(path.join(pasta, `f${String(i).padStart(3, "0")}.png`),
      Buffer.from(q.split(",")[1], "base64")));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(pasta, "f%03d.png"),
      "-filter_complex", `[0:v]scale=${LADO}:${LADO}:flags=lanczos,split[a][b];` +
        "[a]palettegen=reserve_transparent=1:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:alpha_threshold=128",
      "-loop", "0", gif]);
    rmSync(pasta, { recursive: true, force: true });
  }
  feitas.push(s.id);
}
await browser.close();

writeFileSync(path.join(aqui, "figurinhas-do-discord.js"),
  "/* As figurinhas padrão do Discord (LOTTIE) que já viraram GIF no site,\n" +
  "   em cyron/figurinhas-discord/<id>.gif. Gerado por fazer-figurinhas-do-discord.js:\n" +
  "   não edite à mão. */\n" +
  `export const FIGURINHAS_DO_DISCORD = new Set(${JSON.stringify(feitas.sort(), null, 0).replace(/,/g, ", ")});\n`);
console.log(`${feitas.length} figurinhas prontas`);
