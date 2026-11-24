// Tira a foto de cada parte de arte-topgg.html e grava em cyron/img/topgg/.
// Rodar da raiz do repositório:  node video-divulgacao/fazer-arte-topgg.mjs
// O site (GitHub Pages) serve as imagens; a página do top.gg aponta para elas.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* O Playwright do ambiente é global: o require acha, o import não. */
const { chromium } = createRequire(import.meta.url)("playwright");

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(aqui, "..", "cyron", "img", "topgg");
mkdirSync(saida, { recursive: true });

const PARTES = ["topo", "como", "comparacao", "bandeira", "recursos", "kingshot", "botao"];
const LINGUAS = ["en", "pt"];

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
for (const lingua of LINGUAS) {
  for (const parte of PARTES) {
    const url = "file://" + path.join(aqui, "arte-topgg.html") + `?parte=${parte}&lingua=${lingua}`;
    await pagina.goto(url, { waitUntil: "load" });
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.waitForTimeout(300);
    const alvo = await pagina.$(`#${parte}`);
    const arquivo = path.join(saida, `${parte}-${lingua}.jpg`);
    await alvo.screenshot({ path: arquivo, type: "jpeg", quality: 88 });
    console.log("feito", path.relative(path.join(aqui, ".."), arquivo));
  }
}
await navegador.close();
