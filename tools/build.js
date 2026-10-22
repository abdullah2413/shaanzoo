/* ==========================================================================
   SHANZOO — Static site builder
   --------------------------------------------------------------------------
   Generates the complete, crawlable HTML site from shared layout + content
   data (tools/data.js). Run with:  node tools/build.js
   Output is written to the project root (index.html), pages/ and services/.

   No dependencies — plain Node.js.
   ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const D = require("./data.js");

const SITE = D.SITE;
const ROOT = path.resolve(__dirname, "..");

/* ------------------------------ Small helpers ---------------------------- */
function svg(name, cls) {
  return D.icon(name, cls ? 'class="' + cls + '"' : "");
}

// Make a root-prefixed relative href from the canonical "/x" form.
function href(root, p) {
  if (!p) return "#";
  return (p[0] === "/" ? root : "") + (p[0] === "/" ? p.slice(1) : p);
}

// Service lookup
function bySlug(slug) {
  return D.SERVICES.find((s) => s.slug === slug);
}
function relatedServices(slug) {
  const svc = bySlug(slug);
  return D.SERVICES.filter((s) => s.cat === svc.cat && s.slug !== slug).slice(0, 3);
}

function metaDesc(text) {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/* ------------------------------ Layout ----------------------------------- */
const CSS = ["variables", "reset", "global", "components", "pages", "auth-ui", "responsive"];
const JS = ["main", "navigation", "animations", "components", "forms", "auth"];

function head(opts) {
  const root = opts.root;
  const pre = root ? root : "";
  let canonical = "";
  if (SITE.domain) {
    canonical =
      '<link rel="canonical" href="https://' + SITE.domain + "/" + opts.canonicalPath + '">';
  }
  let ogImage = "";
  if (SITE.domain) {
    ogImage =
      '<meta property="og:image" content="https://' +
      SITE.domain +
      '/assets/logo/shanzoo-logo.png">';
  }
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SHANZOO",
    description: SITE.short,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "8 Marowyne Dr",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA"
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.email,
      contactType: "sales"
    }
  };
  if (SITE.domain) org.url = "https://" + SITE.domain;

  return (
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + opts.title + "</title>\n" +
    '<meta name="description" content="' + opts.desc + '">\n' +
    '<meta name="theme-color" content="#073763">\n' +
    '<meta name="generator" content="SHANZOO static site builder">\n' +
    canonical +
    '\n<meta property="og:type" content="' + (opts.ogType || "website") + '">\n' +
    '<meta property="og:title" content="' + opts.title + '">\n' +
    '<meta property="og:description" content="' + opts.desc + '">\n' +
    ogImage +
    '\n<meta property="og:locale" content="en_CA">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="icon" href="' + pre + 'assets/icons/favicon.ico" sizes="any">\n' +
    '<link rel="icon" type="image/png" sizes="32x32" href="' + pre + 'assets/icons/favicon-32x32.png">\n' +
    '<link rel="icon" type="image/png" sizes="16x16" href="' + pre + 'assets/icons/favicon-16x16.png">\n' +
    '<link rel="apple-touch-icon" href="' + pre + 'assets/icons/apple-touch-icon.png">\n' +
    '<link rel="manifest" href="' + pre + 'assets/icons/site.webmanifest">\n' +
    CSS.map((f) => '<link rel="stylesheet" href="' + pre + "css/" + f + '.css">').join("\n") +
    "\n" +
    '<script type="application/ld+json">' +
    JSON.stringify(org) +
    "</script>\n"
  );
}

function topbar(opts) {
  const root = opts.root;
  const pre = root ? root : "";
  return (
    '<div class="topbar">\n  <div class="container topbar__inner">\n' +
    '    <ul class="topbar__list topbar__list--left">\n' +
    '      <li><a href="tel:' + SITE.phoneHref + '">' + svg("phone") + SITE.phone + "</a></li>\n" +
    '      <li><a href="mailto:' + SITE.email + '">' + svg("mail") + SITE.email + "</a></li>\n" +
    '      <li><span class="topbar__item">' + svg("pin") + SITE.city + "</span></li>\n" +
    "    </ul>\n" +
    '    <ul class="topbar__list topbar__list--right topbar__pills">\n' +
    '      <li><span class="topbar__pill">Data Management</span></li>\n' +
    '      <li><span class="topbar__pill">Data Integration</span></li>\n' +
    '      <li><span class="topbar__pill">Enterprise Solutions</span></li>\n' +
    "    </ul>\n  </div>\n</div>"
  );
}

function megaItem(root, item, isMgmt) {
  return (
    '<li><a class="mega__item" href="' +
    href(root, "/services/" + item.slug + ".html") +
    '">' +
    '<span class="mega__icon">' + svg(item.icon) + "</span>" +
    "<span><span class=\"mega__label\">" + item.title + "</span>" +
    '<span class="mega__desc">' + item.desc + "</span></span></a></li>"
  );
}

function header(opts) {
  const root = opts.root;
  const pre = root ? root : "";
  const mgmtCol =
    '<div class="mega__col"><p class="mega__title">' +
    svg("layers") +
    "Data Management Services</p><ul class=\"mega__list\">" +
    D.NAV.megaManagement.map((m) => megaItem(root, m)).join("") +
    '</ul><a class="text-link mt-2" href="' + href(root, "/pages/data-management.html") + '">All Data Management services ' + svg("arrow") + "</a></div>";
  const intCol =
    '<div class="mega__col"><p class="mega__title">' +
    svg("link") +
    "Data Integration Services</p><ul class=\"mega__list\">" +
    D.NAV.megaIntegration.map((m) => megaItem(root, m)).join("") +
    '</ul><a class="text-link mt-2" href="' + href(root, "/pages/data-integration.html") + '">All Data Integration services ' + svg("arrow") + "</a></div>";
  const techCol =
    '<div class="mega__col"><p class="mega__title">' +
    svg("cpu") +
    "Technology Services</p><ul class=\"mega__list\">" +
    D.NAV.megaTechnology
      .map((m) =>
        '<li><a class="mega__item" href="' + href(root, m.href) + '">' +
        '<span class="mega__icon">' + svg(m.icon) + "</span>" +
        "<span><span class=\"mega__label\">" + m.title + "</span>" +
        '<span class="mega__desc">' + m.desc + "</span></span></a></li>"
      )
      .join("") +
    '</ul><a class="text-link mt-2" href="' + href(root, "/pages/services.html") + '">All services ' + svg("arrow") + "</a></div>";

  const aboutLinks = D.NAV.about
    .map(
      (a) =>
        '<li><a class="menu-simple__link" href="' + href(root, a.href) + '">' +
        "<strong>&lt;a&gt;[" + a.title + "]</strong></a></li>"
    )
    .join("");

  const navItems =
    '<li class="nav__item" data-dropdown>\n' +
    '  <button class="nav__link" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-about">About Us ' + svg("chevron", "nav__caret") + "</button>\n" +
    '  <div class="menu-simple" id="menu-about" role="region" aria-label="About SHANZOO">' +
    D.NAV.about
      .map(
        (a) =>
          '<a class="menu-simple__link" href="' + href(root, a.href) + '">' +
          '<span class="mega__label">' + a.title + "</span>" +
          '<span class="mega__desc">' + a.desc + "</span></a>"
      )
      .join("") +
    "</div></li>\n" +
    '<li class="nav__item" data-dropdown>\n' +
    '  <button class="nav__link" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-services">Services ' + svg("chevron", "nav__caret") + "</button>\n" +
    '  <div class="mega mega--wide" id="menu-services" role="region" aria-label="SHANZOO services">' +
    '<div class="mega__grid mega__grid--3">' +
    mgmtCol +
    intCol +
    techCol +
    '</div><div class="mega__foot"><p class="mega__foot-note">Not sure where to start? We will help you find the right path.</p>' +
    '<a class="btn btn--navy btn--md" href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a>' +
    "</div></div></li>\n" +
    '<li><a class="nav__link" href="' + href(root, "/pages/solutions.html") + '">Solutions</a></li>\n' +
    '<li><a class="nav__link" href="' + href(root, "/pages/track-record.html") + '">Track Record</a></li>\n' +
    '<li><a class="nav__link" href="' + href(root, "/pages/insights.html") + '">Insights</a></li>\n' +
    '<li><a class="nav__link" href="' + href(root, "/pages/contact.html") + '">Contact Us</a></li>\n';

  return (
    '<header class="site-header">\n  <div class="container">\n    <div class="header__inner">\n' +
    '      <a class="brand" href="' + href(root, "/index.html") + '" aria-label="SHANZOO — return to home">\n' +
    '        <img class="brand__logo" src="' + pre + 'images/logoNav.png" alt="SHANZOO logo — navy hexagonal data mark with green analytics bars" width="360" height="239" fetchpriority="high">\n' +
    "      </a>\n" +
    '      <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav"><span class="nav-toggle__bars"></span></button>\n' +
    '      <nav id="primary-nav" class="nav" aria-label="Main navigation">\n' +
    '        <div class="nav__panel-head">\n' +
    '          <span class="nav__panel-title">Menu</span>\n' +
    '          <button class="nav__close" type="button" aria-label="Close menu" data-nav-close>' + svg("close") + "</button>\n" +
    "        </div>\n" +
    '        <ul class="nav__list">\n' +
    navItems +
    '        </ul>\n' +
    '        <div class="mobile-actions">\n' +
    '          <div class="mobile-actions__row" data-auth-row>\n' +
    '            <a class="btn btn--ghost btn--sm" href="' + href(root, "/pages/login.html") + '">Login</a>\n' +
    '            <a class="btn btn--primary btn--sm" href="' + href(root, "/pages/signup.html") + '">Sign Up</a>\n' +
    "          </div>\n" +
    '          <a class="btn btn--navy btn--md" data-auth-cta href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a>\n' +
    "        </div>\n" +
    "      </nav>\n" +
    '      <div class="header__actions">\n' +
    '        <a class="header__login" data-auth-login href="' + href(root, "/pages/login.html") + '">Login</a>\n' +
    '        <a class="btn btn--primary btn--md" data-auth-cta href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a>\n' +
    "      </div>\n" +
    "    </div>\n  </div>\n" +
    '  <div class="mobile-overlay" aria-hidden="true"></div>\n' +
    "</header>"
  );
}

function footer(opts) {
  const root = opts.root;
  const coreLinks = D.CORE_SERVICES.map(
    (s) =>
      '<li><a href="' + href(root, s.href) + '">' +
      svg("chevron") + s.title + "</a></li>"
  ).join("");
  return (
    '<footer class="site-footer">\n  <div class="container">\n    <div class="footer-top">\n' +
    '      <div class="footer-brand">\n' +
    '        <a class="footer-brand__logo-wrap" href="' + href(root, "/index.html") + '" aria-label="SHANZOO home">\n' +
    '          <img src="' + root + 'assets/logo/shanzoo-logo-360.png" alt="SHANZOO logo" width="360" height="239">\n' +
    "        </a>\n" +
    "        <p>SHANZOO delivers enterprise data management, integration, AI, cloud, software and managed technology services — so teams can work faster and make better decisions.</p>\n" +
    "      </div>\n" +
    '      <div class="footer-col">\n        <h3>Company</h3>\n        <ul>\n' +
    '          <li><a href="' + href(root, "/pages/about.html") + '">' + svg("chevron") + "About SHANZOO</a></li>\n" +
    '          <li><a href="' + href(root, "/pages/why-shanzoo.html") + '">' + svg("chevron") + "Why SHANZOO</a></li>\n" +
    '          <li><a href="' + href(root, "/pages/our-approach.html") + '">' + svg("chevron") + "Our Approach</a></li>\n" +
    '          <li><a href="' + href(root, "/pages/track-record.html") + '">' + svg("chevron") + "Track Record</a></li>\n" +
    '          <li><a href="' + href(root, "/pages/industries.html") + '">' + svg("chevron") + "Industries</a></li>\n" +
    '          <li><a href="' + href(root, "/pages/insights.html") + '">' + svg("chevron") + "Insights</a></li>\n" +
    "        </ul>\n      </div>\n" +
    '      <div class="footer-col">\n        <h3>Services</h3>\n        <ul>' +
    coreLinks +
    "        </ul>\n      </div>\n" +
    '      <div class="footer-col footer-contact">\n        <h3>Contact</h3>\n        <ul>\n' +
    '          <li>' + svg("pin") + "<span>" + SITE.address + "</span></li>\n" +
    '          <li>' + svg("phone") + '<a href="tel:' + SITE.phoneHref + '">' + SITE.phone + "</a></li>\n" +
    '          <li>' + svg("mail") + '<a href="mailto:' + SITE.email + '">' + SITE.email + "</a></li>\n" +
    '          <li>' + svg("clock") + "<span>Mon–Fri, 9:00–17:00 ET</span></li>\n" +
    "        </ul>\n" +
    '        <a class="btn btn--primary btn--sm mt-3" href="' + href(root, "/pages/contact.html#consultation") + '">Request a consultation</a>\n' +
    "      </div>\n" +
    "    </div>\n" +
    '    <div class="footer-bottom">\n' +
    '      <p data-copyright>&copy; 2026 SHANZOO. All rights reserved.</p>\n' +
    '      <ul>\n' +
    '        <li><a href="' + href(root, "/pages/privacy.html") + '">Privacy Policy</a></li>\n' +
    '        <li><a href="' + href(root, "/pages/terms.html") + '">Terms of Use</a></li>\n' +
    '        <li><a href="' + href(root, "/pages/contact.html") + '">Contact</a></li>\n' +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n</footer>\n" +
    '<button class="to-top" type="button" aria-label="Back to top">' + svg("chevronUp") + "</button>"
  );
}

function scripts(opts) {
  const pre = opts.root ? opts.root : "";
  return (
    '<script src="' + pre + 'js/main.js" defer></script>\n' +
    '<script src="' + pre + 'js/navigation.js" defer></script>\n' +
    '<script src="' + pre + 'js/animations.js" defer></script>\n' +
    '<script src="' + pre + 'js/components.js" defer></script>\n' +
    (opts.extraScripts || "") +
    '<script src="' + pre + 'js/forms.js" defer></script>\n' +
    '<script src="' + pre + 'js/auth.js" defer></script>'
  );
}

function page(opts) {
  return (
    "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n" +
    head(opts) +
    "\n</head>\n<body>\n<a class=\"skip-link\" href=\"#main\">Skip to main content</a>\n" +
    topbar(opts) +
    "\n" +
    header(opts) +
    "\n<main id=\"main\">\n" +
    opts.body +
    "\n</main>\n" +
    footer(opts) +
    "\n" +
    scripts(opts) +
    "\n</body>\n</html>"
  );
}

/* ------------------------------ Shared sections -------------------------- */
function sectionHead(eyebrow, title, lead, center) {
  /* Tolerate callers that pass the boolean in the 3rd slot (older call sites
     used `sectionHead(a, b, true)`), which previously rendered `<p>true</p>`. */
  if (lead === true) {
    center = true;
    lead = "";
  }
  return (
    '<div class="section-head' + (center ? " section-head--center" : "") + '">' +
    '<p class="eyebrow">' + eyebrow + "</p>" +
    "<h2>" + title + "</h2>" +
    (lead ? "<p>" + lead + "</p>" : "") +
    "</div>"
  );
}

function ctaBanner(opts) {
  const t = opts.title || "Ready to Make Better Use of Your Data?";
  const p =
    opts.lead ||
    "Tell us about your data challenges. We will help you make your data accurate, connected and easier to manage.";
  const a = opts.actions || [
    { href: "/pages/contact.html#consultation", label: "Contact SHANZOO", cls: "btn--primary" },
    { href: "/pages/contact.html", label: "Email Us", cls: "btn--outline-light" }
  ];
  return (
    '<div class="cta-banner">' +
    "<h2>" + t + "</h2><p>" + p + "</p>" +
    '<div class="cta-banner__actions">' +
    a
      .map(
        (x) =>
          '<a class="btn ' +
          (x.cls || "btn--primary").replace(/\bbtn--lg\b/, "").replace(/\s+/g, " ").trim() +
          ' btn--lg" href="' + href(opts.root, x.href) + '">' + x.label + "</a>"
      )
      .join("") +
    "</div></div>"
  );
}

function crumbs(opts, items) {
  return (
    '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>' +
    items
      .map(function (it, i) {
        const last = i === items.length - 1;
        return last
          ? '<li><span aria-current="page">' + it.label + "</span></li>"
          : '<li><a href="' + (it.href === "#" ? "javascript:void(0)" : href(opts.root, it.href)) + '">' + it.label + "</a></li>";
      })
      .join("") +
    "</ol></nav>"
  );
}

function pageHero(opts) {
  // opts: root, crumbs, eyebrow (override style), title, lead, aside (html), center
  return (
    '<section class="page-hero' + (opts.center ? " page-hero--center" : "") + '">' +
    '<div class="container page-hero__inner">' +
    "<div>" +
    '<p class="eyebrow eyebrow--light">' + opts.eyebrow + "</p>" +
    "<h1>" + opts.title + "</h1>" +
    "<p>" + opts.lead + "</p>" +
    (opts.crumbs ? '<div class="mt-3">' + crumbs(opts, opts.crumbs) + "</div>" : "") +
    "</div>" +
    (opts.aside ? '<div class="page-hero__aside">' + opts.aside + "</div>" : "") +
    "</div></section>"
  );
}

function serviceCard(root, svc, opts) {
  opts = opts || {};
  return (
    '<article class="card reveal" data-delay="' + (opts.delay || 0) + '">' +
    '<div class="card__icon">' + svg(svc.icon) + "</div>" +
    '<p class="card__tag">' + svc.category + "</p>" +
    "<h3>" + svc.title + "</h3>" +
    "<p>" + svc.short + "</p>" +
    "<p><strong>Benefit:</strong> " + svc.benefit + "</p>" +
    '<a class="text-link mt-2" href="' + html.href(root, "/services/" + svc.slug + ".html") + '">Learn More ' + svg("arrow") + "</a>" +
    "</article>"
  );
}

/* html helper used above */
const html = { href };

/* ------------------------------ Page builders ---------------------------- */
/* --------------------------- Homepage sections --------------------------- */
function heroStrip() {
  const item = (h, dup) =>
    '    <li class="hero__strip-item' +
    (dup ? " hero__strip-item--dup" : "") +
    '"' +
    (dup ? ' aria-hidden="true"' : "") +
    '><span class="hero__strip-value"' +
    (h.count != null ? ' data-hero-count="' + h.count + '" data-hero-pad="' + (h.pad || 0) + '"' : "") +
    ">" +
    h.value +
    '</span><span class="hero__strip-label">' +
    h.label +
    "</span></li>";
  return (
    '<div class="hero__strip">\n' +
    '  <ul class="hero__strip-list">\n' +
    D.HERO_HIGHLIGHTS.map((h) => item(h, false)).join("\n") +
    "\n" +
    D.HERO_HIGHLIGHTS.map((h) => item(h, true)).join("\n") +
    "\n  </ul>\n</div>"
  );
}

/* --------------------------- From challenge to solution ------------------ */
function challengeSection(root) {
  var steps = [
    {
      num: "01", icon: "search", title: "Understand",
      text: "We map your systems, data and goals to find where the real friction is."
    },
    {
      num: "02", icon: "compass", title: "Design",
      text: "We shape a practical architecture and plan that fits your scale and constraints."
    },
    {
      num: "03", icon: "git", title: "Build &amp; Connect",
      text: "We implement, integrate and test &mdash; connecting new and existing systems safely."
    },
    {
      num: "04", icon: "refresh", title: "Operate &amp; Improve",
      text: "We manage, monitor and keep improving the environment well after go-live."
    }
  ];
  return (
    '<section class="section bg-alt challenge">\n  <div class="container">\n' +
    sectionHead(
      "How We Deliver",
      "From Business Challenge to Working Solution.",
      "A clear, connected path &mdash; so you always know where the work stands and what comes next.",
      true
    ) +
    '<ol class="journey">' +
    steps
      .map(function (s) {
        return (
          '<li class="journey__step reveal">' +
          '<span class="journey__badge">' + s.num + "</span>" +
          '<span class="journey__icon">' + svg(s.icon) + "</span>" +
          "<h3>" + s.title + "</h3>" +
          "<p>" + s.text + "</p>" +
          "</li>"
        );
      })
      .join("") +
    "</ol>" +
    '<div class="journey__actions">' +
    '<a class="btn btn--primary btn--lg" href="' + href(root, "/pages/our-approach.html") + '">Explore How We Work ' + svg("arrow") + "</a>" +
    '<a class="btn btn--ghost btn--lg" href="' + href(root, "/pages/contact.html#consultation") + '">Start a Conversation</a>' +
    "</div>" +
    "\n  </div>\n</section>"
  );
}

