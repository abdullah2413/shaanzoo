/* ==========================================================================
   SHANZOO — main.js
   Entry point for shared, page-agnostic behaviour: footer year, lazy-loading
   enhancement, and anything not covered by the dedicated modules.
   ========================================================================== */
(function () {
  "use strict";

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function initCopyright() {
    var el = document.querySelector("[data-copyright]");
    if (el) {
      var year = new Date().getFullYear();
      el.textContent = "© " + year + " SHANZOO. All rights reserved.";
    }
  }

  function initExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      a.setAttribute("rel", "noopener noreferrer");
    });
  }

  function init() {
    initYear();
    initCopyright();
    initExternalLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();