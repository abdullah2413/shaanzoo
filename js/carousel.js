/* ==========================================================================
   SHANZOO — Service carousel
   Lightweight, dependency-free horizontal carousel for the "Explore Our
   Services" section. Uses native scroll-snap for the motion and adds
   prev/next controls, a progress rail and an active-card state.
   Respects prefers-reduced-motion and the existing filter controls.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function initCarousel(root) {
    var track = root.querySelector("[data-car-track]");
    if (!track) return;

    var prevBtn = root.querySelector("[data-car-prev]");
    var nextBtn = root.querySelector("[data-car-next]");
    var indexEl = root.querySelector("[data-car-index]");
    var totalEl = root.querySelector("[data-car-total]");
    var barEl = root.querySelector("[data-car-bar]");
    var liveEl = root.querySelector("[data-car-live]");

    var all = Array.prototype.slice.call(track.querySelectorAll("[data-explorer-card]"));
    if (!all.length) return;

    var index = 0;
    var ticking = false;

    function visible() {
      return all.filter(function (c) {
        return !c.classList.contains("is-hidden");
      });
    }

    /* Uniform card metrics: width, step (card + gap) and total content width. */
    function metrics(list) {
      var rect0 = list[0].getBoundingClientRect();
      var width = rect0.width;
      var step = list.length > 1 ? list[1].getBoundingClientRect().left - rect0.left : width;
      var gap = Math.max(0, step - width);
      return {
        width: width,
        step: step,
        content: list.length * width + (list.length - 1) * gap
      };
    }

    function maxScroll() {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function update() {
      var list = visible();
      if (!list.length) return;

      var m = metrics(list);
      var staticMode = m.content <= track.clientWidth + 2;
      root.classList.toggle("is-static", staticMode);

      var max = staticMode ? 0 : list.length - 1;
      if (index < 0) index = 0;
      if (index > max) index = max;

      all.forEach(function (c) {
        c.classList.remove("is-active");
      });
      if (list[index]) list[index].classList.add("is-active");

      if (indexEl) indexEl.textContent = pad(index + 1);
      if (totalEl) totalEl.textContent = pad(list.length);
      if (liveEl) liveEl.textContent = "Service " + (index + 1) + " of " + list.length;

      if (barEl) {
        var denom = staticMode ? 1 : list.length;
        barEl.style.width = 100 / denom + "%";
        barEl.style.transform = "translateX(" + index * 100 + "%)";
      }
      if (prevBtn) prevBtn.disabled = staticMode || index <= 0;
      if (nextBtn) nextBtn.disabled = staticMode || index >= max;
    }

    function goTo(i) {
      var list = visible();
      if (!list.length) return;
      var m = metrics(list);
      var max = list.length - 1;
      index = Math.max(0, Math.min(i, max));
      track.scrollLeft = Math.min(index * m.step, maxScroll());
      update();
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        if (root.classList.contains("is-static")) return;
        var list = visible();
        if (!list.length) return;
        var m = metrics(list);
        var max = list.length - 1;
        var idx = m.step > 0 ? Math.round(track.scrollLeft / m.step) : 0;
        idx = Math.max(0, Math.min(idx, max));
        if (idx !== index) {
          index = idx;
          update();
        }
      });
    }

    function onResize() {
      var list = visible();
      if (!list.length) return;
      var m = metrics(list);
      var max = list.length - 1;
      if (index > max) index = max;
      if (!root.classList.contains("is-static")) {
        track.scrollLeft = Math.min(index * m.step, maxScroll());
      }
      update();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goTo(index - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goTo(index + 1);
      });
    }

    track.addEventListener("scroll", onScroll, { passive: true });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(visible().length - 1);
      }
    });

    /* Filters are handled by components.js (a click listener on the button,
       i.e. the target phase). Listening on the document bubble phase runs
       afterwards, so the .is-hidden classes are already applied. */
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest("[data-filter]");
      if (!btn || btn.closest("[data-explorer]") !== root) return;
      window.requestAnimationFrame(function () {
        index = 0;
        // Reset instantly so smooth scrolling / snap / scroll-anchoring can't
        // fight the position after the visible set changes.
        var restore = track.style.scrollBehavior;
        track.style.scrollBehavior = "auto";
        track.scrollLeft = 0;
        void track.offsetWidth;
        track.style.scrollBehavior = restore;
        update();
      });
    });

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(onResize);
      ro.observe(track);
    } else {
      window.addEventListener("resize", onResize);
    }

    /* One-time swipe hint, nudging the first card to signal horizontal scroll. */
    function maybeHint() {
      if (REDUCED.matches) return;
      var list = visible();
      if (list.length < 2) return;
      var m = metrics(list);
      if (m.content <= track.clientWidth + 2) return;
      var first = list[0];
      if (!first || typeof first.animate !== "function") return;
      first.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-14px)", offset: 0.5 },
          { transform: "translateX(0)" }
        ],
        { duration: 700, delay: 900, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
      );
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              obs.disconnect();
              maybeHint();
            }
          });
        },
        { threshold: 0.3 }
      );
      io.observe(root);
    } else {
      maybeHint();
    }

    update();
  }

  function init() {
    document.querySelectorAll("[data-explorer]").forEach(initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
