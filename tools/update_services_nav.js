const fs = require('fs');
const path = require('path');

const root = 'c:/Users/DELL/OneDrive/Desktop/shanzo';

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.html')) results.push(full);
  }
  return results;
}

function findMatchingCloseDiv(html, startIndex) {
  let depth = 0;
  let i = startIndex;
  while (i < html.length) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextOpen === -1 && nextClose === -1) return -1;
    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      i = nextClose + 6;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function relPrefix(filePath) {
  const rel = path.relative(path.dirname(filePath), root).split('\\').join('/');
  if (rel === '' || rel === '.') return '';
  return rel + '/';
}

function desktopMenu(prefix) {
  const entries = [
    ['Data Management', prefix + 'pages/data-management.html', 'Govern, secure and improve critical information'],
    ['Data Integration', prefix + 'pages/data-integration.html', 'Connect systems and automate the flow of data'],
    ['Data Visualization', prefix + 'services/data-visualization.html', 'Turn complex data into clear decisions'],
    ['Software Development &amp; Automation', prefix + 'services/software-development.html', 'Custom tools and workflow automation'],
    ['Consulting &amp; Managed Services', prefix + 'services/consulting-managed-services.html', 'Strategic guidance and dependable support'],
    ['Enterprise Automation', prefix + 'services/enterprise-automation.html', 'Simplify operations with intelligent workflows'],
  ];

  const iconMap = {
    dm: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    di: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M6 12v1a2 2 0 0 0 2 2h7"/><path d="M6 12V9a2 2 0 0 1 2-2h8"/></svg>',
    vis: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15V9"/><path d="M12 15V5"/><path d="M17 15v-7"/></svg>',
    soft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    cons: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>',
    auto: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="5" rx="2"/><path d="M10 9.5h4"/><path d="M12 9.5V16"/></svg>'
  };

  const iconFor = (label) => {
    if (label.includes('Data Management')) return iconMap.dm;
    if (label.includes('Data Integration')) return iconMap.di;
    if (label.includes('Data Visualization')) return iconMap.vis;
    if (label.includes('Software Development')) return iconMap.soft;
    if (label.includes('Consulting')) return iconMap.cons;
    return iconMap.auto;
  };

  const cells = [
    entries.slice(0, 2),
    entries.slice(2, 4),
    entries.slice(4, 6),
  ];

  const htmlCells = cells.map((cell) => {
    const list = cell.map(([label, href, desc]) => {
      return `<li><a class="mega__item" href="${href}"><span class="mega__icon">${iconFor(label)}</span><span><span class="mega__label">${label}</span><span class="mega__desc">${desc}</span></span></a></li>`;
    }).join('');
    return `<div class="mega__col"><ul class="mega__list">${list}</ul></div>`;
  }).join('');

  return `<div class="mega mega--wide" id="menu-services" role="region" aria-label="SHANZOO services"><div class="mega__grid mega__grid--3">${htmlCells}</div><div class="mega__foot"><p class="mega__foot-note">Six core service areas. One accountable partner.</p><a class="btn btn--navy btn--md" href="${prefix}pages/services.html">View all services</a></div></div>`;
}

function mobileMenu(prefix) {
  const items = [
    ['Data Management', prefix + 'pages/data-management.html'],
    ['Data Integration', prefix + 'pages/data-integration.html'],
    ['Data Visualization', prefix + 'services/data-visualization.html'],
    ['Software Development &amp; Automation', prefix + 'services/software-development.html'],
    ['Consulting &amp; Managed Services', prefix + 'services/consulting-managed-services.html'],
    ['Enterprise Automation', prefix + 'services/enterprise-automation.html'],
    ['View All Services', prefix + 'pages/services.html']
  ];
  return `<div class="mobile-nav-panel" data-mobile-panel="services">${items.map(([label, href]) => `<a class="mobile-nav-link" href="${href}">${label}</a>`).join('')}</div>`;
}