/* --------------------------- Connected technology ecosystem -------------- */
function capCard(root, s, i) {
  return (
    '<a class="cap-card reveal" data-delay="' + (i % 3) + '" href="' + href(root, s.href) + '">' +
    '<span class="cap-card__num">' + s.num + "</span>" +
    '<span class="cap-card__icon">' + svg(s.icon) + "</span>" +
    "<h3>" + s.title + "</h3>" +
    "<p>" + s.summary + "</p>" +
    '<ul class="cap-card__caps">' +
    s.caps.map((c) => "<li>" + c + "</li>").join("") +
    "</ul>" +
    '<span class="cap-card__link">Learn More ' + svg("arrow") + "</span>" +
    "</a>"
  );
}

function ecosystemSection(root) {
  var groups = [
    {
      mod: "data", icon: "database", label: "Data",
      items: ["Data Management", "Data Integration", "Data Governance"]
    },
    {
      mod: "build", icon: "code", label: "Build",
      items: ["Software Development", "Automation", "Custom Applications"]
    },
    {
      mod: "operate", icon: "helm", label: "Operate",
      items: ["Cloud &amp; Virtualization", "Managed Services", "Consulting"]
    }
  ];
  return (
    '<section class="section eco">\n  <div class="container eco__inner">\n' +
    '<div class="eco__copy">' +
    '<p class="eyebrow">Connected Technology</p>' +
    "<h2>One Technology Ecosystem. Built Around Your Business.</h2>" +
    '<p class="eco__lead">Rather than a stack of disconnected tools, SHANZOO connects data, software, cloud and ongoing operations around the way your business actually runs.</p>' +
    '<ul class="eco__list">' +
    ["Data you can govern and trust", "Software built for real workflows", "Cloud and operations that stay managed"]
      .map(function (t) { return "<li>" + svg("check") + "<span>" + t + "</span></li>"; })
      .join("") +
    "</ul>" +
    '<div class="eco__actions">' +
    '<a class="btn btn--primary btn--lg" href="' + href(root, "/pages/solutions.html") + '">Explore Solutions</a>' +
    '<a class="btn btn--ghost btn--lg" href="' + href(root, "/pages/services.html") + '">View All Services</a>' +
    "</div>" +
    "</div>" +
    '<div class="eco__visual">' +
    '<div class="eco__hub">' +
    '<span class="eco__hub-ring eco__hub-ring--1" aria-hidden="true"></span>' +
    '<span class="eco__hub-ring eco__hub-ring--2" aria-hidden="true"></span>' +
    '<div class="eco__hub-core"><span class="eco__hub-icon">' + svg("briefcase") + "</span><b>Your Business</b><small>Data · Build · Operate</small></div>" +
    "</div>" +
    '<div class="eco__wires" aria-hidden="true"><span class="eco__wire"></span><span class="eco__wire"></span><span class="eco__wire"></span></div>' +
    '<div class="eco__groups">' +
    groups
      .map(function (g) {
        return (
          '<div class="eco__group eco__group--' + g.mod + '">' +
          '<div class="eco__group-head"><span class="eco__group-icon">' + svg(g.icon) + '</span><span class="eco__group-title">' + g.label + "</span></div>" +
          '<ul class="eco__group-items">' +
          g.items.map(function (i) { return "<li>" + svg("check") + "<span>" + i + "</span></li>"; }).join("") +
          "</ul></div>"
        );
      })
      .join("") +
    "</div>" +
    "</div>" +
    "\n  </div>\n</section>"
  );
}

/* ------------------------------ Service explorer ------------------------- */
function explorerSection(root) {
  const cards = D.CORE_SERVICES.map(
    (s, i) =>
      '<article class="explorer-card' + (s.popular ? " explorer-card--popular" : "") +
      '" data-explorer-card data-group="' + s.group + '" style="--i:' + i + '">' +
      (s.popular ? '<span class="explorer-card__badge">Most Popular</span>' : "") +
      '<span class="explorer-card__icon">' + svg(s.icon) + "</span>" +
      '<h3 class="explorer-card__title">' + s.title + "</h3>" +
      "<p class=\"explorer-card__text\">" + s.explore + "</p>" +
      '<ul class="explorer-card__caps">' +
      s.caps.map((c) => "<li>" + c + "</li>").join("") +
      "</ul>" +
      '<div class="explorer-card__foot">' +
      '<span class="explorer-card__price"><small>Pricing</small>Custom Quote</span>' +
      '<a class="btn btn--primary btn--sm" href="' + href(root, "/pages/contact.html#consultation") + '">Request Quote</a>' +
      "</div>" +
      '<a class="explorer-card__more" href="' + href(root, s.href) + '">Learn more ' + svg("arrow") + "</a>" +
      "</article>"
  ).join("");
  return (
    '<section class="section">\n  <div class="container">\n' +
    sectionHead(
      "Explore Our Services",
      "Find the capability that matches your challenge.",
      "Browse the six core service areas — or talk to us and we will help you choose.",
      true
    ) +
    '<div class="explorer reveal" data-explorer>\n' +
    '  <div class="explorer__filters" role="group" aria-label="Filter services">\n' +
    '    <button class="explorer__filter is-active" type="button" data-filter="all" aria-pressed="true">All Services</button>\n' +
    '    <button class="explorer__filter" type="button" data-filter="data" aria-pressed="false">Data Management &amp; Integration</button>\n' +
    "  </div>\n" +
    '  <div class="explorer__carousel">\n' +
    '    <div class="explorer__track" data-car-track tabindex="0" role="region" aria-roledescription="carousel" aria-label="Our Services">' +
    cards +
    "</div>\n" +
    '    <div class="explorer__controls">\n' +
    '      <button class="carousel-btn" type="button" data-car-prev aria-label="Previous service">' + svg("chevron") + "</button>\n" +
    '      <div class="explorer__progress" aria-hidden="true">\n' +
    '        <span class="explorer__count"><b data-car-index>01</b> / <span data-car-total>06</span></span>\n' +
    '        <span class="explorer__rail"><span class="explorer__bar" data-car-bar></span></span>\n' +
    "      </div>\n" +
    '      <button class="carousel-btn" type="button" data-car-next aria-label="Next service">' + svg("chevron") + "</button>\n" +
    "    </div>\n" +
    '    <p class="explorer__sr" data-car-live aria-live="polite"></p>\n' +
    "  </div>\n</div>\n  </div>\n</section>"
  );
}

/* ------------------------------ Track record ----------------------------- */
function trackCtaCard(root) {
  return (
    '<article class="track-card track-card--cta reveal" data-delay="2">' +
    '<div class="track-card__top">' +
    '<span class="track-card__kicker">Have a project in mind?</span>' +
    '<span class="track-card__glyph" aria-hidden="true">' + svg("arrow") + "</span>" +
    "</div>" +
    '<h3 class="track-card__client">Let&rsquo;s Build What Comes Next.</h3>' +
    '<p class="track-card__text">Tell us about your data, software or infrastructure challenge.</p>' +
    '<div class="track-card__cta">' +
    '<a class="btn btn--primary" href="' + href(root, "/pages/contact.html#consultation") + '">Start Your Project ' + svg("arrow") + "</a>" +
    '<a class="track-card__link track-card__link--light" href="' + href(root, "/pages/contact.html") + '">Request a Consultation</a>' +
    "</div>" +
    "</article>"
  );
}

function trackRecordSection(root) {
  const cards = D.TRACK_RECORD.map(
    (p, i) =>
      '<article class="track-card reveal" data-delay="' + (i % 3) + '">' +
      '<div class="track-card__top">' +
      '<span class="track-card__year">' + p.year + "</span>" +
      '<span class="track-card__cat"><span class="track-card__cat-icon">' + svg(p.icon) + "</span>" + p.category + "</span>" +
      "</div>" +
      "<h3 class=\"track-card__client\">" + p.client + "</h3>" +
      "<p class=\"track-card__text\">" + p.summary + "</p>" +
      '<a class="track-card__link" href="' + href(root, "/pages/track-record.html") + '">View Project ' + svg("arrow") + "</a>" +
      "</article>"
  ).join("");
  return (
    '<section class="section track">\n  <div class="container">\n' +
    sectionHead(
      "Proven Track Record",
      "Enterprise experience that speaks for itself.",
      "Enterprise technology experience across contact centers, software, infrastructure, automation and secure digital systems.",
      true
    ) +
    '<div class="track__grid">' +
    cards +
    /* Sixth card: the "Let's Build What Comes Next" CTA lives inside the grid */
    trackCtaCard(root) +
    "</div>\n" +
    "  </div>\n</section>"
  );
}

function industriesSection(root) {
  /* Single structured source: every topic carries its own image, so the media
     and the selector can never fall out of sync (both are rendered from here). */
  const topics = [
    { icon: "database", title: "Master Data Management (MDM)", desc: "Unified, consistent and trusted enterprise data.", img: "Industries Sport.png", href: "/services/master-data-management.html" },
    { icon: "shield", title: "Data Governance &amp; Metadata", desc: "Clear ownership, standards, lineage and control.", img: "Industries Sport 1.png", href: "/services/data-governance.html" },
    { icon: "circle", title: "Data Quality &amp; Cleansing", desc: "Improve accuracy, consistency and reliability.", img: "Industries Sport 2.png", href: "/services/data-quality.html" },
    { icon: "link", title: "Data Integration", desc: "Connect applications, systems and enterprise data.", img: "Industries Sport 3.png", href: "/pages/data-integration.html" },
    { icon: "workflow", title: "ETL / ELT &amp; Data Pipelines", desc: "Build scalable pipelines for modern data platforms.", img: "Industries Sport 4.png", href: "/services/etl-elt.html" },
    { icon: "radio", title: "CDC &amp; Real-Time Streaming", desc: "Move and synchronize changing data in real time.", img: "Industries Sport 5.png", href: "/services/change-data-capture.html" }
  ];
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const media = topics
    .map((t, i) =>
      '<img class="dservices__img' + (i === 0 ? " is-active" : "") + '" data-dsvc-img="' + i +
      '" src="' + root + "assets/images/" + t.img + '" alt="' + t.title + '"' +
      ' width="1600" height="1000" loading="lazy" decoding="async">'
    )
    .join("");
  const rows = topics
    .map((t, i) =>
      '<a class="dsvc' + (i === 0 ? " is-active" : "") + '" data-dsvc="' +
      i + '" href="' + href(root, t.href) + '"' + (i === 0 ? ' aria-current="true"' : "") + '>' +
      '<span class="dsvc__num">' + pad(i + 1) + "</span>" +
      '<span class="dsvc__icon" aria-hidden="true">' + svg(t.icon) + "</span>" +
      '<span class="dsvc__body"><span class="dsvc__title">' + t.title +
      '</span><span class="dsvc__sub">' + t.desc + "</span></span>" +
      '<span class="dsvc__arrow" aria-hidden="true">' + svg("arrow") + "</span>" +
      "</a>"
    )
    .join("");
  return (
    '<section class="section bg-alt section--industries">\n  <div class="container">\n' +
    sectionHead(
      "Data Services Expertise",
      "Built Around the Way Your Data Works.",
      "From trusted master data to real-time integration, explore the capabilities that keep enterprise data connected, governed and ready to use.",
      true
    ) +
    '<div class="dservices reveal" data-dservices>' +
    '<div class="dservices__media"><div class="dservices__frame">' + media +
    '<div class="dservices__overlay">' +
    '<p class="dservices__index" data-dsvc-index>01 / 06</p>' +
    '<h3 class="dservices__title" data-dsvc-title>' + topics[0].title + "</h3>" +
    '<p class="dservices__desc" data-dsvc-desc>' + topics[0].desc + "</p>" +
    "</div></div></div>" +
    '<div class="dservices__list">' + rows + "</div>" +
    "</div>\n" +
    '<p class="center mt-4"><a class="btn btn--ghost" href="' + href(root, "/pages/industries.html") + '">Explore Industries &amp; Use Cases</a></p>\n' +
    "  </div>\n</section>"
  );
}

function projectsShowcase(root) {
  /* Removed: the marquee of invented project names has been replaced by the
     Proven Track Record section (trackRecordSection) backed by real data. */
  return "";
}

/* ------------------------------ Rotating hero ---------------------------- */
function heroSlide(root, s, i) {
  var secondary = s.secondary
    ? '<a class="btn btn--outline-light btn--lg" href="' + href(root, s.secondary.href) + '">' + s.secondary.label + "</a>"
    : "";
  var tags =
    s.tags && s.tags.length
      ? '<ul class="hero__tags">' + s.tags.map((t) => "<li>" + t + "</li>").join("") + "</ul>"
      : "";
  var eyebrowClass = "hero__eyebrow hero__eyebrow--single-line";
  return (
    '<article class="hero__slide' + (i === 0 ? " is-active" : "") +
    '" data-hero-slide="' + i + '"' + (i === 0 ? "" : ' aria-hidden="true"') + ">" +
    '<p class="' + eyebrowClass + '"><span class="dot"></span>' + s.label + "</p>" +
    "<h1>" + s.heading + "</h1>" +
    '<p class="hero__lead">' + s.lead + "</p>" +
    '<div class="hero__actions">' +
    '<a class="btn btn--primary btn--lg" href="' + href(root, s.primary.href) + '">' + s.primary.label + "</a>" +
    secondary +
    "</div>" +
    tags +
    "</article>"
  );
}

/* --------------------------- Hero media infographics --------------------- */
/* Two purpose-built infographics, one per hero slide. Both are decorative
   (aria-hidden) and built from semantic HTML + CSS shapes; the circular
   ecosystem's node positions are computed here at build time so the browser
   receives an already-balanced layout. */

// Polar helper — returns {x,y} as percentages inside a square (centre 50,50).
function heroPolar(r, deg) {
  var rad = (deg * Math.PI) / 180;
  return {
    x: (50 + r * Math.cos(rad)).toFixed(2) + "%",
    y: (50 + r * Math.sin(rad)).toFixed(2) + "%"
  };
}
function heroPos(r, deg) {
  var p = heroPolar(r, deg);
  return "--x:" + p.x + ";--y:" + p.y;
}

/* Slide 01 — one circular enterprise-data ecosystem: a governed core, a ring
   of capability nodes, and light source / output indicators integrated around
   the rings. Thin connectors, no side panels, no crossing lines. */
function heroVisualDataHub() {
  var capabilities = [
    { icon: "database", label: "MDM" },
    { icon: "shield", label: "Governance" },
    { icon: "check", label: "Data Quality" },
    { icon: "book", label: "Metadata" },
    { icon: "lock", label: "Security" },
    { icon: "compass", label: "Architecture" },
    { icon: "refresh", label: "ETL / ELT" },
    { icon: "activity", label: "CDC" },
    { icon: "link", label: "APIs" },
    { icon: "radio", label: "Streaming" }
  ];
  var sources = [
    { icon: "database", label: "Databases" },
    { icon: "box", label: "Applications" },
    { icon: "cloud", label: "Cloud" },
    { icon: "file", label: "Files / APIs" }
  ];
  var outputs = [
    { icon: "trend", label: "Analytics" },
    { icon: "archive", label: "Warehouse" },
    { icon: "layers", label: "Data Lake" },
    { icon: "box", label: "Business Apps" }
  ];
  var capStart = -90;
  var capStep = 360 / capabilities.length;
  var capHtml = capabilities
    .map(function (c, i) {
      return (
        '<span class="hero-eco__cap" style="' + heroPos(39, capStart + i * capStep) + '">' +
        svg(c.icon) + "<span>" + c.label + "</span></span>"
      );
    })
    .join("");
  var srcAngles = [252, 216, 180, 144];
  var outAngles = [324, 0, 36, 72];
  var ioHtml = sources
    .map(function (s, i) {
      return (
        '<span class="hero-eco__io hero-eco__io--src" style="' + heroPos(28, srcAngles[i]) + '">' +
        '<i class="hero-eco__io-dot">' + svg(s.icon) + "</i><small>" + s.label + "</small></span>"
      );
    })
    .concat(
      outputs.map(function (o, i) {
        return (
          '<span class="hero-eco__io hero-eco__io--out" style="' + heroPos(28, outAngles[i]) + '">' +
          '<i class="hero-eco__io-dot">' + svg(o.icon) + "</i><small>" + o.label + "</small></span>"
        );
      })
    )
    .join("");
  return (
    '<div class="hero-eco" aria-hidden="true">' +
    '<span class="hero-eco__glow"></span>' +
    '<span class="hero-eco__ring hero-eco__ring--1"></span>' +
    '<span class="hero-eco__ring hero-eco__ring--2"></span>' +
    '<span class="hero-eco__ring hero-eco__ring--3"></span>' +
    '<div class="hero-eco__hub"><b>SHANZOO</b><small>Enterprise Data Platform</small></div>' +
    capHtml +
    ioHtml +
    "</div>"
  );
}

/* Slide 02 — a single large capability panel: a small "TECHNOLOGY CAPABILITIES"
   label above a 3x2 grid of six tiles (Cloud Infra, Virtualization, Custom
   Software, Workflow Automation, DevOps, Managed Services), connected by light
   dashed paths so it reads as one system. */
function heroVisualOpsGrid() {
  var cards = [
    { icon: "cloud", title: "Cloud Infrastructure", text: "Scalable, resilient cloud environments" },
    { icon: "layers", title: "Virtualization", text: "Consolidated compute and workloads" },
    { icon: "code", title: "Custom Software", text: "Purpose-built enterprise applications" },
    { icon: "workflow", title: "Workflow Automation", text: "Automate repetitive operations" },
    { icon: "refresh", title: "DevOps", text: "Continuous delivery and reliability" },
    { icon: "helm", title: "Managed Services", text: "Ongoing operations and support" }
  ];
  return (
    '<div class="hero-ops" aria-hidden="true">' +
    '<p class="hero-ops__label">Technology Capabilities</p>' +
    '<div class="hero-ops__grid">' +
    cards
      .map(function (c, i) {
        return (
          '<article class="hero-ops__card" style="--i:' + i + '">' +
          '<span class="hero-ops__icon">' + svg(c.icon) + "</span>" +
          '<h3 class="hero-ops__title">' + c.title + "</h3>" +
          '<p class="hero-ops__text">' + c.text + "</p>" +
          "</article>"
        );
      })
      .join("") +
    "</div></div>"
  );
}

function heroVisualFor(name, i) {
  var inner =
    name === "opsgrid" ? heroVisualOpsGrid() : heroVisualDataHub();
  return (
    '<div class="hero__visual' + (i === 0 ? " is-active" : "") + '" data-hero-visual="' + i + '">' +
    inner +
    "</div>"
  );
}

