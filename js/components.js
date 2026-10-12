/* ==========================================================================
   SHANZOO — Components
   FAQ accordions, in-page service navigation (scrollspy).
   ========================================================================== */
(function () {
  "use strict";

  function initAccordions() {
    var groups = document.querySelectorAll(".accordion");
    groups.forEach(function (group, index, list) {
      var btn = group.querySelector(".accordion__btn");
      var panel = group.querySelector(".accordion__panel");
      if (!btn || !panel) return;

      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "acc-" + index + "-panel");
      panel.setAttribute("id", "acc-" + index + "-panel");

      btn.addEventListener("click", function () {
        var isOpen = panel.classList.contains("is-open");
        list.forEach(function (other) {
          var ob = other.querySelector(".accordion__btn");
          var op = other.querySelector(".accordion__panel");
          op.classList.remove("is-open");
          if (ob) ob.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          panel.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function initScrollSpy() {
    var nav = document.querySelector(".svc-nav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    if (!links.length) return;
    var sections = links
      .map(function (a) {
        var el = document.querySelector(a.getAttribute("href"));
        return el ? { link: a, el: el } : null;
      })
      .filter(Boolean);

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var match = sections.find(function (s) {
            return s.el === entry.target;
          });
          if (match) match.link.classList.add("is-active");
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      io.observe(s.el);
    });
  }

  function initSmoothAnchors() {
    var nav = document.querySelector(".svc-nav");
    if (!nav || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (!a) return;
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }

  function init() {
    initAccordions();
    initScrollSpy();
    initSmoothAnchors();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();