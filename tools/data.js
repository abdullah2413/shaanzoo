/* ==========================================================================
   SHANZOO — Content data (vanilla Node, no dependencies)
   Used by tools/build.js to generate the static HTML pages. Keeping content
   in one place makes maintenance simple and guarantees consistent nav/footer
   across every page.
   ========================================================================== */
"use strict";

const SITE = {
  name: "SHANZOO",
  tagline: "Data Management & Integration Services",
  short: "Enterprise data management and integration consulting from Toronto, Canada.",
  address: "8 Marowyne Dr, Toronto, Ontario, Canada",
  city: "Toronto, Canada",
  phone: "+1 647-546-9772",
  phoneHref: "+16475469772",
  email: "info@sganzoo.com",
  domain: "", // production domain not yet confirmed — leave empty
  dns: "" // empty string keeps links relative for local use
};

/* ----------------------------- Icon system ------------------------------- */
const ICONS = {
  database:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  shield:
    '<path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10z"/><path d="M9 11.5l2 2 4-4"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  circle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  refresh:
    '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  activity:
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  radio:
    '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
  cloud:
    '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  chevron: '<polyline points="6 9 12 15 18 9"/>',
  chevronUp: '<polyline points="18 15 12 9 6 15"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  message:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:
    '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  server:
    '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  archive:
    '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  credit:
    '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  land: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  shop: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  factory:
    '<path d="M2 20h20"/><path d="M4 20V8l5 3V8l5 3V3h6v17"/><line x1="17" y1="12" x2="17" y2="12.01"/><line x1="20" y1="8" x2="20" y2="8.01"/>',
  search:
    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  headset:
    '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  filter:
    '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>',
  git: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6a3 3 0 0 0 3 3h3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>',
  max: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  scale: '<path d="M16 2v4"/><path d="M8 2v4"/><path d="M22 4v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"/><path d="M2 4h20"/>',
  sliders:
    '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
};

function icon(name, extra) {
  const inner = ICONS[name] || ICONS.check;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" ' +
    (extra || "") +
    ">" +
    inner +
    "</svg>"
  );
}

/* ----------------------------- Services ---------------------------------- */
const SERVICES = [
  {
    slug: "master-data-management",
    title: "Master Data Management (MDM)",
    short: "One trusted version of your customers, products and vendors.",
    benefit: "Eliminates duplicate and conflicting records across your systems.",
    cat: "management",
    icon: "database",
    category: "Data Management",
    heroSub:
      "Create one reliable, consistent record for the business information that matters most — customers, products, suppliers and locations.",
  },
  {
    slug: "data-governance",
    title: "Data Governance & Metadata Management",
    short: "Clear rules, owners and definitions for your data.",
    benefit: "Everyone knows what data means, who owns it and how it may be used.",
    cat: "management",
    icon: "shield",
    category: "Data Management",
    heroSub:
      "Put in place the people, policies and tools that keep your data defined, trusted and securely controlled.",
  },
  {
    slug: "data-quality",
    title: "Data Quality & Cleansing",
    short: "Accurate, consistent data you can base decisions on.",
    benefit: "Better reporting and decisions grounded in clean, reliable data.",
    cat: "management",
    icon: "circle",
    category: "Data Management",
    heroSub:
      "Profile, clean and continuously monitor your data so it stays accurate, complete and consistent.",
  },
  {
    slug: "data-security",
    title: "Data Security & Privacy",
    short: "Protect sensitive information and respect privacy rules.",
    benefit: "Reduced risk of breaches and safer handling of personal data.",
    cat: "management",
    icon: "lock",
    category: "Data Management",
    heroSub:
      "Safeguard your most sensitive business information with access controls, masking, encryption and audit trails.",
  },
  {
    slug: "data-architecture",
    title: "Data Architecture & Modeling",
    short: "Purpose-built foundations that scale with your business.",
    benefit: "A data infrastructure that is easy to extend and fast to use.",
    cat: "management",
    icon: "layers",
    category: "Data Management",
    heroSub:
      "Design the databases, warehouses, data lakes and models your business needs to grow without rework.",
  },
  {
    slug: "etl-elt",
    title: "Batch Processing (ETL / ELT)",
    short: "Move and organise large volumes of data on a schedule.",
    benefit: "Consistent, reliable data movement between your key systems.",
    cat: "integration",
    icon: "refresh",
    category: "Data Integration",
    heroSub:
      "Extract, transform and load data between business systems with dependable, repeatable batch pipelines.",
  },
  {
    slug: "change-data-capture",
    title: "Change Data Capture (CDC)",
    short: "Stay in sync the moment data changes.",
    benefit: "Up-to-date systems with minimal impact on your databases.",
    cat: "integration",
    icon: "activity",
    category: "Data Integration",
    heroSub:
      "Capture database changes as they happen and keep downstream systems current without heavy reloads.",
  },
  {
    slug: "api-integration",
    title: "API & Microservices-Based Integration",
    short: "Connect systems safely through well-built interfaces.",
    benefit: "Systems that share data in real time without fragile links.",
    cat: "integration",
    icon: "link",
    category: "Data Integration",
    heroSub:
      "Connect cloud apps, internal systems and partners through clean, secure and reliably monitored APIs.",
  },
  {
    slug: "event-streaming",
    title: "Event-Driven Streaming",
    short: "React to data as it flows from your business.",
    benefit: "Near-real-time insight and automation across your operations.",
    cat: "integration",
    icon: "radio",
    category: "Data Integration",
    heroSub:
      "Move data between systems in near real time with messaging and event streaming, for example Apache Kafka.",
  },
  {
    slug: "data-virtualization",
    title: "Data Virtualization / Federation",
    short: "Query data across systems without moving it.",
    benefit: "One logical view of scattered data, faster, fewer copies.",
    cat: "integration",
    icon: "cloud",
    category: "Data Integration",
    heroSub:
      "Access data from many systems through a single logical layer — without copying it everywhere first.",
  }
];