function heroMedia(root) {
  var slides = D.HERO_SLIDES;
  var total = slides.length < 10 ? "0" + slides.length : String(slides.length);
  /* Per-slide floating info card (same coordinates on both slides) — differs
     only in its copy so the two slides share one layout frame. */
  var floatCopy = {
    datahub: { icon: "shield", tag: "Trusted Data", title: "Governed Enterprise Information" },
    opsgrid: { icon: "check", tag: "Enterprise Ready", title: "Scalable · Secure · Supported" }
  };
  var floats = slides
    .map(function (s, i) {
      var f = floatCopy[s.visual] || floatCopy.datahub;
      return (
        '<div class="hero__float' + (i === 0 ? " is-active" : "") + '" data-hero-float="' + i + '">' +
        '<span class="hero__float-icon">' + svg(f.icon) + "</span>" +
        '<span class="hero__float-text"><small>' + f.tag + "</small><b>" + f.title + "</b></span>" +
        "</div>"
      );
    })
    .join("");
  return (
    '<div class="hero__media">' +
    '<div class="hero__media-card">' +
    '<div class="hero__visuals">' +
    slides.map((s, i) => heroVisualFor(s.visual, i)).join("") +
    "</div>" +
    '<div class="hero__media-foot">' +
    '<div class="hero__dots" role="group" aria-label="Hero slide indicators">' +
    slides
      .map(
        (s, i) =>
          '<button class="hero__dot' + (i === 0 ? " is-active" : "") +
          '" type="button" data-hero-dot="' + i + '"' +
          (i === 0 ? ' aria-current="true"' : "") +
          ' aria-label="Show slide ' + (i + 1) + '"></button>'
      )
      .join("") +
    "</div>" +
    '<span class="hero__count"><span data-hero-current>01</span> / ' + total + "</span>" +
    "</div>" +
    '<span class="hero__progress" aria-hidden="true"><i data-hero-progress></i></span>' +
    "</div>" +
    floats +
    '<div class="hero__badge is-active" data-hero-badge aria-hidden="true">' +
    '<svg viewBox="0 0 100 100" focusable="false">' +
    '<defs>' +
    '<path id="heroBadgeArcTop" d="M50,50 m-35,0 a35,35 0 1,1 70,0" fill="none"/>' +
    '<path id="heroBadgeArcBottom" d="M50,50 m35,0 a35,35 0 1,1 -70,0" fill="none"/>' +
    "</defs>" +
    '<circle cx="50" cy="50" r="43" class="hero__badge-ring" fill="none"/>' +
    '<text class="hero__badge-text"><textPath href="#heroBadgeArcTop" startOffset="50%" text-anchor="middle">GOVERNED · CONNECTED</textPath></text>' +
    '<text class="hero__badge-text"><textPath href="#heroBadgeArcBottom" startOffset="50%" text-anchor="middle">SECURE · TRUSTED</textPath></text>' +
    "</svg>" +
    '<span class="hero__badge-core">' + svg("shield") + "</span>" +
    "</div>" +
    "</div>"
  );
}

function heroControls() {
  return (
    '<div class="hero__controls">' +
    '<button class="hero__arrow hero__arrow--prev" type="button" data-hero-prev aria-label="Previous hero slide">' + svg("chevron") + "</button>" +
    '<button class="hero__arrow hero__arrow--next" type="button" data-hero-next aria-label="Next hero slide">' + svg("chevron") + "</button>" +
    "</div>"
  );
}

function heroSection(root) {
  var slides = D.HERO_SLIDES;
  return (
    '<section class="hero" data-hero aria-label="SHANZOO services showcase">\n' +
    '  <div class="container hero__inner">\n' +
    '    <div class="hero__content">\n' +
    '      <div class="hero__slides">\n' +
    slides.map((s, i) => heroSlide(root, s, i)).join("\n") +
    "\n      </div>\n    </div>\n    " +
    heroMedia(root) +
    "\n  </div>\n  " +
    heroControls() +
    "\n  " +
    heroStrip() +
    "\n</section>"
  );
}

function buildIndex() {
  const root = "";
  const body = [];

  /* ---- Section 1 & 2 : topbar + header (rendered by page()) ---- */

  /* ---- Section 3 : hero (rotating service showcase) ---- */
  body.push(heroSection(root));

  /* ---- Section 4 : short intro ---- */
  body.push(
    '<section class="section section--tight intro">\n  <div class="container">\n' +
      sectionHead(
        "What we do",
        "Better data. Smarter systems. Stronger operations.",
        "SHANZOO is a Toronto-based technology partner for enterprise data management, integration, AI, cloud and custom software — helping organizations turn complex information into trusted, everyday business intelligence.",
        true
      ) +
      '<ul class="intro__pills">' +
      ["Data you can trust", "Systems that connect", "Operations that scale"]
        .map((t) => "<li>" + t + "</li>")
        .join("") +
      "</ul>\n  </div>\n</section>"
  );

  /* ---- Section 5 : Connected technology ecosystem ---- */
  body.push(ecosystemSection(root));

  /* ---- Section 6 : From challenge to solution ---- */
  body.push(challengeSection(root));

  /* ---- Section 7 : Service explorer ---- */
  body.push(explorerSection(root));

  /* ---- Section 8 : Proven track record ---- */
  body.push(trackRecordSection(root));

  /* ---- Section 9 : Industries (interactive ring) ---- */
  body.push(industriesSection(root));

  /* ---- Section 10 : Why choose SHANZOO (compact grid) ---- */
  body.push(
    '<section class="section">\n  <div class="container">\n' +
      sectionHead(
        "Why choose SHANZOO",
        "A partner you can actually talk to.",
        "Clear communication, sensible solutions and careful attention to the details that matter.",
        true
      ) +
      '<div class="value-grid">\n' +
      '<div class="value-item reveal"><div class="value-item__icon">' + svg("message") + '</div><div><h4>Clear Communication</h4><p>Plain English, honest timelines and no surprises.</p></div></div>\n' +
      '<div class="value-item reveal" data-delay="1"><div class="value-item__icon">' + svg("target") + '</div><div><h4>Business-Focused Solutions</h4><p>Every decision ties back to an outcome you care about.</p></div></div>\n' +
      '<div class="value-item reveal" data-delay="2"><div class="value-item__icon">' + svg("settings") + '</div><div><h4>Practical Technical Expertise</h4><p>Real engineering experience — applied without jargon.</p></div></div>\n' +
      '<div class="value-item reveal" data-delay="3"><div class="value-item__icon">' + svg("trend") + '</div><div><h4>Scalable Approaches</h4><p>Built for your size today and your growth tomorrow.</p></div></div>\n' +
      '<div class="value-item reveal" data-delay="4"><div class="value-item__icon">' + svg("shield") + '</div><div><h4>Data Security by Design</h4><p>Security and privacy designed in from the start.</p></div></div>\n' +
      "</div>\n" +
      '<p class="center mt-4"><a class="btn btn--ghost" href="pages/why-shanzoo.html">More Reasons to Choose Us</a></p>\n' +
      "  </div>\n</section>"
  );

  /* ---- Section 11 : Educational insights ---- */
  body.push(
    '<section class="section bg-alt">\n  <div class="container">\n' +
      sectionHead(
        "Educational insights",
        "Learn the basics in plain English.",
        "Short, useful articles that explain data concepts without the jargon.",
        true
      ) +
      '<div class="grid grid-3 snap-carousel">' +
      insights.map((post, i) => insightCard(root, post, i % 3)).join("") +
      "</div>\n" +
      '<p class="center mt-4"><a class="btn btn--ghost" href="pages/insights.html">Visit the Insights Hub</a></p>\n' +
      "  </div>\n</section>"
  );

  /* ---- Section 13 : Final CTA ---- */
  body.push(
    '<section class="section--tight" style="padding-block: var(--section-y-sm)"><div class="container">' +
      ctaBanner({
        root,
        title: "Ready to Make Better Use of Your Data?",
        lead: "Talk to SHANZOO about your data challenges and take the first step toward cleaner, more connected data.",
        actions: [
          { href: "/pages/contact.html#consultation", label: "Contact SHANZOO", cls: "btn--primary btn--lg" },
          { href: "/pages/our-approach.html", label: "How We Work", cls: "btn--outline-light btn--lg" }
        ]
      }) +
      "</div></section>"
  );

  return page({
    root,
    title: "SHANZOO — Better Data. Smarter Business. | Data Management & Integration",
    desc: "SHANZOO is a Toronto-based data management and integration consultancy helping businesses organize, protect and connect their data.",
    canonicalPath: "index.html",
    extraScripts: '<script src="js/hero-slider.js" defer></script>\n<script src="js/industries.js" defer></script>\n<script src="js/carousel.js" defer></script>\n',
    body: body.join("\n")
  });
}

function heroVisual() {
  return (
    '<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of connected business data systems" class="hero-art">' +
    '<defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient>' +
    '<linearGradient id="hgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00c07e"/><stop offset="1" stop-color="#00965e"/></linearGradient></defs>' +
    '<rect width="360" height="300" rx="20" fill="url(#hg)"/>' +
    '<g stroke="#3a7ab0" stroke-width="1.6" opacity="0.85">' +
    '<line x1="70" y1="80" x2="180" y2="150"/><line x1="290" y1="80" x2="180" y2="150"/>' +
    '<line x1="70" y1="80" x2="70" y2="230"/><line x1="290" y1="80" x2="290" y2="230"/>' +
    '<line x1="70" y1="230" x2="180" y2="150"/><line x1="290" y1="230" x2="180" y2="150"/>' +
    '<line x1="70" y1="230" x2="290" y2="230"/></g>' +
    '<g fill="rgba(10,74,127,0.55)" stroke="#4c89b8" stroke-width="1.6">' +
    '<rect x="30" y="40" width="80" height="62" rx="12"/><rect x="250" y="40" width="80" height="62" rx="12"/>' +
    '<rect x="30" y="200" width="80" height="62" rx="12"/><rect x="250" y="200" width="80" height="62" rx="12"/></g>' +
    '<g fill="#d9edf5"><path d="M42 58h34M42 70h34M42 82h20"/><path d="M262 58h34M262 70h34M262 82h20"/>' +
    '<path d="M42 218h34M42 230h34M42 242h20"/><path d="M262 218h34M262 230h34M262 242h20"/></g>' +
    '<circle cx="180" cy="150" r="30" fill="url(#hgg)" stroke="#8fe6c1" stroke-width="3"/>' +
    '<path d="M168 150l8 8 17-20" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g stroke="#8fe6c1" stroke-width="2" fill="none" stroke-linecap="round">' +
    '<path d="M60 105q0-18 12-24" opacity="0"/></g>' +
    "</svg>"
  );
}

function svgWhy() {
  return (
    '<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration comparing messy scattered data with a single trusted record">' +
    '<defs><linearGradient id="wg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5f8fb"/><stop offset="1" stop-color="#e8eff6"/></linearGradient>' +
    '<linearGradient id="wg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a4a7f"/><stop offset="1" stop-color="#031c33"/></linearGradient></defs>' +
    '<rect x="10" y="10" width="165" height="130" rx="16" fill="url(#wg1)" stroke="#e2e8f0"/>' +
    '<rect x="185" y="10" width="165" height="130" rx="16" fill="url(#wg2)"/>' +
    '<g font-family="Segoe UI,Arial,sans-serif" font-size="12" font-weight="700">' +
    '<text x="30" y="34" fill="#5a6b7a">Today — scattered</text><text x="205" y="34" fill="#d9edf5">With SHANZOO</text></g>' +
    '<g fill="#e2e8f0" stroke="#c3d0dd"><circle cx="55" cy="70" r="16"/><circle cx="95" cy="85" r="16"/><circle cx="135" cy="62" r="16"/><circle cx="80" cy="112" r="16"/><circle cx="128" cy="112" r="16"/></g>' +
    '<g fill="#6b7c8b"><circle cx="55" cy="70" r="4"/><circle cx="95" cy="85" r="4"/><circle cx="135" cy="62" r="4"/><circle cx="80" cy="112" r="4"/><circle cx="128" cy="112" r="4"/></g>' +
    '<circle cx="278" cy="76" r="24" fill="#00965e" stroke="#8fe6c1" stroke-width="2.5"/>' +
    '<path d="M266 76l8 8 17-20" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g stroke="#8fe6c1" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.9">' +
    '<line x1="228" y1="92" x2="236" y2="84"/><line x1="328" y1="92" x2="320" y2="84"/>' +
    '<line x1="228" y1="120" x2="328" y2="120"/></g>' +
    '<rect x="30" y="160" width="300" height="1" fill="#e2e8f0"/>' +
    '<g font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="600">' +
    '<text x="190" y="210" fill="#172b3a">Five systems&#8194;·&#8194;five answers</text>' +
    '<text x="100" y="238" fill="#5a6b7a">Duplicate records slow your reporting</text></g>' +
    '<rect x="110" y="258" width="140" height="24" rx="12" fill="#e7f6ef" stroke="#c7e8d8"/>' +
    '<g font-family="Segoe UI,Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle">' +
    '<text x="180" y="274" fill="#067a4c">One version of the truth</text></g></svg>'
  );
}

/* ------------------------------ Insights data ---------------------------- */
const insights = [
  {
    slug: "what-is-master-data-management",
    icon: "database",
    img: "Industries Sport.png",
    cat: "Data Management",
    title: "What Is Master Data Management?",
    excerpt:
      "Master data is your core business information — customers, products, suppliers. Learn how MDM keeps it accurate and consistent.",
    read: "5 min",
    updated: "2026",
    headings: [
      "What is master data?",
      "The golden record",
      "Why companies struggle",
      "An MDM program in plain steps"
    ]
  },
  {
    slug: "etl-vs-elt-whats-the-difference",
    icon: "refresh",
    img: "Industries Sport 1.png",
    cat: "Data Integration",
    title: "ETL vs. ELT: What's the Difference?",
    excerpt:
      "Two ways to move data between systems — one transforms before loading, the other loads first. Understand which fits your needs.",
    read: "4 min",
    updated: "2026",
    headings: [
      "The three letters explained",
      "ETL — transform before you load",
      "ELT — load first, transform later",
      "Which should you choose?",
      "How SHANZOO helps"
    ]
  },
  {
    slug: "why-data-quality-matters",
    icon: "circle",
    img: "Industries Sport 2.png",
    cat: "Data Management",
    title: "Why Data Quality Matters",
    excerpt:
      "Bad data quietly erodes every decision you make. Here is what data quality really involves and how to improve it.",
    read: "4 min",
    updated: "2026",
    headings: [
      "What is data quality?",
      "The cost of bad data",
      "Dimensions of quality",
      "Getting started"
    ]
  },
  {
    slug: "understanding-real-time-data-integration",
    icon: "radio",
    img: "Industries Sport 5.png",
    cat: "Data Integration",
    title: "Understanding Real-Time Data Integration",
    excerpt:
      "From nightly batch to near-real-time: how streaming and change data capture keep modern systems current.",
    read: "5 min",
    updated: "2026",
    headings: [
      "Why real time matters",
      "Batch vs. real-time movement",
      "How real-time integration works",
      "Where to start"
    ]
  }
];

function insightCard(root, post, delay, feature) {
  const url = href(root, "/pages/insights/" + post.slug + ".html");
  return (
    '<article class="insight-card' + (feature ? " insight-card--feature" : "") + ' reveal" data-delay="' + (delay || 0) + '">' +
    '<a class="insight-card__media" href="' + url + '" aria-label="Read: ' + post.title + '" tabindex="-1">' +
    '<img src="' + root + "assets/images/" + post.img + '" alt="' + post.title + '" width="1600" height="1000" loading="lazy" decoding="async">' +
    "</a>" +
    '<div class="insight-card__body">' +
    '<div class="insight-card__meta"><span class="badge badge--green">' + post.cat + "</span><span>" + post.read + " read</span></div>" +
    '<h3><a href="' + url + '">' + post.title + "</a></h3>" +
    "<p>" + post.excerpt + "</p>" +
    '<a class="text-link" href="' + url + '">Read Insight ' + svg("arrow") + "</a>" +
    "</div></article>"
  );
}

