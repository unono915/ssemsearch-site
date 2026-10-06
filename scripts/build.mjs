import { mkdir, cp, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const name of ['index.html', 'privacy.html', 'support.html', 'styles.css', 'app.js', 'robots.txt']) {
  await copyFile(path.join(root, name), path.join(root, 'dist', name));
}
await cp(path.join(root, 'assets'), path.join(root, 'dist/assets'), { recursive: true });
console.log('Built static landing page in dist/');