/* --------------------------- Illustrations ------------------------------- */
function svgNetwork() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Connected data network illustration">' +
    '<defs><linearGradient id="ng" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient>' +
    '<linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#00b876"/><stop offset="1" stop-color="#00965e"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#ng)"/>' +
    '<g stroke="#1e5a8a" stroke-width="1.4" opacity="0.7">' +
    '<line x1="70" y1="70" x2="180" y2="120"/><line x1="180" y1="120" x2="290" y2="70"/>' +
    '<line x1="70" y1="70" x2="180" y2="195"/><line x1="290" y1="70" x2="180" y2="195"/>' +
    '<line x1="180" y1="120" x2="70" y2="210"/><line x1="180" y1="120" x2="300" y2="205"/>' +
    '<line x1="70" y1="210" x2="300" y2="205"/></g>' +
    '<g fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5">' +
    '<rect x="34" y="40" width="72" height="60" rx="10"/><rect x="144" y="90" width="72" height="60" rx="10"/>' +
    '<rect x="254" y="40" width="72" height="60" rx="10"/><rect x="34" y="180" width="72" height="60" rx="10"/>' +
    '<rect x="264" y="175" width="72" height="60" rx="10"/></g>' +
    '<g fill="#d9edf5">' +
    '<path d="M42 60h30M42 72h30M42 84h18"/><path d="M152 112h30M152 124h30M152 136h18"/>' +
    '<path d="M262 60h30M262 72h30M262 84h18"/><path d="M42 202h30M42 214h30M42 226h18"/>' +
    '<path d="M272 197h30M272 209h30M272 221h18"/></g>' +
    '<circle cx="180" cy="120" r="14" fill="url(#gg)" stroke="#8fe6c1" stroke-width="2"/>' +
    '<path d="M174 120l4 4 9-9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="70" cy="70" r="5" fill="#0a7fbe" stroke="none"/>' +
    '<circle cx="290" cy="70" r="5" fill="#0a7fbe" stroke="none"/></svg>'
  );
}