/* ------------------------------ Service content -------------------------- */
const SC = {
  "master-data-management": {
    problems: [
      { t: "Duplicate customer records", d: "The same customer appears in your CRM, billing system and newsletter tool with three different names, emails and account details." },
      { t: "Conflicting product information", d: "Sales, web and purchasing teams each describe and price the same product differently, causing errors and lost trust." },
      { t: "Unreliable reporting", d: "Reports vary depending on which system supplies the numbers, so leadership doubts what the dashboards say." }
    ],
    benefits: [
      { t: "ONE golden record", d: "A single, trusted version of each customer, product and supplier is created and shared across the business." },
      { t: "Faster, more accurate decisions", d: "Teams stop reconciling data manually and start acting on numbers they can trust." },
      { t: "Better customer experience", d: "Customer, order and service history line up, so staff see the complete picture." },
      { t: "Easier to stay compliant", d: "Consistent, auditable master records make it simpler to meet reporting and privacy expectations." }
    ],
    caps: [
      "Golden-record construction and survivorship rules",
      "Fuzzy matching and de-duplication across sources",
      "Customer, product, supplier and location hierarchies",
      "Data stewardship workflows and issue queues",
      "Reference data (codes, classifications) management",
      "Integration publishing to downstream systems",
      "KPIs and dashboards to monitor master data health"
    ],
    uses: [
      { t: "Customer 360 view", d: "Unify customer data across CRM, ERP, support and marketing platforms so every team sees the same person." },
      { t: "Clean product catalog", d: "A consistent product master for e-commerce, stores and procurement, with one shared code per item." },
      { t: "Vendor and supplier master", d: "Standardize supplier records to streamline purchasing, contracts and payments." }
    ],
    faqs: [
      { q: "What exactly is a 'golden record'?", a: "It is the single, best version of a piece of master data — for example one customer record — assembled from all the partial versions stored across your systems." },
      { q: "Is MDM the same as a data warehouse?", a: "No. A warehouse stores data for reporting. MDM keeps your core business entities (customers, products, vendors) accurate and consistent at the source, feeding the warehouse and everything else." },
      { q: "Do we need new software for MDM?", a: "Often not. We first look at what you already own. Many MDM projects reuse existing databases and tools with a well-designed matching and stewardship process." }
    ],
    help: "We assess your current master data and systems, then help you stand up a practical MDM program that matches your size — starting with the entities that matter most to your business.",
    helpPoints: [
      "Data audit and duplication analysis",
      "MDM design that fits your maturity",
      "Vendor-selection guidance (if needed)",
      "Golden-record rules and stewardship setup",
      "Hand-over, training and monitoring"
    ]
  },
  "data-governance": {
    problems: [
      { t: "Nobody owns the data", d: "No one is accountable for whether key datasets are correct, complete or current, so problems go unfixed." },
      { t: "Words don't mean the same to everyone", d: "Finance, sales and IT each define 'active customer' or 'revenue' differently, causing constant disputes." },
      { t: "Audit and privacy requests are painful", d: "You cannot quickly show where data came from, who changed it, or who is allowed to use it." }
    ],
    benefits: [
      { t: "Clear ownership and accountability", d: "Every important dataset has a named owner and agreed responsibilities." },
      { t: "One business language", d: "Shared definitions mean fewer arguments and more accurate decisions." },
      { t: "Faster, less stressful audits", d: "Lineage and catalog information let you answer 'where did this data come from?' in minutes." },
      { t: "Defensible privacy practices", d: "Governance helps you demonstrate responsible handling of personal data." }
    ],
    caps: [
      "Governance operating model and RACI decisions",
      "Business glossary and data dictionary",
      "Data cataloguing and classification",
      "End-to-end data lineage",
      "Policies, standards and stewardship workflows",
      "Data-quality rules and KPI reporting",
      "Connections to collaborating tooling (cloud, BI, MDM)"
    ],
    uses: [
      { t: "Regulated financial reporting", d: "Foundation for control frameworks such as GDPR, BCBS 239 and Basel III — where demonstrating oversight of risk data is expected." },
      { t: "Cloud migration governance", d: "Keep track of what data moves to the cloud, who can access it and how it is catalogued." },
      { t: "Self-service analytics enablement", d: "Let business users find and trust approved datasets through a well-maintained catalog." }
    ],
    faqs: [
      { q: "Is data governance just policies on paper?", a: "No — done well it is a combination of clear ownership, shared definitions and lightweight processes that teams actually use. We start small so it is practical, not bureaucratic." },
      { q: "Where should governance start?", a: "With the data your business depends on most: customers, finance and products. We help you prioritize instead of boiling the ocean." },
      { q: "Does governance guarantee compliance?", a: "No. Governance supports compliance and is commonly a foundation for frameworks like GDPR, but we do not claim that a program alone equals compliance — that is confirmed with your advisors and auditors." }
    ],
    help: "We help you design a governance approach that fits your culture — starting with the highest-value data, a realistic operating model and tools you can measure.",
    helpPoints: [
      "Readiness and priority assessment",
      "Ownership matrix and decision rights",
      "Business glossary and catalog build-out",
      "Lineage documentation and tooling",
      "Dashboards and ongoing operating rhythm"
    ]
  },
  "data-quality": {
    problems: [
      { t: "Decisions on shaky numbers", d: "Sales forecasts, inventory plans and budgets are quietly built on records with errors, gaps and duplicates." },
      { t: "Reports that don't add up", d: "Teams spend hours fixing spreadsheets and chasing inconsistencies before presentations." },
      { t: "Customer and partner friction", d: "Wrong addresses, duplicate mailings and mismatched records create rework and annoy customers." }
    ],
    benefits: [
      { t: "Trust in every report", d: "Decisions are based on data that has been inspected, cleaned and monitored." },
      { t: "Less manual rework", d: "Your team stops fighting data and spends time on the actual business." },
      { t: "Better customer experience", d: "Accurate contact and account details mean fewer mistakes and smoother service." },
      { t: "Cleaner systems over time", d: "Root causes are fixed at the source, so problems stop coming back." }
    ],
    caps: [
      "Data profiling and health assessments",
      "Validation rules and error correction",
      "Standardization of formats, addresses and names",
      "Duplicate detection, matching and merging",
      "Data enrichment (e.g. addresses, references)",
      "Continuous quality monitoring dashboards",
      "Remediation workflows and owner assignment"
    ],
    uses: [
      { t: "Cleaner sales pipeline", d: "Improve lead and account data so forecasts reflect reality instead of duplicates." },
      { t: "Standardized product catalog", d: "Unify naming, units and descriptions across channels for purchasing and e-commerce." },
      { t: "Accurate financial reporting", d: "Profiling and validation reduce the data errors that show up in monthly reporting." }
    ],
    faqs: [
      { q: "How is data quality measured?", a: "With simple dimensions such as completeness, accuracy, consistency, timeliness and uniqueness — measured by rules you define for each key dataset." },
      { q: "Do you clean data once, or forever?", a: "One-off cleansing fixes today's records; monitoring and remediation keep them clean. We set up both so quality does not decay." },
      { q: "Can data quality be handled without new tools?", a: "Yes. Profiling and cleaning can start with what you have — SQL, spreadsheets and existing platforms. We add tooling only when it clearly pays off." }
    ],
    help: "We profile your data first, show you exactly where the problems are, then help you fix root causes and put monitoring in place so quality holds.",
    helpPoints: [
      "Data-quality health assessment and report",
      "Cleansing, deduplication and standardization",
      "Validation rules and ownership setup",
      "Monitoring dashboards and alerting",
      "Team enablement and hand-over"
    ]
  },
  "data-security": {
    problems: [
      { t: "Sensitive data everywhere", d: "Customer and employee information sits in systems, exports and spreadsheets without consistent controls." },
      { t: "Too much access", d: "More people can see sensitive data than strictly need it, raising the risk of misuse or accidental exposure." },
      { t: "Audit blind spots", d: "No clear record of who accessed or changed sensitive information, making investigations and audits harder." }
    ],
    benefits: [
      { t: "Lower risk of breaches", d: "Fewer unnecessary copies and tighter access mean less exposure to exploit." },
      { t: "Controlled, least-privilege access", d: "Staff see only the data they need for their role." },
      { t: "Audit-ready trails", d: "Clear logs of access and change keep you prepared for review." },
      { t: "Stronger customer trust", d: "Responsible handling of personal and sensitive data protects your reputation." }
    ],
    caps: [
      "Role-based and attribute-based access control",
      "Static and dynamic data masking",
      "Field-level and column-level encryption",
      "Key management and rotation",
      "Audit logging and anomaly detection",
      "Data classification and tagging",
      "Integration with existing identity and DLP tools"
    ],
    uses: [
      { t: "Protecting personal data", d: "Protect customer and employee information with classification, masking and access controls." },
      { t: "Safer third-party access", d: "Let vendors and partners use production datasets in test environments through masking." },
      { t: "Finance and HR confidentiality", d: "Apply the strictest controls to compensation, banking and other highly sensitive fields." }
    ],
    faqs: [
      { q: "Is data masking the same as encryption?", a: "No. Encryption scrambles data so it cannot be read without a key; masking replaces real values (like a full credit-card number) with altered ones so sensitive data can be used safely in tests or dashboards." },
      { q: "We already use a database — is that enough?", a: "Database security is a good start, but risk lives in exports, reports, backups and copies. We help close those gaps." },
      { q: "Will this slow my applications?", a: "Designed well, controls are applied at the right layer with minimal performance impact. We plan and test carefully before rollout." }
    ],
    help: "We review how sensitive data flows through your environment, then design proportionate controls — access, masking, encryption and logging — that protect data without getting in the way of work.",
    helpPoints: [
      "Sensitive-data inventory and risk review",
      "Access-control design and hardening",
      "Masking and encryption implementation",
      "Audit logging and monitoring setup",
      "Policy documentation and staff guidance"
    ]
  },
  "data-architecture": {
    problems: [
      { t: "Slow queries and frustrated users", d: "Dashboards take minutes, reports time out and teams complain the system is too slow." },
      { t: "A tangle of little databases", d: "Years of quick fixes left a sprawl of spreadsheets, silos and overlapping schemas that are hard to trust." },
      { t: "Hard to grow", d: "Adding a new source, metric or system feels like major surgery every time." }
    ],
    benefits: [
      { t: "Designed for the long term", d: "An architecture you can extend without redesigning from scratch." },
      { t: "Faster, cheaper queries", d: "Good modeling means workloads hit the right storage and returns: performance." },
      { t: "Consistent patterns", d: "Clear naming, standards and responsibilities across your data landscape." },
      { t: "Future-ready", d: "Room for new volumes, sources and analytics without rework." }
    ],
    caps: [
      "Logical and physical data modeling (3NF, dimensional)",
      "Data warehouse, lake and lakehouse design",
      "Schema design and naming standards",
      "Medallion / staging-to-curated pipeline patterns",
      "Metadata-driven, reusable data engineering",
      "Migration and consolidation planning",
      "Cost and performance optimization reviews"
    ],
    uses: [
      { t: "New data warehouse", d: "Design a warehouse that serves finance, sales and operations with one consistent model." },
      { t: "Lakehouse adoption", d: "Introduce a lakehouse pattern that combines the low cost of a data lake with reliable analytics." },
      { t: "Merging multiple systems", d: "Consolidate overlapping applications and data stores into a clean target architecture." }
    ],
    faqs: [
      { q: "What is a lakehouse?", a: "A data architecture that combines the flexible, low-cost storage of a data lake with the reliability and performance of a data warehouse — a popular modern pattern." },
      { q: "Warehouse, lake or lakehouse — which do we need?", a: "It depends on your workloads, volumes and skills. We help you choose the pragmatic option rather than following the latest trend." },
      { q: "Do we have to rebuild everything?", a: "Rarely. Good architecture work typically improves and consolidates what exists, prioritizing high-impact changes first." }
    ],
    help: "We document your current landscape, design a target architecture in plain language, and sequence the changes so you deliver value early without throwing away what already works.",
    helpPoints: [
      "Current-state architecture review",
      "Target architecture and roadmap",
      "Data modeling and standards definition",
      "Pipeline and storage pattern design",
      "Execution support alongside your team"
    ]
  },
  "etl-elt": {
    problems: [
      { t: "Manual data copying", d: "Files get exported, emailed and re-keyed by hand — losing time and introducing errors." },
      { t: "Brittle, unmaintained scripts", d: "Pipeline jobs break silently at 2 a.m. and nobody notices until the morning." },
      { t: "No visibility into data flow", d: "You cannot explain what load ran when, what changed, or whether the numbers are right." }
    ],
    benefits: [
      { t: "Reliable, repeatable loads", d: "Scheduled pipelines run without manual babysitting — with monitored failures and retries." },
      { t: "Auditable and explainable", d: "You can see what was loaded, when and from where, for every run." },
      { t: "More staff time back", d: "Data teams stop hand-feeding systems and focus on analysis and improvements." },
      { t: "Scales as you grow", d: "Pipelines handle larger volumes and new sources without rewrites." }
    ],
    caps: [
      "Full and incremental batch loads",
      "ETL and ELT pipeline design",
      "Orchestration, scheduling and dependencies",
      "Data validation and error handling",
      "Lineage and run logging",
      "Cloud and on-premise targets",
      "Performance tuning and cost control"
    ],
    uses: [
      { t: "Nightly warehouse refresh", d: "Copies of transactional data flow into the analytics warehouse every night, clean and complete." },
      { t: "SaaS to warehouse sync", d: "Bring Salesforce, billing and marketing-platform data together for reporting." },
      { t: "Legacy system archiving", d: "Move historical data out of aging systems into lower-cost storage, safely and auditably." }
    ],
    faqs: [
      { q: "What is the difference between ETL and ELT?", a: "Both move data between systems. ETL transforms the data before loading it into the target; ELT loads the raw data first and transforms it inside the target warehouse. ELT suits large cloud warehouses; ETL suits traditional databases and complex transformations at the source." },
      { q: "How often should data load?", a: "As often as the business needs it. Many reports run daily; some teams need intra-day or near-real-time — we match the schedule to the decision." },
      { q: "Which tools do you use?", a: "We design tool-agnostic pipelines and work with what you have, or guide you on open-source and commercial options that fit your budget." }
    ],
    help: "We design, build and run batch pipelines that move your data reliably — with clear monitoring, sensible schedules and documentation your team can maintain.",
    helpPoints: [
      "Source and target assessment",
      "Pipeline architecture and tooling selection",
      "Pipeline build, testing and scheduling",
      "Monitoring, logging and alerting",
      "Documentation and team hand-over"
    ]
  },
  "change-data-capture": {
    problems: [
      { t: "Data is always a little stale", d: "The analytics warehouse only catches up with the database once a night, so dashboards lag the real business." },
      { t: "Heavy, disruptive reloads", d: "Full refreshes hammer the production database and disturb users." },
      { t: "Downstream systems drift apart", d: "Caches, search indexes and reporting stores slowly become inconsistent with the source of truth." }
    ],
    benefits: [
      { t: "Near-real-time freshness", d: "Downstream systems stay current as changes happen — not just overnight." },
      { t: "Minimal source impact", d: "Changes are captured efficiently without expensive full reloads." },
      { t: "Reliable change ordering", d: "Events are delivered in order, so downstream logic stays correct." },
      { t: "One mechanism, many consumers", d: "The same change stream can feed a lake, a stream and a cache simultaneously." }
    ],
    caps: [
      "Log-based change capture (no application changes needed)",
      "Debezium, AWS DMS, Kafka Connect and similar",
      "Ordering, exactly-once and idempotent delivery",
      "Schema evolution handling",
      "Conflict and duplicate management",
      "Latency and throughput monitoring"
    ],
    uses: [
      { t: "OLTP to analytics in real time", d: "Keep your warehouse or lake current with every order, inventory and account change." },
      { t: "Feeding event streams", d: "Publish business changes as events for downstream processing and alerting." },
      { t: "Keeping caches and indexes current", d: "Synchronize search indexes and microservice caches without bespoke integrations." }
    ],
    faqs: [
      { q: "How does CDC differ from batch ETL?", a: "ETL moves data on a schedule in batches. CDC captures changes as they happen at the source and moves only those changes, giving near-real-time results with far less load." },
      { q: "Does CDC only work with specific databases?", a: "It is most common with major relational databases (such as PostgreSQL, MySQL, SQL Server and Oracle) and works with managed cloud databases as well." },
      { q: "Will CDC slow our production database?", a: "Log-based CDC reads the database's own change logs, which is designed for this purpose and typical impact is minimal compared with full dumps." }
    ],
    help: "We design and implement realistic CDC pipelines — right technology, ordering, monitoring and fallback — so your systems stay in sync without putting your production data at risk.",
    helpPoints: [
      "Source review and feasibility check",
      "CDC architecture and technology selection",
      "Pipeline implementation with monitoring",
      "Backfill strategy for initial load",
      "Failover and restart handling"
    ]
  },
  "api-integration": {
    problems: [
      { t: "Spaghetti point-to-point links", d: "Every system talks to every other system directly, creating a maze that is hard to change or debug." },
      { t: "Security gaps", d: "Passwords in scripts and open ports replace properly secured, authenticated interfaces." },
      { t: "No shared understanding", d: "Each integration interprets fields differently, so data quality degrades between systems." }
    ],
    benefits: [
      { t: "Clean, decoupled connections", d: "Systems share data through well-defined interfaces instead of tangled private hooks." },
      { t: "Real-time, reliable sharing", d: "Data flows when events happen, not when someone runs a script." },
      { t: "Governed and monitored", d: "Every API is versioned, secured, documented and watched." },
      { t: "Easier to evolve", d: "You can change one system without breaking the rest." }
    ],
    caps: [
      "REST and GraphQL API design and build",
      "API gateway and routing",
      "Authentication: OAuth2, JWT, mTLS",
      "Contract testing and versioning",
      "Error handling and retry policies",
      "Observability and usage analytics",
      "Microservices integration patterns"
    ],
    uses: [
      { t: "SaaS to SaaS connectivity", d: "Connect CRM, billing, marketing and support platforms so records stay in step." },
      { t: "Internal application integration", d: "Replace file drops and manual exports with monitored API connections." },
      { t: "Partner and supplier integration", d: "Expose clean, secure interfaces for partners to exchange orders, availability and status." }
    ],
    faqs: [
      { q: "What is the difference between REST and GraphQL?", a: "REST exposes fixed endpoints with clear resources; GraphQL lets clients request exactly the fields they need. Both are valid — we pick the right pattern for each integration." },
      { q: "Are APIs safe to expose?", a: "Yes, when designed with strong authentication, encryption, rate limits and monitoring from day one." },
      { q: "How do I prevent one failing system from breaking others?", a: "With timeouts, retries, circuit breakers and message-backed queues — resilience patterns we design in deliberately." }
    ],
    help: "We design and build API-based integrations that are secure, documented and monitored, so your applications share data reliably without creating a maintenance nightmare.",
    helpPoints: [
      "Integration landscape review",
      "API design and standards",
      "Implementation and contract testing",
      "Gateway, auth and security hardening",
      "Monitoring, docs and runbooks"
    ]
  },
  "event-streaming": {
    problems: [
      { t: "Information moves too slowly", d: "Actions taken at midnight are too late for a market that moved at noon." },
      { t: "Systems can't react to events", d: "Orders, shipments and user actions pass silently, so automation never triggers." },
      { t: "No single event history", d: "There is no reliable record of what happened and when, making reconciliation hard." }
    ],
    benefits: [
      { t: "Near-real-time visibility", d: "Dashboards and operations see events as they happen, not hours later." },
      { t: "Scalable, durable messaging", d: "Streaming platforms hold and replay events reliably at very high volumes." },
      { t: "Automation-ready", d: "New consumers can subscribe to events without touching existing systems." },
      { t: "Business-wide consistency", d: "One event log acts as a trusted chronology of business activity." }
    ],
    caps: [
      "Apache Kafka and managed streaming platforms",
      "Producers, consumers and topic design",
      "Schema registries and compatibility",
      "Stream processing and real-time enrichment",
      "Exactly-once and replay semantics",
      "Throughput tuning and monitoring"
    ],
    uses: [
      { t: "Real-time operational dashboards", d: "Stream order and inventory activity into live views that the whole team watches." },
      { t: "Order lifecycle pipelines", d: "Each order state change triggers validation, stock, billing and fulfillment steps." },
      { t: "Sensor and telemetry intake", d: "Collect continuous measurement data from devices and process it as it arrives." }
    ],
    faqs: [
      { q: "What is Apache Kafka?", a: "Kafka is a popular open-source platform for streaming events. It reliably stores and delivers messages at massive scale, making it a common backbone for real-time integration." },
      { q: "Is streaming always better than batch?", a: "No. Batch is simpler and perfectly adequate for many reporting needs. Streaming earns its place where recency matters — we help you decide honestly." },
      { q: "What happens if a consumer goes down?", a: "Events are retained on the stream, so the consumer can resume from where it stopped — one of the main reliability benefits." }
    ],
    help: "We introduce streaming only where it pays off — designing topics, schemas and consumers, and connecting it with your existing data pipeline so nothing is wasted.",
    helpPoints: [
      "Use-case and readiness evaluation",
      "Platform selection (Kafka or managed brokers)",
      "Topic, schema and processing design",
      "Build, tune and monitor implementation",
      "Integration with batch architecture"
    ]
  },
  "data-virtualization": {
    problems: [
      { t: "Data scattered across many systems", d: "The answers you need live in six databases and files, and pulling them together is a project." },
      { t: "Too many duplicate copies", d: "Data is copied into one more tool after another, driving cost, drift and governance headaches." },
      { t: "Slow time to answers", d: "By the time a cross-system report is finally assembled, the question has moved on." }
    ],
    benefits: [
      { t: "One logical view of data", d: "Query across systems as if they were a single database." },
      { t: "Fewer copies, lower cost", d: "Answer questions where the data lives instead of replicating everything." },
      { t: "Faster time to value", d: "Stand up a unified view in weeks, not a multi-month build." },
      { t: "Governed, safe access", d: "Security and masking applied in one layer across all underlying systems." }
    ],
    caps: [
      "Cross-database query federation",
      "Logical and semantic data layers",
      "Reading from databases, clouds, lakes and files",
      "Caching for performance-critical queries",
      "Centralized security and masking",
      "Metadata and unified catalog integration"
    ],
    uses: [
      { t: "Cross-system dashboards", d: "Report on orders from the ERP, subscriptions from billing and leads from the CRM without copying everything." },
      { t: "Fast view after a merger", d: "Get a combined view of two companies' data quickly while the integration program runs." },
      { t: "Self-service analytics", d: "Give business users a governed, logical model over messy physical data." }
    ],
    faqs: [
      { q: "Is virtualization the same as a data warehouse?", a: "No. A warehouse copies and organizes data for analytics. Virtualization leaves data in place and provides a unified query layer over it. Many organizations use both." },
      { q: "Is it fast enough for production?", a: "For many reporting and operational needs, yes — especially with smart caching. It is not always the right fit for heavy, repeated workloads, and we tell you honestly when." },
      { q: "When should we copy data instead?", a: "When you need high performance, complex transformations or long history. Virtualization is best for speed-to-value and quick access across sources." }
    ],
    help: "We help you choose where virtualization genuinely helps, stand up the logical layer, and keep the balance between virtual access, caching and physical copies.",
    helpPoints: [
      "Use-case evaluation and data inventory",
      "Virtualization layer design",
      "Caching and performance strategy",
      "Federation and security setup",
      "Governance and catalog alignment"
    ]
  }
};

