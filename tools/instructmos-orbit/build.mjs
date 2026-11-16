import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const fromHere = relative => fileURLToPath(new URL(relative, import.meta.url));
const html = fromHere('../../docs/instructmos/index.html');
const license = await readFile(fromHere('node_modules/three/LICENSE'), 'utf8');
const { outputFiles } = await build({
  entryPoints: [fromHere('scene.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  supported: { 'template-literal': false },
  charset: 'utf8',
  legalComments: 'none',
  banner: { js: '/*! Three.js 0.187.0\n' + license.trim() + '\n*/' },
  write: false,
});
const input = await readFile(html, 'utf8');
const marker = /(<script id="imos-orbit-bundle">\r?\n)[\s\S]*?(\r?\n<\/script>)/;
if (!marker.test(input)) throw new Error('Orbit script placeholder is missing');
const bundle = outputFiles[0].text.trimEnd().replace(/<\/script/gi, '<\\/script');
await writeFile(html, input.replace(marker, (_, open, close) => open + bundle + close));