function svgPipeline() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data pipeline illustration">' +
    '<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#pg)"/>' +
    '<g stroke="#2c6a9e" stroke-width="1.5"><line x1="96" y1="60" x2="150" y2="60"/>' +
    '<line x1="210" y1="60" x2="264" y2="60"/><line x1="96" y1="200" x2="150" y2="200"/>' +
    '<line x1="210" y1="200" x2="264" y2="200"/><line x1="180" y1="80" x2="180" y2="180"/>' +
    '<line x1="230" y1="80" x2="230" y2="180"/></g>' +
    '<rect x="30" y="34" width="66" height="52" rx="10" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<rect x="264" y="34" width="66" height="52" rx="10" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<rect x="30" y="174" width="66" height="52" rx="10" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<rect x="264" y="174" width="66" height="52" rx="10" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<g fill="#d9edf5"><path d="M38 46h24M38 58h24M38 70h14"/>' +
    '<path d="M272 46h24M272 58h24M272 70h14"/><path d="M38 186h24M38 198h24M38 210h14"/>' +
    '<path d="M272 186h24M272 198h24M272 210h14"/></g>' +
    '<rect x="150" y="52" width="60" height="20" rx="8" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<rect x="162" y="200" width="60" height="20" rx="8" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<circle cx="180" cy="130" r="24" fill="#00965e" stroke="#8fe6c1" stroke-width="2"/>' +
    '<path d="M166 130h28M180 116v28" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="230" cy="130" r="24" fill="#0a4a7f" stroke="#7fb4dc" stroke-width="2"/>' +
    '<path d="M222 136l5 5 11-13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g fill="#5a6b7a" font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="600">' +
    '<text x="40" y="26">Sources</text><text x="278" y="26">Reporting</text>' +
    '<text x="266" y="236">Targets</text><text x="196" y="236">Data Lake</text></g></svg>'
  );
}

function svgVault() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data security layers illustration">' +
    '<defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#vg)"/>' +
    '<path d="M180 40l92 34v50c0 52-38 84-92 104-54-20-92-52-92-104V74z" fill="none" stroke="#2c6a9e" stroke-width="2"/>' +
    '<path d="M180 56l76 28v42c0 42-31 68-76 84-45-16-76-42-76-84V84z" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<circle cx="180" cy="145" r="26" fill="#00965e" stroke="#8fe6c1" stroke-width="2.5"/>' +
    '<path d="M170 145l7 7 14-16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g fill="#5a6b7a" font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="600" text-anchor="middle">' +
    '<text x="180" y="34">Identity</text><text x="180" y="64" fill="#9fb8cc">Access Controls</text>' +
    '<text x="180" y="226">Encrypted &amp; Audited</text></g>' +
    '<g stroke="#1e5a8a" stroke-width="1.3" opacity="0.8">' +
    '<line x1="60" y1="110" x2="130" y2="130"/><line x1="300" y1="110" x2="230" y2="130"/>' +
    '<line x1="60" y1="150" x2="130" y2="160"/><line x1="300" y1="150" x2="230" y2="160"/></g>' +
    '<circle cx="52" cy="104" r="7" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<circle cx="308" cy="104" r="7" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<circle cx="52" cy="156" r="7" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<circle cx="308" cy="156" r="7" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/></svg>'
  );
}

function svgStream() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Event streaming illustration">' +
    '<defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#sg)"/>' +
    '<g stroke="#2c6a9e" stroke-width="1.5"><rect x="30" y="90" width="64" height="80" rx="12" fill="#0b3f6b"/>' +
    '<rect x="266" y="90" width="64" height="80" rx="12" fill="#0b3f6b"/></g>' +
    '<g fill="#d9edf5"><path d="M42 110h28M42 122h28M42 134h14"/>' +
    '<path d="M278 110h28M278 122h28M278 134h14"/></g>' +
    '<g stroke="#4c89b8" stroke-width="2" fill="none" stroke-linecap="round">' +
    '<path d="M110 130h150"/><circle cx="124" cy="130" r="4" fill="#00965e" stroke="none"/>' +
    '<circle cx="150" cy="130" r="4" fill="#0a7fbe" stroke="none"/>' +
    '<circle cx="176" cy="130" r="4" fill="#00965e" stroke="none"/>' +
    '<circle cx="202" cy="130" r="4" fill="#0a7fbe" stroke="none"/>' +
    '<circle cx="228" cy="130" r="4" fill="#00965e" stroke="none"/></g>' +
    '<circle cx="180" cy="130" r="28" fill="#00965e" stroke="#8fe6c1" stroke-width="2.5"/>' +
    '<path d="M170 130l7 7 14-14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M60 40a95 30 0 0 1 240 0M60 220a95 30 0 0 0 240 0" stroke="#1e5a8a" stroke-width="1.5" fill="none"/>' +
    '<g fill="#5a6b7a" font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="600" text-anchor="middle">' +
    '<text x="62" y="84">Applications</text><text x="298" y="84">Consumers</text>' +
    '<text x="180" y="210">Event Stream</text></g></svg>'
  );
}

