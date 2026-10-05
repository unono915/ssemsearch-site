// Capture fresh examples from the actual desktop app using isolated, fictional data.
// Run from the desktop project: node website/scripts/capture-app.cjs
const { _electron: electron, expect } = require('@playwright/test');
const { mkdtemp, readFile } = require('node:fs/promises');
const { join, resolve } = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const XLSX = require('xlsx');

(async () => {
  const sourceCode = await readFile('website/app.js', 'utf8');
  const dataCode = sourceCode.slice(0, sourceCode.indexOf('const normalize'));
  const people = vm.runInNewContext(dataCode + '\npeople');
  if (new Set(people.map(p => p.name)).size !== people.length || people.some(p => !/^\d{3}$/.test(p.extension))) throw Error('Invalid demo data');
  const dir = await mkdtemp(join(os.tmpdir(), 'ssemsearch-site-capture-'));
  const file = join(dir, '예시 명단.xlsx');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['이름', '교무실', '내선번호'], ...people.map(p => [p.name, p.office, p.extension])]), '명단');
  XLSX.writeFile(book, file);
  let app;
  try {
    app = await electron.launch({ args: ['.', `--user-data-dir=${join(dir, 'data')}`] });
    await expect.poll(() => app.windows().length).toBe(3);
    const settings = app.windows().find(p => p.url().includes('view=settings'));
    const search = app.windows().find(p => p.url().includes('view=search'));
    await app.evaluate(({ dialog }, filePath) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filePath] }); }, file);
    await settings.getByRole('button', { name: '엑셀 파일 선택' }).click();
    await settings.getByRole('button', { name: '내용 확인' }).click();
    await expect(settings.locator('tbody tr')).toHaveCount(6);
    // Expand the scroll container for the capture, retaining the app's actual table.
    await settings.addStyleTag({ content: '[class*="previewTable"] { max-height: none !important; overflow: visible !important; }' });
    await settings.locator('table').screenshot({ path: resolve('website/assets/import-preview-v2.png') });
    await settings.getByRole('button', { name: '다음: 전체 교체 확인' }).click();
    await settings.getByRole('button', { name: '확인하고 전체 교체' }).click();
    await settings.getByRole('button', { name: '검색 시작하기' }).click();
    await search.getByRole('searchbox').fill('본관');
    await expect(search.getByRole('listitem')).toHaveCount(2);
    await expect(search.getByText('232', { exact: true })).toBeVisible();
    await search.screenshot({ path: resolve('website/assets/search-v2.png') });
    console.log('Captured actual app: 6 unique names, 3-digit extensions; search 본관 returns 김민수 231 and 박지훈 232.');
  } finally { if (app) await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