/* ------------------------------ Service page ----------------------------- */
function buildService(svc) {
  const root = "../";
  const c = SC[svc.slug];
  const art = D.SERVICE_ART[svc.slug] || D.svgNetwork;

  const navSections = [
    ["overview", "Overview"],
    ["problems", "Problems It Solves"],
    ["benefits", "Key Benefits"],
    ["capabilities", "Technical Capabilities"],
    ["use-cases", "Business Use Cases"],
    ["approach", "How SHANZOO Helps"],
    ["faqs", "FAQ"]
  ];

  const svcNavInner =
    "<h2>On this page</h2><ul>" +
    navSections.map((s) => '<li><a href="#' + s[0] + '">' + s[1] + "</a></li>").join("") +
    "</ul>" +
    '<div class="svc-nav__cta"><p class="mega__desc mb-2">Talk through this service with our team.</p>' +
    '<a class="btn btn--primary btn--md btn--block" href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a></div>';

  const crumbItems = [
    { href: "/index.html", label: "Home" },
    { href: "/pages/services.html", label: "Services" },
    { href: svc.cat === "management" ? "/pages/data-management.html" : "/pages/data-integration.html", label: svc.cat === "management" ? "Data Management" : "Data Integration" },
    { label: svc.title }
  ];

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  const body = [
    '<section class="page-hero">' +
      '<div class="container page-hero__inner">' +
      "<div>" +
      '<p class="eyebrow eyebrow--light">' + svc.category + " Service</p>" +
      "<h1>" + svc.title + "</h1>" +
      "<p>" + svc.heroSub + "</p>" +
      '<div class="mt-3">' + crumbs({ root }, crumbItems) + "</div>" +
      '<div class="pill-row mt-3">' +
      '<span class="badge badge--light">' + svg("check") + " " + svc.benefit + "</span>" +
      '<span class="badge badge--light">' + svg("users") + " Consultancy &amp; delivery</span>" +
      "</div>" +
      '<div class="hero__actions mt-3">' +
      '<a class="btn btn--primary" href="' + href(root, "/pages/contact.html#consultation") + '">Request a Consultation</a>' +
      '<a class="btn btn--outline-light" href="' + href(root, "/pages/contact.html") + '">Email Us</a>' +
      "</div>" +
      "</div>" +
      '<div class="page-hero__aside"><div class="service-hero__visual">' + art() + "</div></div>" +
      "</div></section>" +
      '<div class="container svc-layout mt-4" style="padding-block: 2.5rem">' +
      '<div class="svc-nav" aria-label="On this page">' + svcNavInner + "</div>" +
      '<div class="svc-content">' +
      '<section id="overview" class="mb-4" style="scroll-margin-top: 110px">' +
      '<div class="section-head"><p class="eyebrow">In plain English</p><h2>What this service does for your business</h2></div>' +
      '<div class="prose">' + c.help + "</div>" +
      '<div class="grid grid-2 mt-3">' +
      c.helpPoints
        .map(
          (p) =>
            '<div class="value-item"><div class="value-item__icon">' + svg("check") + '</div><div><p style="color:var(--ink);font-weight:600">' + p + "</p></div></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="problems" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("The business problems it solves", "Sound familiar? This is what we fix.") +
      '<div class="grid grid-3">' +
      c.problems
        .map(
          (pr, i) =>
            '<div class="panel panel--alt reveal" data-delay="' + (i % 3) + '"><h4>' + pr.t + '</h4><p class="mt-1">' + pr.d + "</p></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="benefits" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("Key benefits", "What you gain.") +
      '<div class="grid grid-2">' +
      c.benefits
        .map(
          (b, i) =>
            '<div class="value-item reveal" data-delay="' + (i % 2) + '"><div class="value-item__icon">' + svg("circle") + '</div><div><h4>' + b.t + "</h4><p>" + b.d + "</p></div></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="capabilities" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("Technical capabilities", "The detail, for those who like it.") +
      '<div class="panel">' +
      '<ul class="check-list grid grid-2">' +
      c.caps.map((cap) => "<li>" + svg("check") + cap + "</li>").join("") +
      "</ul></div>" +
      "</section>" +
      '<section id="use-cases" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("Common business use cases", "Where this service is most valuable.") +
      '<div class="timeline">' +
      c.uses
        .map(
          (u) =>
            '<div class="timeline__item is-active"><div class="timeline__dot">' + svg("target") + "</div><h3>" + u.t + "</h3><p>" + u.d + "</p></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="approach" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("How SHANZOO helps", "A clear path, at your pace.") +
      '<div class="panel panel--green"><p class="lead" style="color:var(--ink)">' + c.help + "</p></div>" +
      '<div class="steps steps--vertical mt-3">' +
      [
        { t: "Discovery & goals", d: "We start with a conversation to understand the outcome you want and the constraints you work within." },
        { t: "Current-state review", d: "We examine your existing data, systems and processes to see exactly what stands in the way." },
        { t: "Solution design", d: "You receive a clear, prioritised design with realistic effort and technology choices." },
        { t: "Delivery & improvement", d: "We build with your team, test carefully, then monitor and improve over time." }
      ]
        .map(
          (s, i) =>
            '<div class="step"><span class="step__num">' + (i + 1) + "</span><h3>" + s.t + "</h3><p>" + s.d + "</p></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="faqs" style="scroll-margin-top: 110px">' +
      sectionHead("Frequently asked questions", "Straight answers in plain language.") +
      c.faqs
        .map(
          (f) =>
            '<div class="accordion"><button class="accordion__btn" type="button">' + f.q + '<span class="accordion__sign">' + svg("plus") + "</span></button><div class=\"accordion__panel\"><div><p>" + f.a + "</p></div></div></div>"
        )
        .join("") +
      "</section>" +
      "</div></div>" +
      '<section class="section bg-alt">' +
      '<div class="container">' +
      sectionHead("Related services", "Explore services that work well alongside this one.") +
      '<div class="related">' +
      relatedServices(svc.slug)
        .map(
          (r) =>
            '<a class="related-link" href="' + href(root, "/services/" + r.slug + ".html") + '"><span class="related-link__icon">' + svg(r.icon) + '</span><span class="related-link__text"><strong>' + r.title + "</strong><span>" + r.short + "</span></span></a>"
        )
        .join("") +
      "</div>" +
      '<div class="mt-4"><div class="grid grid-3">' +
      [
        { href: "/pages/data-management.html", t: "Data Management Overview", d: "All five management services in one place", icon: "layers" },
        { href: "/pages/data-integration.html", t: "Data Integration Overview", d: "All five integration services in one place", icon: "link" },
        { href: "/pages/services.html", t: "All Services", d: "The complete SHANZOO service catalog", icon: "archive" }
      ]
        .map(
          (x) =>
            '<a class="related-link" href="' + href(root, x.href) + '"><span class="related-link__icon">' + svg(x.icon) + '</span><span class="related-link__text"><strong>' + x.t + "</strong><span>" + x.d + "</span></span></a>"
        )
        .join("") +
      "</div></div>" +
      "</div></section>" +
      '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Want to talk about " + svc.title.toLowerCase() + "?",
        lead: "Tell us about your data challenges and we will point you in the right direction — quickly and honestly.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Contact SHANZOO", cls: "btn--primary btn--lg" }]
      }) +
      "</div></section>"
  ];

  return page({
    root,
    title: svc.title + " | Data " + (svc.cat === "management" ? "Management" : "Integration") + " | SHANZOO",
    desc: metaDesc(svc.short + " " + svc.benefit + " SHANZOO helps businesses " + c.help.split("We ")[1]),
    ogType: "article",
    canonicalPath: "services/" + svc.slug + ".html",
    body: body.join("\n") +
      '<script type="application/ld+json">' + JSON.stringify(faqJson) + "</script>"
  });
}

/* ------------------------------ Category pages --------------------------- */
function buildDataManagement() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "Data Management",
      title: "Keep your business data clean, secure and trustworthy.",
      lead: "Good data management means your most important information is accurate, protected and understood — so every report and decision starts from a solid foundation.",
      aside:
        '<div class="cta-mini">' + svg("shield") + "<span><strong>Five focus areas</strong><br>Master data · Governance · Quality · Security · Architecture</span></div>",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { href: "/pages/services.html", label: "Services" },
        { label: "Data Management" }
      ]
    }),
    '<section class="section">' +
      '<div class="container split">' +
      "<div>" +
      sectionHead("What is data management?", "It is the discipline of keeping your data in good shape.") +
      '<div class="prose"><p>Think of data management as housekeeping for your business information. It covers the people, policies and technology that keep data <strong>accurate, secure and understood</strong> so the rest of the business can rely on it.</p>' +
      "<p>Without it, the same customer can have five records, reports disagree, and nobody can say for sure who is allowed to see sensitive data.</p></div>" +
      '<ul class="check-list mt-3">' +
      "<li>" + svg("check") + "One consistent view of customers, products and suppliers.</li>" +
      "<li>" + svg("check") + "Clear ownership and shared definitions for key data.</li>" +
      "<li>" + svg("check") + "Data that is monitored and cleaned continuously.</li>" +
      "<li>" + svg("check") + "Sensitive information protected by design.</li>" +
      "</ul>" +
      '<a class="btn btn--primary mt-3" href="' + href(root, "/pages/contact.html#consultation") + '">Discuss Your Data Challenges</a>' +
      "</div>" +
      '<div class="split__media"><div class="visual visual--navy">' + D.svgLayers() + "</div></div>" +
      "</div></section>",
    '<section class="section bg-alt">' +
      '<div class="container">' +
      sectionHead("Our Data Management services", "Five ways we keep your information under control.") +
      '<div class="grid grid-3">' +
      D.NAV.megaManagement.map((m, i) => serviceCard(root, bySlug(m.slug), { delay: i % 3 })).join("") +
      "</div></div></section>",
    '<section class="section">' +
      '<div class="container">' +
      sectionHead("A simple way to think about it", "Start with the data that matters most, then build outward.", true) +
      '<div class="timeline">' +
      '<div class="timeline__item is-active"><div class="timeline__dot">' + svg("scan") + "</div><h3>Define</h3><p>Agree on what 'customer', 'product' and 'supplier' mean, and who owns them.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("shield") + "</div><h3>Govern</h3><p>Set rules, responsibilities and approvals for how data is created and changed.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("circle") + "</div><h3>Cleanse</h3><p>Fix duplicates, gaps and errors — then monitor so they stay fixed.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("lock") + "</div><h3>Protect</h3><p>Control access, mask sensitive values and keep an audit trail.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("layers") + "</div><h3>Model</h3><p>Design storage and models that are organized, scalable and future-ready.</p></div>" +
      "</div></div></section>",
    '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Your data house needs a clear system.",
        lead: "Let's design a practical data management approach for your business.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Talk to Us", cls: "btn--primary btn--lg" }]
      }) +
      "</div></section>"
  ];
  return page({
    root,
    title: "Data Management Services | Master Data, Governance, Quality, Security, Architecture | SHANZOO",
    desc: "SHANZOO data management services keep your master data, governance, data quality, security and architecture clean, controlled and future-ready.",
    canonicalPath: "pages/data-management.html",
    body: body.join("\n")
  });
}

function buildDataIntegration() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "Data Integration",
      title: "Connect your systems so data flows where it is needed.",
      lead: "Integration is how your applications, warehouses and teams work from the same information — on time, reliably and without fragile custom links.",
      aside:
        '<div class="cta-mini">' + svg("zap") + "<span><strong>Five integration patterns</strong><br>Batch · CDC · APIs · Streaming · Virtualization</span></div>",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { href: "/pages/services.html", label: "Services" },
        { label: "Data Integration" }
      ]
    }),
    '<section class="section">' +
      '<div class="container split split--reverse">' +
      '<div class="split__media"><div class="visual visual--navy">' + D.svgPipeline() + "</div></div>" +
      "<div>" +
      sectionHead("What is data integration?", "Data integration is how your systems talk to each other.") +
      '<div class="prose"><p>Nearly every business runs on multiple systems: an ERP, a CRM, a billing platform, a warehouse. Data integration is what keeps them <strong>in step</strong>, moving information between systems on a schedule, in real time, or on demand.</p>' +
      "<p>Done simply and reliably, it means the numbers in your dashboard match the system of record, orders never get stranded between systems, and changes appear when they happen.</p></div>" +
      '<ul class="check-list mt-3">' +
      "<li>" + svg("check") + "Data moves reliably between systems, by design.</li>" +
      "<li>" + svg("check") + "Freshness matches the decision — batch when appropriate, real time when it matters.</li>" +
      "<li>" + svg("check") + "Connections are monitored, secure and easy to change.</li>" +
      "<li>" + svg("check") + "No more fragile scripts and manual exports.</li>" +
      "</ul>" +
      '<a class="btn btn--primary mt-3" href="' + href(root, "/pages/contact.html#consultation") + '">Review Your Integration Needs</a>' +
      "</div>" +
      "</div></section>",
    '<section class="section bg-alt">' +
      '<div class="container">' +
      sectionHead("Our Data Integration services", "Five patterns that keep your systems connected.") +
      '<div class="grid grid-3">' +
      D.NAV.megaIntegration.map((m, i) => serviceCard(root, bySlug(m.slug), { delay: i % 3 })).join("") +
      "</div></div></section>",
    '<section class="section">' +
      '<div class="container">' +
      sectionHead("Choosing the right pattern", "The freshness of the answer should decide how data moves.", true) +
      '<div class="grid grid-2">' +
      '<div class="panel"><h4>Batch is right when“¦</h4><ul class="check-list mt-2">' +
      "<li>" + svg("check") + "Daily or nightly reporting is enough.</li>" +
      "<li>" + svg("check") + "You move large volumes in one predictable go.</li>" +
      "<li>" + svg("check") + "The data is historical, not time-sensitive.</li>" +
      "</ul></div>" +
      '<div class="panel panel--green"><h4>Real time is right when“¦</h4><ul class="check-list mt-2">' +
      "<li>" + svg("check") + "Dashboards need today's, not yesterday's, numbers.</li>" +
      "<li>" + svg("check") + "Systems must react to events (orders, payments, shipments).</li>" +
      "<li>" + svg("check") + "Stale data causes real business cost.</li>" +
      "</ul></div>" +
      "</div>" +
      '<p class="center mt-4">Not sure which fits? <a class="text-link" href="' + href(root, "/pages/contact.html#consultation") + '">We will help you decide.' + svg("arrow") + "</a></p>" +
      "</div></section>",
    '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Is integration costing you time and trust?",
        lead: "Let's make your systems work from the same data — reliably, at the right speed.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Let's Talk", cls: "btn--primary btn--lg" }]
      }) +
      "</div></section>"
  ];
  return page({
    root,
    title: "Data Integration Services | ETL, CDC, APIs, Streaming, Virtualization | SHANZOO",
    desc: "SHANZOO data integration services connect your systems reliably — batch processing, change data capture, APIs, event streaming and virtualization.",
    canonicalPath: "pages/data-integration.html",
    body: body.join("\n")
  });
}

/* ------------------------------ Track record page ------------------------ */
function buildTrackRecord() {
  const root = "../";
  const projects = D.TRACK_RECORD;
  const body = [
    pageHero({
      root,
      eyebrow: "Proven Track Record",
      title: "Enterprise experience that speaks for itself.",
      lead: "A selection of real enterprise engagements across contact centers, portals, infrastructure, DevOps and secure cloud communications.",
      aside:
        '<div class="cta-mini">' + svg("check") + "<span><strong>" + projects.length + " enterprise engagements</strong><br>Across regulated and high-scale environments</span></div>",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Track Record" }
      ]
    }),
    '<section class="section"><div class="container">' +
      '<div class="track-grid">' +
      projects
        .map(
          (p, i) =>
            '<article class="track-detail reveal" data-delay="' + (i % 2) + '">' +
            '<div class="track-detail__top">' +
            '<span class="track-detail__year">' + p.year + "</span>" +
            '<span class="track-card__cat"><span class="track-card__cat-icon">' + svg(p.icon) + "</span>" + p.category + "</span>" +
            "</div>" +
            '<h2 class="track-detail__client">' + p.client + "</h2>" +
            '<p class="track-detail__text">' + p.detail + "</p>" +
            "</article>"
        )
        .join("") +
      "</div>" +
      trackCtaCard(root) +
      "</div></section>"
  ];
  return page({
    root,
    title: "Track Record | Enterprise Engagements | SHANZOO",
    desc: "Selected enterprise engagements delivered by SHANZOO across contact centers, portal development, optimization, DevOps and secure cloud communications.",
    canonicalPath: "pages/track-record.html",
    body: body.join("\n")
  });
}

/* ------------------------------ Technology service page ------------------ */
function buildTechService(slug) {
  const root = "../";
  const svc = D.CORE_SERVICES.find((s) => s.slug === slug);
  const c = D.TECH_SERVICE_CONTENT[slug];
  const artMap = {
    "cloud-virtualization": D.svgCloud,
    "software-development": D.svgLayers,
    "consulting-managed-services": D.svgBlueprint,
    "enterprise-automation": D.svgAutomation
  };
  const art = artMap[slug] || D.svgNetwork;

  const navSections = [
    ["overview", "Overview"],
    ["problems", "Problems It Solves"],
    ["benefits", "Key Benefits"],
    ["capabilities", "Technical Capabilities"],
    ["use-cases", "Business Use Cases"],
    ["approach", "How SHANZOO Helps"],
    ["faqs", "FAQ"]
  ];

  const svcNavInner =
    "<h2>On this page</h2><ul>" +
    navSections.map((s) => '<li><a href="#' + s[0] + '">' + s[1] + "</a></li>").join("") +
    "</ul>" +
    '<div class="svc-nav__cta"><p class="mega__desc mb-2">Talk through this service with our team.</p>' +
    '<a class="btn btn--primary btn--md btn--block" href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a></div>';

  const crumbItems = [
    { href: "/index.html", label: "Home" },
    { href: "/pages/services.html", label: "Services" },
    { label: c.category }
  ];

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  const related = D.CORE_SERVICES.filter((s) => s.slug !== slug)
    .map(
      (r) =>
        '<a class="related-link" href="' + href(root, r.href) + '"><span class="related-link__icon">' + svg(r.icon) + '</span><span class="related-link__text"><strong>' + r.title + "</strong><span>" + r.summary + "</span></span></a>"
    )
    .join("");

  const body = [
    '<section class="page-hero">' +
      '<div class="container page-hero__inner">' +
      "<div>" +
      '<p class="eyebrow eyebrow--light">' + c.category + " Service</p>" +
      "<h1>" + svc.title + "</h1>" +
      "<p>" + c.heroSub + "</p>" +
      '<div class="mt-3">' + crumbs({ root }, crumbItems) + "</div>" +
      '<div class="pill-row mt-3">' +
      '<span class="badge badge--light">' + svg("check") + " " + c.benefit + "</span>" +
      '<span class="badge badge--light">' + svg("users") + " Consultancy &amp; delivery</span>" +
      "</div>" +
      '<div class="hero__actions mt-3">' +
      '<a class="btn btn--primary" href="' + href(root, "/pages/contact.html#consultation") + '">Request a Consultation</a>' +
      '<a class="btn btn--outline-light" href="' + href(root, "/pages/contact.html") + '">Email Us</a>' +
      "</div>" +
      "</div>" +
      '<div class="page-hero__aside"><div class="service-hero__visual">' + art() + "</div></div>" +
      "</div></section>" +
      '<div class="container svc-layout mt-4" style="padding-block: 2.5rem">' +
      '<div class="svc-nav" aria-label="On this page">' + svcNavInner + "</div>" +
      '<div class="svc-content">' +
      '<section id="overview" class="mb-4" style="scroll-margin-top: 110px">' +
      '<div class="section-head"><p class="eyebrow">In plain English</p><h2>What this service does for your business</h2></div>' +
      '<div class="prose">' + c.help + "</div>" +
      '<div class="grid grid-2 mt-3">' +
      c.helpPoints
        .map(
          (p) =>
            '<div class="value-item"><div class="value-item__icon">' + svg("check") + '</div><div><p style="color:var(--ink);font-weight:600">' + p + "</p></div></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="problems" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("The business problems it solves", "Sound familiar? This is what we fix.") +
      '<div class="grid grid-3">' +
      c.problems
        .map(
          (pr, i) =>
            '<div class="panel panel--alt reveal" data-delay="' + (i % 3) + '"><h4>' + pr.t + '</h4><p class="mt-1">' + pr.d + "</p></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="benefits" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("Key benefits", "What you gain.") +
      '<div class="grid grid-2">' +
      c.benefits
        .map(
          (b, i) =>
            '<div class="value-item reveal" data-delay="' + (i % 2) + '"><div class="value-item__icon">' + svg("circle") + '</div><div><h4>' + b.t + "</h4><p>" + b.d + "</p></div></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="capabilities" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("Technical capabilities", "The detail, for those who like it.") +
      '<div class="panel">' +
      '<ul class="check-list grid grid-2">' +
      c.caps.map((cap) => "<li>" + svg("check") + cap + "</li>").join("") +
      "</ul></div>" +
      "</section>" +
      '<section id="use-cases" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("Common business use cases", "Where this service is most valuable.") +
      '<div class="timeline">' +
      c.uses
        .map(
          (u) =>
            '<div class="timeline__item is-active"><div class="timeline__dot">' + svg("target") + "</div><h3>" + u.t + "</h3><p>" + u.d + "</p></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="approach" class="mb-4" style="scroll-margin-top: 110px">' +
      sectionHead("How SHANZOO helps", "A clear path, at your pace.") +
      '<div class="panel panel--green"><p class="lead" style="color:var(--ink)">' + c.help + "</p></div>" +
      '<div class="steps steps--vertical mt-3">' +
      [
        { t: "Discovery & goals", d: "We start with a conversation to understand the outcome you want and the constraints you work within." },
        { t: "Current-state review", d: "We examine your existing systems, data and processes to see exactly what stands in the way." },
        { t: "Solution design", d: "You receive a clear, prioritised design with realistic effort and technology choices." },
        { t: "Delivery & improvement", d: "We build with your team, test carefully, then monitor and improve over time." }
      ]
        .map(
          (s, i) =>
            '<div class="step"><span class="step__num">' + (i + 1) + "</span><h3>" + s.t + "</h3><p>" + s.d + "</p></div>"
        )
        .join("") +
      "</div>" +
      "</section>" +
      '<section id="faqs" style="scroll-margin-top: 110px">' +
      sectionHead("Frequently asked questions", "Straight answers in plain language.") +
      c.faqs
        .map(
          (f) =>
            '<div class="accordion"><button class="accordion__btn" type="button">' + f.q + '<span class="accordion__sign">' + svg("plus") + "</span></button><div class=\"accordion__panel\"><div><p>" + f.a + "</p></div></div></div>"
        )
        .join("") +
      "</section>" +
      "</div></div>" +
      '<section class="section bg-alt">' +
      '<div class="container">' +
      sectionHead("Related services", "Explore services that work well alongside this one.") +
      '<div class="related">' + related + "</div>" +
      '<div class="mt-4"><div class="grid grid-3">' +
      [
        { href: "/pages/data-management.html", t: "Data Management Overview", d: "All five management services in one place", icon: "layers" },
        { href: "/pages/data-integration.html", t: "Data Integration Overview", d: "All five integration services in one place", icon: "link" },
        { href: "/pages/services.html", t: "All Services", d: "The complete SHANZOO service catalog", icon: "archive" }
      ]
        .map(
          (x) =>
            '<a class="related-link" href="' + href(root, x.href) + '"><span class="related-link__icon">' + svg(x.icon) + '</span><span class="related-link__text"><strong>' + x.t + "</strong><span>" + x.d + "</span></span></a>"
        )
        .join("") +
      "</div></div>" +
      "</div></section>" +
      '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Want to talk about " + svc.title.toLowerCase() + "?",
        lead: "Tell us about your challenge and we will point you in the right direction — quickly and honestly.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Contact SHANZOO", cls: "btn--primary btn--lg" }]
      }) +
      "</div></section>"
  ];

  return page({
    root,
    title: svc.title + " | Technology Services | SHANZOO",
    desc: metaDesc(c.short + " " + c.benefit + " " + c.help),
    ogType: "article",
    canonicalPath: "services/" + slug + ".html",
    body: body.join("\n") +
      '<script type="application/ld+json">' + JSON.stringify(faqJson) + "</script>"
  });
}