function svgLayers() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data layers illustration">' +
    '<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#lg)"/>' +
    '<g stroke="#2c6a9e" stroke-width="1.5" fill="#0b3f6b">' +
    '<rect x="90" y="40" width="180" height="40" rx="9"/><rect x="70" y="92" width="220" height="40" rx="9"/>' +
    '<rect x="50" y="144" width="260" height="40" rx="9"/><rect x="70" y="196" width="220" height="40" rx="9"/></g>' +
    '<g fill="#d9edf5"><rect x="104" y="52" width="52" height="16" rx="4"/>' +
    '<rect x="84" y="104" width="52" height="16" rx="4"/><rect x="64" y="156" width="52" height="16" rx="4"/>' +
    '<rect x="84" y="208" width="52" height="16" rx="4"/></g>' +
    '<g stroke="#7fb4dc" stroke-width="1.3" fill="none">' +
    '<circle cx="250" cy="60" r="16"/><circle cx="270" cy="112" r="16"/><circle cx="238" cy="164" r="16"/><circle cx="262" cy="216" r="16"/></g>' +
    '<circle cx="250" cy="60" r="6" fill="#00965e" stroke="none"/>' +
    '<circle cx="270" cy="112" r="6" fill="#0a7fbe" stroke="none"/>' +
    '<circle cx="238" cy="164" r="6" fill="#00965e" stroke="none"/>' +
    '<circle cx="262" cy="216" r="6" fill="#0a7fbe" stroke="none"/>' +
    '<g fill="#5a6b7a" font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="600">' +
    '<text x="90" y="28">Applications</text><text x="70" y="80">Integrated Layer</text>' +
    '<text x="50" y="132">Data Services</text><text x="70" y="184">Storage &amp; Models</text></g></svg>'
  );
}

function svgCloud() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data virtualization illustration">' +
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#cg)"/>' +
    '<path d="M72 168c-24 0-38-14-38-32 0-16 12-28 28-30 4-22 24-38 48-38 20 0 38 10 46 27 4 0 8-1 12-1 22 0 38 14 38 34 0 22-18 37-40 37z" ' +
    'fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<path d="M96 158c-18 0-28-10-28-24 0-12 9-21 21-22 3-17 18-29 36-29 15 0 28 7 34 20 3 0 6-1 9-1 16 0 28 11 28 25 0 17-13 27-30 27z" ' +
    'fill="#123f6b" stroke="#3a7ab0" stroke-width="1.2"/>' +
    '<g stroke="#7fb4dc" stroke-width="1.4" fill="none">' +
    '<circle cx="96" cy="90" r="7"/><path d="M96 84v-2m0-2v0" /></g>' +
    '<rect x="62" y="188" width="96" height="38" rx="8" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<rect x="210" y="188" width="96" height="38" rx="8" fill="#0b3f6b" stroke="#2c6a9e" stroke-width="1.5"/>' +
    '<g fill="#d9edf5"><path d="M74 200h34M74 212h20M222 200h34M222 212h20"/></g>' +
    '<path d="M158 207h52" stroke="#4c89b8" stroke-width="2" stroke-dasharray="4 5"/>' +
    '<circle cx="180" cy="60" r="20" fill="#00965e" stroke="#8fe6c1" stroke-width="2"/>' +
    '<path d="M172 60l5 5 10-11" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g fill="#5a6b7a" font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="600" text-anchor="middle">' +
    '<text x="110" y="180">System A</text><text x="258" y="180">System B</text>' +
    '<text x="180" y="245">One logical view, no copies</text></g></svg>'
  );
}

