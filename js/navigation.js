/* ==========================================================================
   SHANZOO — Navigation
   Handles: sticky header state, desktop mega menus + dropdowns, keyboard
   accessibility, and the off-canvas mobile navigation with accordions.
   ========================================================================== */
(function () {
  "use strict";

  var DESKTOP = window.matchMedia("(min-width: 1101px)");
  var CLOSE_DELAY = 180;

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initNav() {
    var nav = document.getElementById("primary-nav");
    var toggle = document.querySelector(".nav-toggle");
    var overlay = document.querySelector(".mobile-overlay");
    if (!nav) return;

    var items = Array.prototype.slice.call(
      nav.querySelectorAll("[data-dropdown]")
    );
    var closeTimer = null;

    function openMenu(item) {
      var panel = item.querySelector(".mega, .menu-simple");
      var trigger = item.querySelector(".nav__link");
      if (!panel) return;
      item.classList.add("is-open");
      panel.classList.add("is-open");
      if (trigger) trigger.setAttribute("aria-expanded", "true");
    }

    function closeMenu(item) {
      var panel = item.querySelector(".mega, .menu-simple");
      var trigger = item.querySelector(".nav__link");
      if (!panel) return;
      item.classList.remove("is-open");
      panel.classList.remove("is-open");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    }

    function closeAllMenus(except) {
      items.forEach(function (it) {
        if (it !== except) closeMenu(it);
      });
    }

    items.forEach(function (item) {
      var trigger = item.querySelector(".nav__link");
      var panel = item.querySelector(".mega, .menu-simple");
      if (!trigger || !panel) return;

      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");

      // Click / tap toggles (works for touch and keyboard)
      trigger.addEventListener("click", function (e) {
        if (!DESKTOP.matches) {
          e.preventDefault();
          var isOpen = panel.classList.contains("is-open");
          closeMenusIn(nav, item);
          if (!isOpen) openMenu(item);
          return;
        }
        e.preventDefault();
        var isOpen = item.classList.contains("is-open");
        closeAllMenus(item);
        if (isOpen) {
          closeMenu(item);
        } else {
          openMenu(item);
        }
      });

      // Desktop hover intent
      item.addEventListener("mouseenter", function () {
        if (!DESKTOP.matches) return;
        if (closeTimer) clearTimeout(closeTimer);
        closeAllMenus(item);
        openMenu(item);
      });
      item.addEventListener("mouseleave", function () {
        if (!DESKTOP.matches) return;
        closeTimer = setTimeout(function () {
          closeMenu(item);
        }, CLOSE_DELAY);
      });

      // Close when focus leaves the item (desktop)
      item.addEventListener("focusout", function (e) {
        if (!DESKTOP.matches) return;
        if (!item.contains(e.relatedTarget)) closeMenu(item);
      });
    });

    function closeMenusIn(scope, except) {
      Array.prototype.forEach.call(
        scope.querySelectorAll("[data-dropdown].is-open"),
        function (it) {
          if (it !== except) closeMenu(it);
        }
      );
    }

    // Escape closes menus or the mobile panel
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (nav.classList.contains("is-open")) {
        closePanel();
        if (toggle) toggle.focus();
        return;
      }
      var open = nav.querySelector("[data-dropdown].is-open");
      if (open) {
        var trigger = open.querySelector(".nav__link");
        closeMenu(open);
        if (trigger) trigger.focus();
      }
    });

    // Mobile panel controls
    function openPanel() {
      nav.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
      }
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("nav-open");
      var closeBtn = nav.querySelector("[data-nav-close]");
      if (closeBtn) closeBtn.focus();
    }
    function closePanel() {
      nav.classList.remove("is-open");
      if (overlay) overlay.classList.remove("is-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
      document.documentElement.style.overflow = "";
      document.body.classList.remove("nav-open");
      closeMenusIn(nav);
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        if (nav.classList.contains("is-open")) closePanel();
        else openPanel();
      });
    }
    if (overlay) overlay.addEventListener("click", closePanel);

    // Explicit close control inside the panel header
    var closeBtn = nav.querySelector("[data-nav-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closePanel();
        if (toggle) toggle.focus();
      });
    }

    // Close mobile panel when a real navigation link is chosen
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link && !DESKTOP.matches) closePanel();
    });

    // Reset state on breakpoint change
    var onBreak = function () {
      closeMenusIn(nav);
      if (DESKTOP.matches) closePanel();
    };
    if (DESKTOP.addEventListener) DESKTOP.addEventListener("change", onBreak);
    else DESKTOP.addListener(onBreak);

    window.addEventListener("resize", function () {
      if (DESKTOP.matches && nav.classList.contains("is-open")) closePanel();
    });
  }

  function initActiveState() {
    // Visually mark the current page in nav + mega menus.
    // All page basenames are unique across the project, so comparing the
    // file name is a reliable, path-independent approach.
    var path = window.location.pathname.replace(/\\/g, "/");
    var file = path.substring(path.lastIndexOf("/") + 1) || "index.html";

    var links = document.querySelectorAll(
      ".nav__list a, .mega a, .menu-simple a, .mobile-actions a"
    );
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.indexOf("#") === 0) return;
      var hrefFile = href.substring(href.lastIndexOf("/") + 1).split("#")[0];
      if (hrefFile === file) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function init() {
    initHeader();
    initNav();
    initActiveState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
