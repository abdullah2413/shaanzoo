/* ==========================================================================
   SHANZOO — Components
   FAQ accordions, in-page service navigation (scrollspy),
   and accessible tabbed panels.
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

  function initTabs() {
    var groups = document.querySelectorAll("[data-tabs]");
    groups.forEach(function (group) {
      var btns = Array.prototype.slice.call(group.querySelectorAll(".tabs__btn"));
      if (!btns.length) return;
      var panels = btns.map(function (btn) {
        return document.getElementById(btn.getAttribute("aria-controls"));
      });

      function activate(index, focus) {
        btns.forEach(function (btn, i) {
          var active = i === index;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
          btn.setAttribute("tabindex", active ? "0" : "-1");
          var panel = panels[i];
          if (panel) panel.classList.toggle("is-active", active);
        });
        if (focus && btns[index]) btns[index].focus();
      }

      btns.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          activate(i, false);
        });
        btn.addEventListener("keydown", function (e) {
          var last = btns.length - 1;
          var next = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            next = i === last ? 0 : i + 1;
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            next = i === 0 ? last : i - 1;
          } else if (e.key === "Home") {
            next = 0;
          } else if (e.key === "End") {
            next = last;
          }
          if (next === null) return;
          e.preventDefault();
          activate(next, true);
        });
      });
    });
  }

  function init() {
    initAccordions();
    initScrollSpy();
    initSmoothAnchors();
    initTabs();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();