function svgBlueprint() {
  return (
    '<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data architecture blueprint illustration">' +
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect width="360" height="260" rx="18" fill="url(#bg)"/>' +
    '<g stroke="#2c6a9e" stroke-width="1.5" fill="none">' +
    '<rect x="40" y="34" width="120" height="34" rx="8"/><rect x="200" y="34" width="120" height="34" rx="8"/>' +
    '<rect x="40" y="112" width="120" height="34" rx="8"/><rect x="200" y="112" width="120" height="34" rx="8"/>' +
    '<rect x="120" y="190" width="120" height="34" rx="8"/></g>' +
    '<path d="M100 52h40M100 129h40M180 52h40M180 129h40M160 146v44M200 52v60M160 52v60" stroke="#3a7ab0" stroke-width="1.4" stroke-dasharray="3 5"/>' +
    '<g fill="#d9edf5"><path d="M104 41h22M104 53h22M104 65h14M264 41h22M264 53h22M264 65h14M104 119h22M104 131h22M104 143h14M264 119h22M264 131h22M264 143h14M184 197h22M184 209h22M184 221h14"/></g>' +
    '<circle cx="180" cy="96" r="8" fill="#00965e" stroke="#8fe6c1" stroke-width="2"/>' +
    '<path d="M177 96l2 2 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g fill="#5a6b7a" font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="600">' +
    '<text x="40" y="78">Sources</text><text x="200" y="78">Storage</text>' +
    '<text x="40" y="156">Integration</text><text x="200" y="156">Consumption</text>' +
    '<text x="120" y="234">Governed by clear standards</text></g></svg>'
  );
}

const SERVICE_ART = {
  master_data_management: svgNetwork,
  data_governance: svgLayers,
  data_quality: svgLayers,
  data_security: svgVault,
  data_architecture: svgBlueprint,
  etl_elt: svgPipeline,
  change_data_capture: svgStream,
  api_integration: svgNetwork,
  event_streaming: svgStream,
  data_virtualization: svgCloud
};

/* --------------------------- Navigation ---------------------------------- */
const NAV = {
  megaManagement: [
    { slug: "master-data-management", title: "Master Data Management", desc: "Consistent master records across systems", icon: "database" },
    { slug: "data-governance", title: "Data Governance & Metadata", desc: "Ownership, definitions and control", icon: "shield" },
    { slug: "data-quality", title: "Data Quality & Cleansing", desc: "Accurate data you can trust", icon: "circle" },
    { slug: "data-security", title: "Data Security & Privacy", desc: "Protect sensitive business information", icon: "lock" },
    { slug: "data-architecture", title: "Data Architecture & Modeling", desc: "Scalable, future-ready data designs", icon: "layers" }
  ],
  megaIntegration: [
    { slug: "etl-elt", title: "Batch Processing (ETL / ELT)", desc: "Scheduled, reliable data movement", icon: "refresh" },
    { slug: "change-data-capture", title: "Change Data Capture (CDC)", desc: "Systems in sync as data changes", icon: "activity" },
    { slug: "api-integration", title: "API & Microservices Integration", desc: "Connect apps through clean APIs", icon: "link" },
    { slug: "event-streaming", title: "Event-Driven Streaming", desc: "Near-real-time data flows", icon: "radio" },
    { slug: "data-virtualization", title: "Data Virtualization", desc: "One view of data, wherever it lives", icon: "cloud" }
  ],
  about: [
    { href: "/pages/about.html", title: "About SHANZOO", desc: "Who we are and what we do" },
    { href: "/pages/why-shanzoo.html", title: "Why SHANZOO", desc: "What makes us different" },
    { href: "/pages/our-approach.html", title: "Our Approach", desc: "How we work with you" }
  ]
};

module.exports = {
  SITE,
  ICONS,
  icon,
  SERVICES,
  SERVICE_ART,
  NAV,
  svgNetwork,
  svgPipeline,
  svgVault,
  svgStream,
  svgLayers,
  svgCloud,
  svgBlueprint
};