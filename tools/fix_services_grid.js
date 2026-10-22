const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.vscode'].includes(entry.name)) continue;
      walk(full, out);
    } else if (entry.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(process.cwd());
let changed = 0;

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');

  text = text.replace(
    /<div class="mega mega--wide" <div class="mega mega--wide" id="menu-services" role="region" aria-label="SHANZOO services"><div class="mega__grid mega__grid--2">/g,
    '<div class="mega mega--wide" id="menu-services" role="region" aria-label="SHANZOO services"><div class="mega__grid mega__grid--2">'
  );

  const idIndex = text.indexOf('id="menu-services"');
  if (idIndex === -1) continue;

  const menuStart = text.lastIndexOf('<div class="mega mega--wide"', idIndex);
  const footIndex = text.indexOf('<div class="mega__foot">', idIndex);
  if (menuStart === -1 || footIndex === -1) continue;

  const block = text.slice(menuStart, footIndex);
  const anchors = [...block.matchAll(/<a class="mega__item"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
  if (anchors.length !== 6) continue;

  const replacement = '<div class="mega mega--wide" id="menu-services" role="region" aria-label="SHANZOO services"><div class="mega__grid mega__grid--2">' + anchors.join('') + '</div>';
  text = text.slice(0, menuStart) + replacement + text.slice(footIndex);
  fs.writeFileSync(file, text, 'utf8');
  changed++;
}

console.log('Updated ' + changed + ' HTML files');