function buildServices() {
  const root = "../";
  const techServices = D.CORE_SERVICES.filter((s) => s.group === "tech");
  const body = [
    pageHero({
      root,
      eyebrow: "All Services",
      title: "Six core services. One accountable partner.",
      lead: "From enterprise data management to AI, cloud, software and managed technology services — find the capability that matches your challenge, and we will help you choose.",
      aside:
        '<a class="btn btn--primary" href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a>',
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "All Services" }
      ]
    }),
    '<section class="section"><div class="container">' +
      sectionHead("Core service areas", "Start with the area that fits your challenge.", true) +
      '<div class="cap-grid">' +
      D.CORE_SERVICES.map((s, i) => capCard(root, s, i)).join("") +
      "</div>" +
      "</div></section>",
    '<section class="section bg-alt"><div class="container">' +
      sectionHead("Data Management", "Organize, protect and maintain the data you already have.", true) +
      '<div class="grid grid-3">' +
      D.NAV.megaManagement.map((m, i) => serviceCard(root, bySlug(m.slug), { delay: i % 3 })).join("") +
      "</div>" +
      '<p class="center mt-4"><a class="btn btn--ghost" href="' + href(root, "/pages/data-management.html") + '">Data Management Overview</a></p>' +
      "</div></section>",
    '<section class="section"><div class="container">' +
      sectionHead("Data Integration", "Connect your systems and keep them in step.", true) +
      '<div class="grid grid-3">' +
      D.NAV.megaIntegration.map((m, i) => serviceCard(root, bySlug(m.slug), { delay: i % 3 })).join("") +
      "</div>" +
      '<p class="center mt-4"><a class="btn btn--ghost" href="' + href(root, "/pages/data-integration.html") + '">Data Integration Overview</a></p>' +
      "</div></section>",
    '<section class="section bg-alt"><div class="container">' +
      sectionHead("Technology Services", "Modernize systems and operations beyond data.", true) +
      '<div class="cap-grid">' +
      techServices.map((s, i) => capCard(root, s, i)).join("") +
      "</div>" +
      "</div></section>",
    '<section class="section"><div class="container split">' +
      "<div>" +
      sectionHead("Not sure where to start?", "Start with a conversation, not a spec.") +
      '<div class="prose"><p>You do not need to understand our service catalog to talk to us. Tell us what is annoying you about your data, systems or operations — duplicate customers, slow reports, tools that do not talk — and we will translate that into a small set of sensible next steps.</p></div>' +
      '<ul class="check-list mt-3">' +
      "<li>" + svg("check") + "A free initial conversation about your goals.</li>" +
      "<li>" + svg("check") + "Honest advice, even when the answer is 'you may not need a project yet.'</li>" +
      "<li>" + svg("check") + "A clear proposal only when you want one.</li>" +
      "</ul>" +
      "</div>" +
      '<div class="split__media"><div class="panel panel--navy"><h3>Start with a 30-minute call</h3>' +
      '<ul class="check-list mt-2">' +
      "<li>" + svg("check") + "We listen to the business problem.</li>" +
      "<li>" + svg("check") + "We sketch possible approaches in plain English.</li>" +
      "<li>" + svg("check") + "You leave with one clear next step.</li>" +
      "</ul>" +
      '<a class="btn btn--light mt-3" href="' + href(root, "/pages/contact.html#consultation") + '">Book a Consultation</a></div></div>' +
      "</div></section>"
  ];
  return page({
    root,
    title: "All Services | Data, AI, Cloud, Software & Managed Services | SHANZOO",
    desc: "Explore the full SHANZOO catalog: data management, data integration, AI development, cloud & virtualization, software & automation and consulting & managed services.",
    canonicalPath: "pages/services.html",
    body: body.join("\n")
  });
}

function serviceLinkByTitle(root, title) {
  const svc = D.SERVICES.find((s) => s.title === title);
  if (!svc) return "";
  return (
    '<a class="related-link" href="' + href(root, "/services/" + svc.slug + ".html") + '">' +
    '<span class="related-link__icon">' + svg(svc.icon) + "</span>" +
    '<span class="related-link__text"><strong>' + svc.title + "</strong><span>" + svc.short + "</span></span></a>"
  );
}

function buildSolutions() {
  const root = "../";
  const solutions = [
    {
      icon: "users",
      t: "One trusted view of your customers",
      d: "You know every customer matters, but the records don't agree.",
      items: ["Master Data Management (MDM)", "Data Quality & Cleansing"]
    },
    {
      icon: "shield",
      t: "Regulated, audit-ready reporting",
      d: "Financial and risk reporting keeps raising difficult data questions.",
      items: ["Data Governance & Metadata Management", "Data Architecture & Modeling"]
    },
    {
      icon: "refresh",
      t: "Faster, reliable reporting",
      d: "Reports take days and nobody trusts the numbers.",
      items: ["Batch Processing (ETL / ELT)", "Data Quality & Cleansing"]
    },
    {
      icon: "radio",
      t: "Real-time operations and alerts",
      d: "Your teams act on yesterday's information when they need it now.",
      items: ["Change Data Capture (CDC)", "Event-Driven Streaming"]
    },
    {
      icon: "link",
      t: "Connected application ecosystem",
      d: "SaaS tools and internal systems keep falling out of sync.",
      items: ["API & Microservices-Based Integration", "Change Data Capture (CDC)"]
    },
    {
      icon: "cloud",
      t: "Fast answers across many systems",
      d: "The answer spans six databases and getting it is a project.",
      items: ["Data Virtualization / Federation", "Data Architecture & Modeling"]
    },
    {
      icon: "lock",
      t: "Protect sensitive business data",
      d: "You are unsure who can see sensitive data or where it flows.",
      items: ["Data Security & Privacy", "Data Governance & Metadata Management"]
    }
  ];
  const solGroups = [
    { label: "Trusted Data", items: [0, 2] },
    { label: "Connected &amp; Real-Time", items: [3, 4, 5] },
    { label: "Governed &amp; Protected", items: [1, 6] }
  ];
  const pad2 = (n) => (n < 10 ? "0" : "") + n;
  const solPanels = solGroups
    .map(
      (g, gi) =>
        '<div class="sol-panel' + (gi === 0 ? " is-active" : "") + '" id="sol-panel-' + gi +
        '" role="tabpanel" aria-labelledby="sol-tab-' + gi + '" tabindex="0">' +
        g.items
          .map((idx) => {
            const s = solutions[idx];
            return (
              '<article class="sol-item">' +
              '<div class="sol-item__head">' +
              '<span class="sol-item__num">' + pad2(idx + 1) + "</span>" +
              '<span class="sol-item__icon" aria-hidden="true">' + svg(s.icon) + "</span>" +
              '<div class="sol-item__heading"><h3>' + s.t + "</h3><p>" + s.d + "</p></div>" +
              "</div>" +
              '<div class="sol-item__services">' +
              s.items.map((title) => serviceLinkByTitle(root, title)).join("") +
              "</div>" +
              "</article>"
            );
          })
          .join("") +
        "</div>"
    )
    .join("");
  const solTabs = solGroups
    .map(
      (g, gi) =>
        '<button type="button" class="tabs__btn sol-tab' + (gi === 0 ? " is-active" : "") +
        '" id="sol-tab-' + gi + '" role="tab" aria-selected="' + (gi === 0 ? "true" : "false") +
        '" aria-controls="sol-panel-' + gi + '" tabindex="' + (gi === 0 ? "0" : "-1") + '">' +
        '<span class="sol-tab__num">0' + (gi + 1) + "</span>" +
        '<span class="sol-tab__label">' + g.label + "</span>" +
        '<span class="sol-tab__meta">' + g.items.length + " goals</span>" +
        "</button>"
    )
    .join("");
  const body = [
    pageHero({
      root,
      eyebrow: "Solutions",
      title: "A goal in mind? There is a data path to it.",
      lead: "Browse common business outcomes and see which SHANZOO services typically combine to deliver them. Each is just a starting point — we tailor the actual plan to your situation.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Solutions" }
      ]
    }),
    '<section class="section sol-section"><div class="container">' +
      sectionHead("Solutions by goal", "Pick the outcome you care about most.", "Grouped by the kind of outcome you are after — choose a category, then open any service to see how it works.", true) +
      '<div class="sol-explorer reveal" data-tabs>' +
      '<div class="sol-tabs" role="tablist" aria-label="Solution categories">' + solTabs + "</div>" +
      '<div class="sol-panels">' + solPanels + "</div>" +
      "</div>" +
      "</div></section>",
    '<section class="section bg-alt"><div class="container split">' +
      "<div>" +
      sectionHead("Not finding your situation?", "Start with a conversation instead.") +
      '<div class="prose"><p>The combinations above are starting points, not recipes. Your situation will differ — that is normal. Tell us the outcome you want and we will suggest a realistic path.</p></div>' +
      '<a class="btn btn--primary mt-3" href="' + href(root, "/pages/contact.html#consultation") + '">Discuss Your Goal</a>' +
      "</div>" +
      '<div class="split__media"><div class="panel panel--navy"><h3>How solutions turn into projects</h3>' +
      '<ul class="check-list mt-3">' +
      "<li>" + svg("check") + "We confirm the business outcome you want.</li>" +
      "<li>" + svg("check") + "We review your current data and systems.</li>" +
      "<li>" + svg("check") + "We propose a scoped, phased plan.</li>" +
      "<li>" + svg("check") + "You approve, we build, your team takes over.</li>" +
      "</ul></div></div>" +
      "</div></section>"
  ];
  return page({
    root,
    title: "Solutions | Common Data Use Cases | SHANZOO",
    desc: "Common business goals — customer 360, reliable reporting, real-time operations, secure data — mapped to the SHANZOO services that deliver them.",
    canonicalPath: "pages/solutions.html",
    body: body.join("\n")
  });
}

function buildIndustries() {
  const root = "../";
  const inds = [
    { icon: "credit", t: "Financial Services", d: "Regulated reporting, client information and risk data have to be accurate and clearly controlled." },
    { icon: "activity", t: "Healthcare", d: "Patient and operational data must be protected, interoperable and reliably shared between systems." },
    { icon: "shop", t: "Retail & E-commerce", d: "Customers expect consistent products, prices and orders across every channel your business runs." },
    { icon: "factory", t: "Manufacturing", d: "Production, supply and quality data needs to connect so planning and operations can trust it." },
    { icon: "truck", t: "Logistics", d: "Shipments and assets generate a constant stream of events that operations act on in real time." },
    { icon: "briefcase", t: "Professional Services", d: "Client records, time, billing and knowledge stay accurate and accessible across the firm." }
  ];
  const body = [
    pageHero({
      root,
      eyebrow: "Industries",
      title: "Reliable data helps every sector run better.",
      lead: "Data management and integration are cross-industry. Below are illustrative examples of how we help organizations in different sectors — not claims of specific current clients.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Industries" }
      ]
    }),
    '<section class="section"><div class="container">' +
      sectionHead("Where SHANZOO services add value", "Sectors and the data tasks they commonly face.", true) +
      '<div class="grid grid-3">' +
      inds
        .map(
          (ind) =>
            '<div class="industry-card"><div class="industry-card__icon">' + svg(ind.icon) + '</div><h3>' + ind.t + '</h3><p>' + ind.d + '</p><ul>' +
            [
              "Accurate client and master records",
              "Reliable management reporting",
              "Secure handling of sensitive data"
            ]
              .map((li) => "<li>" + svg("arrow") + li + "</li>")
              .join("") +
            "</ul></div>"
        )
        .join("") +
      "</div></div></section>",
    '<section class="section bg-alt"><div class="container split">' +
      "<div>" +
      sectionHead("Your industry is not on the list?", "The patterns still apply.") +
      '<div class="prose"><p>The tools are the same everywhere: <strong>master data, governance, quality, security, architecture, batch, CDC, APIs, streaming and virtualization</strong>. The list above is illustrative — if your sector is not shown, the conversation starts the same way.</p></div>' +
      "</div>" +
      '<div class="split__media"><div class="panel panel--green"><h4>Start with your problem, not your industry</h4>' +
      "<p class='mt-1'>Tell us what is hard about your data right now, and we will suggest realistic first steps.</p>" +
      '<a class="btn btn--navy mt-3" href="' + href(root, "/pages/contact.html") + '">Describe Your Challenge</a></div></div>' +
      "</div></section>"
  ];
  return page({
    root,
    title: "Industries | Data Use Cases | SHANZOO",
    desc: "Illustrative examples of how SHANZOO data management and integration services support financial services, healthcare, retail, manufacturing, logistics and more.",
    canonicalPath: "pages/industries.html",
    body: body.join("\n")
  });
}

function buildWhy() {
  const root = "../";
  const wins = [
    { icon: "message", t: "Clear Communication", d: "We explain technical work in plain English — business people understand the plan, and technical people understand the detail." },
    { icon: "target", t: "Business-Focused Solutions", d: "Every recommendation ties back to an outcome you can measure: faster reports, fewer duplicates, confident decisions." },
    { icon: "settings", t: "Practical Technical Expertise", d: "We have done the engineering work and know what works in the real world — not just in slide decks." },
    { icon: "trend", t: "Scalable Approaches", d: "Solutions are sized for where you are today, with a clear path for where you are going tomorrow." },
    { icon: "lock", t: "Attention to Data Security", d: "Security and privacy are design requirements from day one, not afterthoughts added at the end." }
  ];
  /* Editorial bento: one featured card + four supporting cards, each on a
     slightly different surface so the section reads with hierarchy instead of
     five identical white rectangles. */
  const winVariants = ["feature", "blue", "white", "soft", "mint"];
  const winLabels = ["Clarity", "Outcomes", "Engineering", "Growth", "Security"];
  const winCards = wins
    .map(
      (w, i) =>
        '<article class="why-card why-card--' + winVariants[i] + ' reveal" data-delay="' + i + '">' +
        '<span class="why-card__meta"><span class="why-card__num">0' + (i + 1) + "</span>" + winLabels[i] + "</span>" +
        '<span class="why-card__icon" aria-hidden="true">' + svg(w.icon) + "</span>" +
        "<h3>" + w.t + "</h3>" +
        "<p>" + w.d + "</p>" +
        "</article>"
    )
    .join("");
  const body = [
    pageHero({
      root,
      eyebrow: "Why SHANZOO",
      title: "A consultancy built on plain sense.",
      lead: "Anyone can promise a data transformation. We prefer to build trust the old-fashioned way — with clear communication, honest scope and work that holds up.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Why SHANZOO" }
      ]
    }),
    '<section class="section why-section"><div class="container">' +
      sectionHead("The qualities we back with our work", "Five reasons teams choose to work with us.", "Plain-language commitments that shape every engagement — from the first conversation to steady-state support.", true) +
      '<div class="why-bento">' + winCards + "</div>" +
      "</div></section>",
    '<section class="section bg-alt"><div class="container split">' +
      '<div class="split__media"><div class="panel panel--navy"><h3>How honesty shows up</h3>' +
      '<ul class="check-list mt-3">' +
      "<li>" + svg("check") + "We tell you when a solution is overkill.</li>" +
      "<li>" + svg("check") + "We separate estimates from certainties.</li>" +
      "<li>" + svg("check") + "We keep dependencies and risks visible.</li>" +
      "<li>" + svg("check") + "We document so your team can own it.</li>" +
      "</ul></div></div>" +
      "<div>" +
      sectionHead("What you can expect", "A working partner, not a black box.") +
      '<div class="prose"><p>From the first conversation we aim to be useful — even before you sign anything. We listen, ask good questions, and propose practical next steps you can evaluate on merit.</p>' +
      "<p>During delivery, you always know where the work stands. After launch, we help your team take over with confidence and stay available as needs evolve.</p></div>" +
      '<a class="btn btn--primary mt-3" href="' + href(root, "/pages/our-approach.html") + '">See How We Work</a>' +
      "</div></div></section>",
    '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Prefer honesty over hype?",
        lead: "That is exactly how we work. Start a conversation and judge for yourself.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Talk to Our Team", cls: "btn--primary btn--lg" }, { href: "/pages/about.html", label: "About SHANZOO", cls: "btn--outline-light btn--lg" }]
      }) +
      "</div></section>"
  ];
  return page({
    root,
    title: "Why Choose SHANZOO | Clear, Business-Focused Data Consulting",
    desc: "Why teams choose SHANZOO: clear communication, business-focused solutions, practical expertise, scalable approaches and a strong attention to data security.",
    canonicalPath: "pages/why-shanzoo.html",
    body: body.join("\n")
  });
}

