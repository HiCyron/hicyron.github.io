// Diz quais gatilhos da cena não acharam a palavra na narração (e quando cada um cai).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
const aqui = path.dirname(new URL(import.meta.url).pathname);
const nav = await chromium.launch();
for (const [rot, pasta] of process.argv.slice(2).map((x) => x.split(":"))) {
  const r = JSON.parse(readFileSync(rot, "utf8")), t = JSON.parse(readFileSync(path.join(pasta, "tempos.json"), "utf8"));
  const pag = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
  await pag.goto(pathToFileURL(path.join(aqui, r.cena)).href);
  const faltas = await pag.evaluate(([tl, tx]) => { window.montar(tl, tx); return window.FALTAS; }, [t, r.textos]);
  console.log(rot, faltas.length ? "FALTAM: " + faltas.join(", ") : "todos os gatilhos acharam a palavra");
  await pag.close();
}
await nav.close();