function updateFiles() {
  const files = walk(root);
  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const original = html;
    const prefix = relPrefix(file);

    const desktopStart = html.indexOf('<div class="mega mega--wide" id="menu-services"');
    if (desktopStart !== -1) {
      const desktopEnd = findMatchingCloseDiv(html, desktopStart);
      if (desktopEnd !== -1) {
        html = html.slice(0, desktopStart) + desktopMenu(prefix) + html.slice(desktopEnd);
      }
    }

    const mobileStart = html.indexOf('<div class="mobile-nav-group" data-mobile-group="services">');
    if (mobileStart !== -1) {
      const mobileEnd = findMatchingCloseDiv(html, mobileStart);
      if (mobileEnd !== -1) {
        const replacement = `<div class="mobile-nav-group" data-mobile-group="services"><button class="mobile-nav-trigger" type="button" aria-expanded="false" data-mobile-trigger="services"><span>Services</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg></button>${mobileMenu(prefix)}</div>`;
        html = html.slice(0, mobileStart) + replacement + html.slice(mobileEnd);
      }
    }

    if (html !== original) {
      fs.writeFileSync(file, html, 'utf8');
    }
  }
}

function updateServicesLandingPage() {
  const file = path.join(root, 'pages', 'services.html');
  let html = fs.readFileSync(file, 'utf8');
  const capStart = html.indexOf('<div class="cap-grid">');
  if (capStart === -1) return;

  const capEnd = html.indexOf('</div></section>', capStart);
  if (capEnd === -1) return;

  const replacement = `<div class="cap-grid"><a class="cap-card reveal" data-delay="0" href="../pages/data-management.html"><span class="cap-card__num">01</span><span class="cap-card__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></span><h3>Data Management</h3><p>Govern, secure and improve enterprise data across its lifecycle.</p><ul class="cap-card__caps"><li>MDM</li><li>Governance</li><li>Quality</li><li>Metadata</li></ul><span class="cap-card__link">Learn More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a><a class="cap-card reveal" data-delay="1" href="../pages/data-integration.html"><span class="cap-card__num">02</span><span class="cap-card__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span><h3>Data Integration</h3><p>Connect applications and data platforms through scalable integration architectures.</p><ul class="cap-card__caps"><li>ETL / ELT</li><li>CDC</li><li>APIs</li><li>Streaming</li></ul><span class="cap-card__link">Learn More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a><a class="cap-card reveal" data-delay="2" href="../services/data-visualization.html"><span class="cap-card__num">03</span><span class="cap-card__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15V9"/><path d="M12 15V5"/><path d="M17 15v-7"/></svg></span><h3>Data Visualization</h3><p>Turn raw data into operational clarity for business teams and leaders.</p><ul class="cap-card__caps"><li>Dashboards</li><li>KPIs</li><li>Storytelling</li><li>Insights</li></ul><span class="cap-card__link">Learn More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a><a class="cap-card reveal" data-delay="3" href="../services/software-development.html"><span class="cap-card__num">04</span><span class="cap-card__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span><h3>Software Development &amp; Automation</h3><p>Design and build tools that remove friction and automate repetitive work.</p><ul class="cap-card__caps"><li>Custom Apps</li><li>Portals</li><li>Workflows</li><li>APIs</li></ul><span class="cap-card__link">Learn More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a><a class="cap-card reveal" data-delay="4" href="../services/consulting-managed-services.html"><span class="cap-card__num">05</span><span class="cap-card__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg></span><h3>Consulting &amp; Managed Services</h3><p>Get strategic guidance and dependable day-to-day operational support.</p><ul class="cap-card__caps"><li>Advisory</li><li>Delivery</li><li>Support</li><li>Optimization</li></ul><span class="cap-card__link">Learn More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a><a class="cap-card reveal" data-delay="5" href="../services/enterprise-automation.html"><span class="cap-card__num">06</span><span class="cap-card__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="5" rx="2"/><path d="M10 9.5h4"/><path d="M12 9.5V16"/></svg></span><h3>Enterprise Automation</h3><p>Streamline operations with workflows that reduce manual effort and improve control.</p><ul class="cap-card__caps"><li>RPA</li><li>Workflow</li><li>Orchestration</li><li>Monitoring</li></ul><span class="cap-card__link">Learn More <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a></div>`;

  html = html.slice(0, capStart) + replacement + html.slice(capEnd + '</div></section>'.length);
  fs.writeFileSync(file, html, 'utf8');
}

updateFiles();
updateServicesLandingPage();
console.log('Services nav and landing content updated.');