function buildApproach() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "Our Approach",
      title: "A working method, not a magic formula.",
      lead: "We follow a simple, transparent process that keeps you informed and in control — from first conversation to steady-state improvement.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Our Approach" }
      ]
    }),
    '<section class="section"><div class="container">' +
      sectionHead("The four phases", "How an engagement typically unfolds.", true) +
      '<div class="steps">' +
      '<div class="step reveal"><span class="step__num">1</span><h3>Understand Your Needs</h3><p>We listen to the business outcome you want and the problems standing in the way. This phase shapes everything that follows.</p></div>' +
      '<div class="step reveal" data-delay="1"><span class="step__num">2</span><h3>Review Your Data &amp; Systems</h3><p>We map your current data landscape — sources, flows, quality issues and dependencies — with facts, not assumptions.</p></div>' +
      '<div class="step reveal" data-delay="2"><span class="step__num">3</span><h3>Design the Right Solution</h3><p>You receive a clear design with priorities, effort and technology choices, explained in plain English.</p></div>' +
      '<div class="step reveal" data-delay="3"><span class="step__num">4</span><h3>Implement &amp; Improve</h3><p>We build with your team, test carefully, launch cleanly, and keep improving based on how it behaves in real use.</p></div>' +
      "</div></div></section>",
    '<section class="section bg-alt"><div class="container split">' +
      "<div>" +
      sectionHead("What you can expect at each phase", "No surprises, ever.") +
      '<div class="timeline">' +
      '<div class="timeline__item is-active"><div class="timeline__dot">' + svg("message") + "</div><h3>Discovery</h3><p>A focused conversation: goals, current state, and an honest read on what is realistic.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("scan") + "</div><h3>Assessment</h3><p>A structured review of your data and systems, delivered as a readable, decision-focused report.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("compass") + "</div><h3>Design</h3><p>Solution architecture and a prioritized roadmap, validated with you before any building starts.</p></div>" +
      '<div class="timeline__item"><div class="timeline__dot">' + svg("settings") + "</div><h3>Build &amp; Support</h3><p>Incremental delivery, testing and monitoring — followed by knowledge transfer to your team.</p></div>" +
      "</div>" +
      "</div>" +
      '<div class="split__media"><div class="panel panel--green"><h4>Working principles</h4>' +
      '<ul class="check-list mt-2">' +
      "<li>" + svg("check") + "Deliver in small, reviewable stages.</li>" +
      "<li>" + svg("check") + "Document as we go — no knowledge hoarded in heads.</li>" +
      "<li>" + svg("check") + "Use technology you can actually maintain.</li>" +
      "<li>" + svg("check") + "Keep security and quality baked in, not bolted on.</li>" +
      "</ul></div>" +
      '<div class="panel mt-2"><h4>Location &amp; logistics</h4><p class="mt-1" style="color:var(--muted)">SHANZOO is based in Toronto, Ontario. We deliver remotely across Canada and internationally, with on-site sessions in the Toronto area when useful.</p></div></div>' +
      "</div></section>",
    '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Curious how this would apply to your data?",
        lead: "The first step costs nothing but 30 minutes. Let's talk.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Book a Conversation", cls: "btn--primary btn--lg" }]
      }) +
      "</div></section>"
  ];
  return page({
    root,
    title: "Our Approach | How SHANZOO Works | Data Consulting Process",
    desc: "SHANZOO's transparent four-phase approach: understand your needs, review your data and systems, design the right solution, implement and improve.",
    canonicalPath: "pages/our-approach.html",
    body: body.join("\n")
  });
}

function buildInsights() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "Insights",
      title: "Data concepts, explained by humans.",
      lead: "Short, jargon-free articles that help your team understand the fundamentals of data management and integration.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Insights" }
      ]
    }),
    '<section class="section"><div class="container">' +
      sectionHead("Latest articles", "Practical knowledge in plain English.", "Short, jargon-free reads on the data concepts that come up most in client conversations.", true) +
      '<div class="insights-layout">' +
      insightCard(root, insights[0], 0, true) +
      '<div class="insights-support">' +
      insights.slice(1).map((p, i) => insightCard(root, p, i % 3)).join("") +
      "</div>" +
      "</div></div></section>",
    '<section class="section bg-alt"><div class="container split">' +
      "<div>" +
      sectionHead("Suggest a topic", "What would help your team?") +
      '<div class="prose"><p>We write about the data questions that come up most in client conversations. If there is a concept you keep having to explain to stakeholders, tell us — useful articles may already exist on the underlying topic.</p></div>' +
      "</div>" +
      '<div class="split__media"><div class="panel panel--navy"><h3>Talk to a data person</h3>' +
      '<p class="mt-1" style="color:#b7cbdd">Ask us anything about your data — no pitch required. We will answer honestly and point you to the right resource.</p>' +
      '<a class="btn btn--light mt-3" href="' + href(root, "/pages/contact.html") + '">Ask a Question</a></div></div>' +
      "</div></section>"
  ];
  return page({
    root,
    title: "Insights | Data Articles in Plain English | SHANZOO",
    desc: "Read SHANZOO's educational articles on master data management, ETL vs ELT, data quality and real-time data integration — written for nontechnical readers.",
    canonicalPath: "pages/insights.html",
    body: body.join("\n")
  });
}

const ARTICLE_CONTENT = {
  "what-is-master-data-management": {
    title: "What Is Master Data Management?",
    read: "5 min",
    heading: "The quiet fix behind dependable business data.",
    intro: "Your company probably has the same customer in five places — spelled five different ways. Master data management (MDM) is the discipline that brings order to information like this, and it is easier to understand than the acronym suggests.",
    sections: [
      ["What is master data?", "Master data is the core information your business depends on to operate: customers, suppliers, products, employees and locations. Unlike transaction records (an invoice, a shipment), master data changes slowly but is referenced by almost everything else. When a customer's master record is wrong, every invoice, order and report that uses it inherits that error."],
      ["The golden record", "The goal of MDM is a 'golden record' — one best version of each entity assembled from all the partial versions scattered across your systems. With matching logic, duplicates are detected and merged, conflicts are resolved by agreed rules, and one trustworthy record is published back to the systems that need it."],
      ["Why companies struggle", "Master data becomes messy for predictable reasons: different systems hold different fields, teams enter data without common standards, acquisitions add new systems, and no single owner guards the definitions. The result is duplicated mailings, misquoted prices and dashboard numbers that never quite agree."],
      ["An MDM program in plain steps", "A practical MDM effort usually looks like this: (1) inventory where master data lives, (2) choose a starting entity — often customers — (3) agree on definitions and rules, (4) build matching and merge logic, (5) assign stewardship so humans resolve the edge cases, and (6) monitor quality over time. It does not need to start with expensive software; process and ownership often deliver the first wins."],
      ["How SHANZOO helps", "We help you scope an MDM program that fits your size, starting with the entity that causes the most pain. We handle the assessment, design the golden-record rules, and help you stand up stewardship — then hand it over with documentation your team can maintain."]
    ]
  },
  "etl-vs-elt-whats-the-difference": {
    title: "ETL vs. ELT: What's the Difference?",
    read: "4 min",
    heading: "Two letters apart, but they change how your data pipeline runs.",
    intro: "ETL and ELT are the two main ways to move data from one system to another. The difference is small on paper and significant in practice: WHEN the data gets transformed.",
    sections: [
      ["The three letters explained", "E, T and L stand for Extract, Transform and Load — and the middle letter is the whole debate. In ETL, data is Extracted, Transformed (cleaned and reshaped), then Loaded. In ELT, data is Extracted and Loaded first, and Transformation happens later inside the target system."],
      ["ETL — transform before you load", "ETL processes data in a separate engine before it reaches the target. It suits traditional databases and cases where the target is not powerful enough to transform at scale, or where you need strict quality checks before anything arrives."],
      ["ELT — load first, transform later", "ELT loads raw data into a modern cloud warehouse or lake, then transforms it with the target's own computing power. It is faster to move, keeps the raw source data available, and lets analysts re-shape it as new questions arise."],
      ["Which should you choose?", "There is no universal winner. Choose ETL when transformation quality must be guaranteed before loading and when the target is a conventional database. Choose ELT when you use a scalable warehouse or lake, when source volumes are large, and when you want the flexibility to define new transformations without re-loading."],
      ["How SHANZOO helps", "We review your sources, targets and reporting needs, then design pipelines that use the right pattern per workload — often a sensible mix. We build with scheduling, monitoring and documentation so the pipeline keeps running after we leave."]
    ]
  },
  "why-data-quality-matters": {
    title: "Why Data Quality Matters",
    read: "4 min",
    heading: "Bad data is not an IT problem — it is a business problem.",
    intro: "Every decision your business makes runs on data: forecasts, inventory, pricing, hiring. When that data is quietly wrong, problems surface as lost revenue and frustrated customers — never as 'a data-quality incident.'",
    sections: [
      ["What is data quality?", "Data quality is how well your data serves its purpose. It is commonly described with six dimensions: accuracy (is it correct?), completeness (is anything missing?), consistency (does it agree across systems?), uniqueness (any duplicates?), timeliness (is it current?) and validity (does it obey the rules?)."],
      ["The cost of bad data", "Bad data shows up in uninviting ways: duplicate mailings and wasted ad spend; quotes built on stale prices; inventory that does not match reality; and leadership teams arguing over which dashboard is right. Fixing the underlying data is usually far cheaper than living with the consequences."],
      ["Dimensions of quality in practice", "Improvement starts with profiling — measuring how bad things actually are against those six dimensions. Then you fix the specific problems found, standardize how data enters systems, and add monitoring so quality does not quietly decay again."],
      ["Getting started", "Begin with the datasets your biggest decisions depend on, not all your data at once. Measure today's state, fix the worst offenders, and assign an owner for each key dataset. A small, sustained program beats a large one-off cleanup every time."],
      ["How SHANZOO helps", "We run a data-quality health check, show you the exact issues and their business impact, then help you fix root causes and set up the monitoring and ownership that keep quality high."]
    ]
  },
  "understanding-real-time-data-integration": {
    title: "Understanding Real-Time Data Integration",
    read: "5 min",
    heading: "When 'by tomorrow morning' is too late.",
    intro: "For decades, business reporting ran on nightly batches — data moved overnight and teams saw yesterday's world. Today many decisions benefit from fresher information. Here is how real-time integration works and when it is actually worth it.",
    sections: [
      ["Why real time matters", "For a manufacturer, a dashboard that reflects inventory ten minutes ago beats one from last night. For a logistics firm, shipment events feed customer updates automatically. The value of real-time data grows the closer the decision sits to the event."],
      ["Batch vs. real-time movement", "Batch moves data in scheduled chunks and is perfectly fine for many needs — simple, cheap and reliable. Real-time integration moves changes as they happen using two main techniques: Change Data Capture (CDC), which watches database logs, and event streaming, which carries messages through platforms like Apache Kafka."],
      ["How real-time integration works", "CDC reads the database's transaction log and publishes changes as events; streaming platforms store and deliver those events to subscribers such as analytics tools, caches or other systems. Consumers can replay the event history if they fall behind, which makes this approach far more reliable than point-to-point scripts."],
      ["Where to start", "Start honest: which decisions genuinely improve with fresher data? Start with one high-value feed — say, orders feeding a live dashboard — prove the pattern, then expand. Real time is an option, not a mandate."],
      ["How SHANZOO helps", "We help you decide where real-time integration pays off, then design and build the CDC or streaming pipeline with proper ordering, monitoring and failover — connected cleanly to your existing batch architecture."]
    ]
  }
};

function buildInsightArticle(slug) {
  const root = "../../";
  const post = insights.find((p) => p.slug === slug);
  const content = ARTICLE_CONTENT[slug];
  const body = [
    '<section class="page-hero"><div class="container page-hero__inner">' +
      "<div>" +
      '<p class="eyebrow eyebrow--light">Insight · ' + post.cat + "</p>" +
      "<h1>" + content.title + "</h1>" +
      "<p>" + content.heading + "</p>" +
      '<div class="article__meta mt-3">' +
      '<span class="badge badge--light">' + svg("clock") + " " + content.read + " read</span>" +
      '<span class="badge badge--light">' + svg("file") + " Educational</span>" +
      "</div>" +
      '<div class="mt-3">' +
      crumbs({ root }, [
        { href: "/index.html", label: "Home" },
        { href: "/pages/insights.html", label: "Insights" },
        { label: post.title }
      ]) +
      "</div>" +
      "</div>" +
      '<div class="page-hero__aside"><div class="service-hero__visual">' +
      D[post.icon === "database" ? "svgNetwork" : post.icon === "refresh" ? "svgPipeline" : post.icon === "circle" ? "svgLayers" : "svgStream"]() +
      "</div></div>" +
      "</div></section>",
    '<article class="article section">' +
      '<div class="article__head"><p class="lead">' + content.intro + "</p></div>" +
      '<div class="toc"><h2>In this article</h2><ol>' +
      content.sections.map((s, i) => "<li><a href=\"#sec-" + i + '">' + s[0] + "</a></li>").join("") +
      "</ol></div>" +
      content.sections
        .map(
          (s, i) =>
            '<section id="sec-' + i + '" style="scroll-margin-top:110px"><h2>' + s[0] + "</h2><div class=\"prose\"><p>" + s[1] + "</p></div></section>"
        )
        .join("") +
      "</article>",
    '<section class="section bg-alt"><div class="container">' +
      sectionHead("Keep exploring", "More insights in plain English.") +
      '<div class="grid grid-3">' +
      insights.filter((p) => p.slug !== slug).slice(0, 3).map((p, i) => insightCard(root, p, i % 3)).join("") +
      "</div></div></section>",
    '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Have a question this article didn't answer?",
        lead: "Ask us directly. We reply to real questions with real answers.",
        actions: [{ href: "/pages/contact.html", label: "Ask SHANZOO", cls: "btn--primary btn--lg" }]
      }) +
      "</div></section>"
  ];
  return page({
    root,
    title: post.title + " | SHANZOO Insights",
    desc: metaDesc(content.title + ". " + content.intro),
    ogType: "article",
    canonicalPath: "pages/insights/" + slug + ".html",
    body: body.join("\n")
  });
}

function buildContact() {
  const root = "../";
  const services = D.SERVICES.map((s) => s.title).sort();
  const serviceOptions =
    '<option value="">-- Select a service --</option>' +
    '<option>Not sure yet — I need advice</option>' +
    "<optgroup label=\"Data Management\">" +
    D.NAV.megaManagement.map((m) => "<option>" + m.title + "</option>").join("") +
    "</optgroup>" +
    "<optgroup label=\"Data Integration\">" +
    D.NAV.megaIntegration.map((m) => "<option>" + m.title + "</option>").join("") +
    "</optgroup>" +
    "<optgroup label=\"Technology Services\">" +
    D.NAV.megaTechnology.map((m) => "<option>" + m.title + "</option>").join("") +
    "</optgroup>" +
    '<option>Consultation / Other</option>';

  const body = [
    pageHero({
      root,
      eyebrow: "Contact Us",
      title: "Let's talk about your data.",
      lead: "Questions, ideas or a problem you cannot quite name — we are happy to listen and point you in the right direction.",
      aside:
        '<div class="cta-mini">' + svg("clock") + "<span><strong>Response time</strong><br>We usually reply within one business day</span></div>"
      ,
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Contact Us" }
      ]
    }),
    '<section class="section"><div class="container contact-grid">' +
      '<div>' +
      '<div class="contact-card">' +
      "<h2 class='mb-2'>Contact information</h2>" +
      '<div class="contact-info-item"><div class="contact-info-item__icon">' + svg("pin") + '</div><div><h3>Head office</h3><p>' + SITE.address + "</p></div></div>" +
      '<div class="contact-info-item"><div class="contact-info-item__icon">' + svg("phone") + '</div><div><h3>Phone</h3><p><a href="tel:' + SITE.phoneHref + '">' + SITE.phone + "</a></p></div></div>" +
      '<div class="contact-info-item"><div class="contact-info-item__icon">' + svg("mail") + '</div><div><h3>Email</h3><p><a href="mailto:' + SITE.email + '">' + SITE.email + "</a></p></div></div>" +
      '<div class="contact-info-item"><div class="contact-info-item__icon">' + svg("clock") + '</div><div><h3>Business hours</h3><p>Monday to Friday, 9:00–17:00 ET</p></div></div>' +
      "</div>" +
      '<div class="map-embed mt-3">' +
      svg("pin") +
      "<p><strong>8 Marowyne Dr, Toronto, Ontario, Canada</strong><br>A map embed can be added here when the production site is deployed.</p>" +
      "</div>" +
      "</div>" +
      '<div id="consultation" class="contact-card">' +
      '<h2 class="mb-1">Request a consultation</h2>' +
      '<p class="muted mt-1 mb-3" style="color:var(--muted)">Tell us a little about yourself and what you are working on. Fields marked <span class="req">*</span> are required.</p>' +
      '<div class="auth-required is-hidden" data-auth-required>' +
      '<div class="auth-required__icon" aria-hidden="true">' + svg("lock") + "</div>" +
      '<h3 class="auth-required__title">Sign in to send your request</h3>' +
      '<p class="auth-required__text">For your security, please sign in or create an account to send us a message. It only takes a moment.</p>' +
      '<div class="auth-required__actions">' +
      '<a class="btn btn--primary" data-gate-auth href="' + href(root, "/pages/login.html") + '">Sign In</a>' +
      '<a class="btn btn--ghost" data-gate-auth href="' + href(root, "/pages/signup.html") + '">Create Account</a>' +
      "</div>" +
      "</div>" +
      '<form class="form" data-validate data-requires-auth data-endpoint="/api/contact" novalidate>' +
      '<div class="form-row-2"><div class="field"><label for="name">Full Name <span class="req" aria-hidden="true">*</span></label><input class="input" id="name" name="name" type="text" required autocomplete="name" maxlength="120" placeholder="Jane Smith"><small class="field__error" role="alert"></small></div>' +
      '<div class="field"><label for="business-email">Business Email <span class="req" aria-hidden="true">*</span></label><input class="input" id="business-email" name="email" type="email" required autocomplete="email" maxlength="120" placeholder="jane@company.com"><small class="field__error" role="alert"></small></div></div>' +
      '<div class="form-row-2"><div class="field"><label for="phone">Phone Number</label><input class="input" id="phone" name="phone" type="tel" autocomplete="tel" maxlength="24" placeholder="+1 647 555 0100"><small class="field__error" role="alert"></small></div>' +
      '<div class="field"><label for="company">Company Name</label><input class="input" id="company" name="company" type="text" autocomplete="organization" maxlength="120" placeholder="Acme Inc."><small class="field__error" role="alert"></small></div></div>' +
      '<div class="field"><label for="service">Service You Are Interested In</label><select class="select" id="service" name="service">' + serviceOptions + "</select><small class=\"field__error\" role=\"alert\"></small></div>" +
      '<div class="field"><label for="message">Message <span class="req" aria-hidden="true">*</span></label><textarea class="textarea" id="message" name="message" required maxlength="1500" data-charcount="msg-count" placeholder="Briefly describe what you are trying to achieve or the problem you are facing."></textarea><small class="field__hint">You have <span id="msg-count">0 / 1500</span> characters.</small><small class="field__error" role="alert"></small></div>' +
      '<div class="field"><label class="checkbox"><input type="checkbox" name="consent" required><span>I agree to be contacted by SHANZOO about my enquiry. See our <a class="inline-link" href="' + href(root, "/pages/privacy.html") + '">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span></label>' +
      '<small class="field__error" role="alert"></small></div>' +
      '<div class="form-note form-note--info" data-dynamic role="note">' +
      svg("info") +
      "<span>We usually reply within one business day. Your details are only used to respond to your enquiry — see our <a class=\"inline-link\" href=\"" + href(root, "/pages/privacy.html") + "\">Privacy Policy</a>.</span>" +
      "</div>" +
      '<button class="btn btn--primary btn--lg" type="submit" data-auth-submit>' + svg("send") + " Send Message</button>" +
      "</form>" +
      "</div>" +
      "</div></section>"
  ];
  return page({
    root,
    title: "Contact SHANZOO | Request a Consultation | Toronto",
    desc: "Contact SHANZOO in Toronto for data management and integration help. Call +1 647-546-9772 or email info@shanzoo.com.",
    canonicalPath: "pages/contact.html",
    body: body.join("\n")
  });
}

