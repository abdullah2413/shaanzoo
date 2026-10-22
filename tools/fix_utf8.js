const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = new Set(['.html', '.js', '.css', '.json', '.md', '.txt', '.xml']);
const replacements = [
  ['–', '–'],
  ['—', '—'],
  ['’', '’'],
  ['“', '“'],
  ['”', '”'],
  ['‘', '‘'],
  ['“', '“'],
  ['·', '·'],
  ['', ''],
  ['', ''],
  ['“¢', '•'],
  ['“\u00a0', ' '],
  ['“\u00a0', ' '],
  ['â\u2014', '—'],
  ['â\u2013', '–'],
  ['â\u2122', '™'],
  ['â\u00a2', '¢'],
  ['â\u00a3', '£'],
  ['â\u00a9', '©'],
  ['â\u00ae', '®'],
  ['â\u00bc', '¼'],
  ['â\u00bd', '½'],
  ['â\u00be', '¾'],
  ['â\u00a0', ' '],
  ['✔', '✔'],
  ['’', '’'],
  ['“\u201d', '”'],
  ['“\u201c', '“']
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (exts.has(path.extname(entry.name).toLowerCase())) {
      try {
        const original = fs.readFileSync(full, 'utf8');
        let updated = original;
        for (const [from, to] of replacements) {
          updated = updated.split(from).join(to);
        }
        if (updated !== original) {
          fs.writeFileSync(full, updated, 'utf8');
          console.log('fixed', path.relative(root, full));
        }
      } catch (err) {
        // ignore unreadable files such as binary outputs or generated assets
      }
    }
  }
}

walk(root);
console.log('UTF-8 repair scan complete.');
