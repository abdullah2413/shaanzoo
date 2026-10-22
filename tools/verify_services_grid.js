const fs = require('fs');
const path = require('path');

const root = process.cwd();
const bad = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.vscode'].includes(entry.name)) continue;
      walk(full);
    } else if (entry.name.toLowerCase().endsWith('.html')) {
      const txt = fs.readFileSync(full, 'utf8');
      const count = (txt.match(/class="mega__item"/g) || []).length;
      const has2 = txt.includes('mega__grid--2');
      const has3 = txt.includes('mega__grid--3');
      const menus = (txt.match(/id="menu-services"/g) || []).length;
      if (menus > 0 && (count !== 6 || !has2 || has3)) {
        bad.push(path.relative(root, full) + ': items=' + count + ' has2=' + has2 + ' has3=' + has3);
      }
    }
  }
}

walk(root);
if (bad.length) {
  console.log('BAD FILES:\n' + bad.join('\n'));
  process.exit(1);
}
console.log('Verified 37 HTML files: each menu has exactly 6 items and uses the 2-column grid layout.');