function buildLogin() {
  const root = "../";
  const body = [
    '<section class="auth section" style="padding-block:0">' +
      '<div class="auth__aside">' +
      "<h2>Welcome back.</h2>" +
      "<p>Sign in to access your SHANZOO workspace, project updates and downloads.</p>" +
      '<ul>' +
      "<li>" + svg("check") + "Track your consultations and projects in one place.</li>" +
      "<li>" + svg("check") + "Access approved documents and deliverables.</li>" +
      "<li>" + svg("check") + "Manage your account and notification preferences.</li>" +
      "</ul>" +
      '<div class="cta-mini mt-4">' + svg("headset") + "<span>Need help? <a href=\"" + href(root, "/pages/contact.html") + "\" style=\"color:#fff;text-decoration:underline\">Contact our team</a></span></div>" +
      "</div>" +
      '<div class="auth__main"><div class="auth__card">' +
      "<h1>Sign in to SHANZOO</h1>" +
      '<p class="muted">Enter your email and password. We will email you a 6-digit code to finish signing in.</p>' +
      '<form class="form mt-4" data-validate data-own="auth" data-auth="login" data-endpoint="/api/auth/login" novalidate>' +
      '<div class="field"><label for="login-email">Email <span class="req" aria-hidden="true">*</span></label><input class="input" id="login-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com"><small class="field__error" role="alert"></small></div>' +
      '<div class="field"><label for="login-password">Password <span class="req" aria-hidden="true">*</span></label><div class="password-wrap"><input class="input" id="login-password" name="password" type="password" required autocomplete="current-password" minlength="8" placeholder="Your password">' +
      '<button class="password-toggle" type="button" aria-label="Show password">' + svg("eye", "pw-icon-show") + svg("eyeoff", "pw-icon-hide") + "</button></div><small class=\"field__error\" role=\"alert\"></small></div>" +
      '<div class="form-row-2" style="align-items:center"><label class="checkbox"><input type="checkbox" name="remember" checked>Remember me on this device</label><button type="button" class="linklike" data-auth-forgot>Forgot password?</button></div>' +
      '<button class="btn btn--primary btn--lg btn--block" type="submit">' + svg("key") + " Sign In</button>" +
      "</form>" +
      '<p class="auth__foot">New to SHANZOO? <a class="inline-link" href="' + href(root, "/pages/signup.html") + '">Create an account</a></p>' +
      "</div></div>" +
      "</section>"
  ];
  return page({
    root,
    title: "Sign In | SHANZOO Client Portal",
    desc: "Sign in to the SHANZOO client portal. Account features are being connected in a later phase.",
    canonicalPath: "pages/login.html",
    body: body.join("\n")
  });
}

function buildSignup() {
  const root = "../";
  const body = [
    '<section class="auth section" style="padding-block:0">' +
      '<div class="auth__aside">' +
      "<h2>Create your account.</h2>" +
      "<p>Join the SHANZOO client workspace to track consultations and project progress.</p>" +
      '<ul>' +
      "<li>" + svg("check") + "One account for all your SHANZOO work.</li>" +
      "<li>" + svg("check") + "Two-step email verification keeps your account secure.</li>" +
      "<li>" + svg("check") + "Your data is never shared — see our Privacy Policy.</li>" +
      "</ul>" +
      '<div class="cta-mini mt-4">' + svg("message") + "<span>Prefer talking? <a href=\"" + href(root, "/pages/contact.html") + "\" style=\"color:#fff;text-decoration:underline\">Contact us instead</a></span></div>" +
      "</div>" +
      '<div class="auth__main"><div class="auth__card">' +
      "<h1>Create your account</h1>" +
      '<p class="muted">Enter your details below. We will email you a 6-digit code to verify your address.</p>' +
      '<form class="form mt-4" data-validate data-own="auth" data-auth="signup" data-endpoint="/api/auth/signup" novalidate>' +
      '<div class="field"><label for="signup-name">Full Name <span class="req" aria-hidden="true">*</span></label><input class="input" id="signup-name" name="name" type="text" required autocomplete="name" maxlength="120" placeholder="Jane Smith"><small class="field__error" role="alert"></small></div>' +
      '<div class="field"><label for="signup-email">Business Email <span class="req" aria-hidden="true">*</span></label><input class="input" id="signup-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com"><small class="field__error" role="alert"></small></div>' +
      '<div class="form-row-2">' +
      '<div class="field"><label for="signup-password">Password <span class="req" aria-hidden="true">*</span></label><div class="password-wrap"><input class="input" id="signup-password" name="password" type="password" required autocomplete="new-password" minlength="8" data-min="8">' +
      '<button class="password-toggle" type="button" aria-label="Show password">' + svg("eye", "pw-icon-show") + svg("eyeoff", "pw-icon-hide") + "</button></div>" +
      '<div class="password-meter" data-password-meter><div class="password-meter__bars"><span></span><span></span><span></span></div><p class="password-meter__label">Your password needs at least 8 characters.</p></div>' +
      '<small class="field__error" role="alert"></small></div>' +
      '<div class="field"><label for="signup-confirm">Confirm Password <span class="req" aria-hidden="true">*</span></label><div class="password-wrap"><input class="input" id="signup-confirm" name="confirm" type="password" required autocomplete="new-password" data-match data-match-for="signup-password">' +
      '<button class="password-toggle" type="button" aria-label="Show password">' + svg("eye", "pw-icon-show") + svg("eyeoff", "pw-icon-hide") + "</button></div><small class=\"field__error\" role=\"alert\"></small></div>" +
      "</div>" +
      '<label class="checkbox"><input type="checkbox" name="terms" required><span>I agree to the <a class="inline-link" href="' + href(root, "/pages/terms.html") + '">Terms of Use</a> and <a class="inline-link" href="' + href(root, "/pages/privacy.html") + '">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span></label>' +
      '<button class="btn btn--primary btn--lg btn--block" type="submit">' + svg("key") + " Create Account</button>" +
      "</form>" +
      '<p class="auth__foot">Already have an account? <a class="inline-link" href="' + href(root, "/pages/login.html") + '">Sign in</a></p>' +
      "</div></div>" +
      "</section>"
  ];
  return page({
    root,
    title: "Create an Account | SHANZOO Client Portal",
    desc: "Create a SHANZOO client account. Registration will be connected to the authentication backend in a later phase.",
    canonicalPath: "pages/signup.html",
    body: body.join("\n")
  });
}

function buildPrivacy() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "Legal",
      title: "Privacy Policy",
      lead: "This draft outline is placeholder text for review and does not constitute legal advice. Confirm final wording with a qualified professional before publishing.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Privacy Policy" }
      ]
    }),
    '<article class="article section">' +
      '<div class="notice">This is a <strong>draft placeholder provided for review</strong>. It describes the sections a typical policy includes, but has not been reviewed by counsel. Replace with approved legal content before going live.</div>' +
      '<div class="prose mt-4">' +
      "<h2>1. Who we are</h2><p>SHANZOO (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a data management and integration consultancy based in Toronto, Ontario, Canada. We are reachable at " + SITE.email + " and " + SITE.phone + ".</p>" +
      "<h2>2. Information we collect</h2><p>We collect the information you provide when you contact us — such as your name, email address, phone number and company — as well as technical information such as how you use this website.</p>" +
      "<h2>3. How we use information</h2><p>We use the information to respond to enquiries, provide our services, improve our website and meet legal obligations. We do not sell personal information.</p>" +
      "<h2>4. Sharing and disclosure</h2><p>We do not share personal information except with service providers who help us operate, where required by law, or with your consent.</p>" +
      "<h2>5. Data retention</h2><p>We retain personal information only as long as necessary for the purposes described in this policy, or as required by law.</p>" +
      "<h2>6. Your rights</h2><p>Depending on your location, you may have rights to access, correct, delete or restrict your personal information. Contact us to exercise these rights.</p>" +
      "<h2>7. Security</h2><p>We apply reasonable technical and organizational measures to protect personal information, but no method of transmission or storage is completely secure.</p>" +
      "<h2>8. Cookies</h2><p>This website may use cookies and similar technologies. You can control cookies through your browser settings.</p>" +
      "<h2>9. Changes to this policy</h2><p>We may update this policy from time to time. The latest version will always be published on this page.</p>" +
      "<h2>10. Contact</h2><p>For privacy questions or requests, contact <a class=\"inline-link\" href=\"mailto:" + SITE.email + "\">" + SITE.email + "</a>.</p>" +
      "</div></article>"
  ];
  return page({
    root,
    title: "Privacy Policy | SHANZOO",
    desc: "SHANZOO privacy policy — draft placeholder describing how we handle the personal information collected through this website.",
    canonicalPath: "pages/privacy.html",
    body: body.join("\n")
  });
}

function buildTerms() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "Legal",
      title: "Terms of Use",
      lead: "This draft outline is placeholder text for review and does not constitute legal advice. Confirm final wording with a qualified professional before publishing.",
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "Terms of Use" }
      ]
    }),
    '<article class="article section">' +
      '<div class="notice">This is a <strong>draft placeholder provided for review</strong>. Replace with approved legal content before going live.</div>' +
      '<div class="prose mt-4">' +
      "<h2>1. Acceptance of terms</h2><p>By accessing this website you agree to these terms. If you do not agree, please do not use the site.</p>" +
      "<h2>2. About our content</h2><p>Content on this website is provided for general information and does not constitute professional or legal advice.</p>" +
      "<h2>3. Intellectual property</h2><p>The SHANZOO name, logo and site content are protected by intellectual property law. You may not reproduce them without permission.</p>" +
      "<h2>4. Acceptable use</h2><p>You agree not to misuse the website, attempt unauthorized access, or interfere with its operation.</p>" +
      "<h2>5. Third-party links</h2><p>Links to third-party websites are provided for convenience. We are not responsible for their content or practices.</p>" +
      "<h2>6. Disclaimers</h2><p>The website is provided &quot;as is&quot;. To the extent permitted by law, we make no warranties about its accuracy or availability.</p>" +
      "<h2>7. Limitation of liability</h2><p>To the maximum extent permitted by law, we are not liable for damages arising from your use of this website.</p>" +
      "<h2>8. Governing law</h2><p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein.</p>" +
      "<h2>9. Contact</h2><p>Questions about these terms? Contact <a class=\"inline-link\" href=\"mailto:" + SITE.email + "\">" + SITE.email + "</a>.</p>" +
      "</div></article>"
  ];
  return page({
    root,
    title: "Terms of Use | SHANZOO",
    desc: "SHANZOO terms of use — draft placeholder describing the conditions for using this website.",
    canonicalPath: "pages/terms.html",
    body: body.join("\n")
  });
}

function build404() {
  const root = "../";
  const body = [
    '<section class="error-page"><div class="container">' +
      '<p class="error-page__code" aria-hidden="true">404</p>' +
      '<p class="eyebrow" style="justify-content:center">Page not found</p>' +
      "<h1>This page took a wrong turn.</h1>" +
      "<p>The page you are looking for may have moved, been renamed, or never existed. Let's get you back on track.</p>" +
      '<div class="error-page__actions">' +
      '<a class="btn btn--primary" href="' + href(root, "/index.html") + '">Back to Home</a>' +
      '<a class="btn btn--navy" href="' + href(root, "/pages/services.html") + '">Explore Services</a>' +
      '<a class="btn btn--ghost" href="' + href(root, "/pages/contact.html") + '">Contact Us</a>' +
      "</div>" +
      "</div></section>"
  ];
  return page({
    root,
    title: "Page Not Found (404) | SHANZOO",
    desc: "The page you are looking for could not be found. Explore SHANZOO's homepage, services or contact page.",
    canonicalPath: "404.html",
    body: body.join("\n")
  });
}

/* ------------------------------ buildAbout ------------------------------- */
function buildAbout() {
  const root = "../";
  const body = [
    pageHero({
      root,
      eyebrow: "About SHANZOO",
      title: "We make data dependable for growing businesses.",
      lead: "SHANZOO is a Toronto-based consultancy focused on one thing: helping organizations manage and connect their data so it genuinely works for them.",
      aside:
        '<div class="cta-mini">' + svg("message") + "<span><strong>Have a data challenge?</strong><br>Contact us for an initial conversation.</span></div>" +
        '<a class="btn btn--primary btn--sm mt-2" style="width:fit-content" href="' + href(root, "/pages/contact.html#consultation") + '">Get a Consultation</a>',
      crumbs: [
        { href: "/index.html", label: "Home" },
        { label: "About SHANZOO" }
      ]
    }),
    '<section class="section"><div class="container split">' +
      "<div>" +
      sectionHead("What we do", "Two disciplines, one aim: your data works for you.") +
      '<div class="prose"><p><strong>Data management</strong> keeps your information clean, secure, accurate and understood. <strong>Data integration</strong> connects your systems so the right data reaches the right place, on time. Together they underpin most of the \u201cwe can\u2019t trust our numbers\u201d conversations businesses have today.</p>' +
      "<p>We help with both — from a single unifying project to ongoing improvement. We keep the work practical and the language plain.</p></div>" +
      '<a class="btn btn--primary mt-3" href="' + href(root, "/pages/services.html") + '">See What We Offer</a>' +
      "</div>" +
      '<div class="split__media"><div class="visual visual--navy">' + D.svgNetwork() + "</div></div>" +
      "</div></section>",
    '<section class="section bg-alt"><div class="container">' +
      sectionHead("Why reliable data matters", "Data is the quiet foundation under every decision.") +
      '<div class="grid grid-2">' +
      '<div class="panel"><h4>When data is unreliable</h4><ul class="check-list mt-2">' +
      "<li>" + svg("circle") + "Teams quietly stop trusting reports.</li>" +
      "<li>" + svg("circle") + "Time is burned reconciling spreadsheets.</li>" +
      "<li>" + svg("circle") + "Customers notice the mistakes you 'fixed' a week ago.</li>" +
      "</ul></div>" +
      '<div class="panel panel--green"><h4>When data is dependable</h4><ul class="check-list mt-2">' +
      "<li>" + svg("check") + "Decisions are made faster and with confidence.</li>" +
      "<li>" + svg("check") + "Systems cooperate instead of contradicting each other.</li>" +
      "<li>" + svg("check") + "Sensitive data is protected by design.</li>" +
      "</ul></div>" +
      "</div></div></section>",
    '<section class="section"><div class="container">' +
      sectionHead("Problems we help solve", "If these sound familiar, there is a path forward.", true) +
      '<div class="grid grid-3">' +
      [
        ["database", "Scattered information", "The same facts live in many systems and never quite match."],
        ["circle", "Duplicate and incorrect records", "Customers, products and vendors appear multiple times with different details."],
        ["clock", "Slow reporting", "Reports take days to assemble because data must be copied and fixed by hand."],
        ["lock", "Security and privacy worries", "Too little is known about who can see sensitive data."],
        ["link", "Disconnected applications", "Systems do not share information, forcing manual re-entry."],
        ["trend", "Missed opportunities", "Data that could drive growth is stuck in silos nobody can search."]
      ]
        .map(
          (x, i) =>
            '<div class="industry-card reveal" data-delay="' + (i % 3) + '"><div class="industry-card__icon">' + svg(x[0]) + '</div><h3>' + x[1] + "</h3><p>" + x[2] + "</p></div>"
        )
        .join("") +
      "</div></div></section>",
    '<section class="section bg-alt"><div class="container split split--reverse">' +
      '<div class="split__media"><div class="panel panel--navy"><h3>A practical, customer-focused approach</h3>' +
      '<ul class="check-list mt-3">' +
      "<li>" + svg("check") + "We start with your business outcome, not our catalog.</li>" +
      "<li>" + svg("check") + "We explain in plain language and document as we go.</li>" +
      "<li>" + svg("check") + "We deliver in stages you can see and approve.</li>" +
      "<li>" + svg("check") + "We hand over knowledge so you can own the solution.</li>" +
      "</ul>" +
      '<a class="btn btn--light mt-3" href="' + href(root, "/pages/our-approach.html") + '">Our Approach</a></div></div>' +
      "<div>" +
      sectionHead("How we work with you", "A partner beside you, not a vendor across the table.") +
      '<div class="prose"><p>SHANZOO is based in <strong>Toronto, Ontario</strong>, and serves clients across Canada and internationally. We work as an extension of your team — sharing context, answering questions directly and leaving you with systems and documentation you can actually maintain.</p>' +
      "<p>We are deliberately sized for close involvement. That keeps communication clear and quality high on every engagement.</p></div>" +
      "</div></div></section>",
    '<section class="section--tight"><div class="container">' +
      ctaBanner({
        root,
        title: "Sound like the kind of team you need?",
        lead: "Introduce yourself and your data challenge — we will take it from there.",
        actions: [{ href: "/pages/contact.html#consultation", label: "Contact SHANZOO", cls: "btn--primary btn--lg" }, { href: "/pages/why-shanzoo.html", label: "Why Choose Us", cls: "btn--outline-light btn--lg" }]
      }) +
      "</div></section>"
  ];
  return page({
    root,
    title: "About SHANZOO | Data Management & Integration Consultants, Toronto",
    desc: "SHANZOO is a Toronto-based enterprise data consultancy helping organizations organize, protect and connect their business data — clearly and practically.",
    canonicalPath: "pages/about.html",
    body: body.join("\n")
  });
}

/* ------------------------------ Build & write ---------------------------- */
function write(file, content) {
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
  console.log("  wrote " + file);
}

function build() {
  console.log("Building SHANZOO static site“¦");

  write("index.html", buildIndex());
  write("pages/about.html", buildAbout());
  write("pages/services.html", buildServices());
  write("pages/data-management.html", buildDataManagement());
  write("pages/data-integration.html", buildDataIntegration());
  write("pages/track-record.html", buildTrackRecord());
  write("pages/solutions.html", buildSolutions());
  write("pages/industries.html", buildIndustries());
  write("pages/why-shanzoo.html", buildWhy());
  write("pages/our-approach.html", buildApproach());
  write("pages/insights.html", buildInsights());
  write("pages/contact.html", buildContact());
  write("pages/login.html", buildLogin());
  write("pages/signup.html", buildSignup());
  write("pages/privacy.html", buildPrivacy());
  write("pages/terms.html", buildTerms());
  write("pages/404.html", build404());

  // Four insight articles
  insights.forEach((post) => {
    if (ARTICLE_CONTENT[post.slug]) {
      write("pages/insights/" + post.slug + ".html", buildInsightArticle(post.slug));
    }
  });

  // Ten service pages
  D.SERVICES.forEach((svc) => {
    write("services/" + svc.slug + ".html", buildService(svc));
  });

  // Technology service pages (Cloud, Software, Consulting, Automation)
  const techSlugs = ["cloud-virtualization", "software-development", "consulting-managed-services", "enterprise-automation"];
  techSlugs.forEach((slug) => {
    write("services/" + slug + ".html", buildTechService(slug));
  });

  // sitemap + robots
  const urls = [
    "index.html",
    "pages/about.html",
    "pages/services.html",
    "pages/data-management.html",
    "pages/data-integration.html",
    "pages/track-record.html",
    "pages/solutions.html",
    "pages/industries.html",
    "pages/why-shanzoo.html",
    "pages/our-approach.html",
    "pages/insights.html",
    "pages/contact.html",
    "pages/login.html",
    "pages/signup.html",
    "pages/privacy.html",
    "pages/terms.html",
    "pages/404.html"
  ];
  insights.forEach((p) => urls.push("pages/insights/" + p.slug + ".html"));
  D.SERVICES.forEach((s) => urls.push("services/" + s.slug + ".html"));
  techSlugs.forEach((s) => urls.push("services/" + s + ".html"));

  const base = SITE.domain ? "https://" + SITE.domain : "";
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .filter((u) => u !== "pages/404.html")
      .map((u) => "  <url><loc>" + base + "/" + u + "</loc></url>")
      .join("\n") +
    "\n</urlset>\n";
  write("sitemap.xml", sitemap);
  write(
    "robots.txt",
    "User-agent: *\nAllow: /\n\n" +
      (base ? "Sitemap: " + base + "/sitemap.xml\n" : "Sitemap: /sitemap.xml\n")
  );

  console.log("Done. Generated " + urls.length + " pages + support files.");
  if (!SITE.domain) {
    console.log(
      "Note: SITE.domain is empty, so canonical tags are omitted and sitemap.xml uses root-relative URLs. " +
        "Set tools/data.js SITE.domain to your production domain and rebuild before launch."
    );
  }
}

module.exports = { build };

if (require.main === module) {
  build();
}
