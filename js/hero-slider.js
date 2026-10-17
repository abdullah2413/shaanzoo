/* ==========================================================================
   SHANZOO — Hero slider
   Automatic, looping service showcase for the homepage hero. Synchronises the
   left-side copy slides, the right-side visuals and the slide indicators.
   Vanilla JS, single timer, transform/opacity transitions only.
   Respects prefers-reduced-motion, pauses on hover, tab hide and out-of-view.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-hero]");
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
  var visuals = Array.prototype.slice.call(root.querySelectorAll("[data-hero-visual]"));
  var floats = Array.prototype.slice.call(root.querySelectorAll("[data-hero-float]"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
  var badge = root.querySelector("[data-hero-badge]");
  var currentEl = root.querySelector("[data-hero-current]");
  var progressEl = root.querySelector("[data-hero-progress]");
  var prevBtn = root.querySelector("[data-hero-prev]");
  var nextBtn = root.querySelector("[data-hero-next]");

  var total = slides.length;
  if (total < 2) return;

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canHover = window.matchMedia("(hover: hover) and (min-width: 901px)");
  var DURATION = 7000;

  if (progressEl) progressEl.style.setProperty("--hero-duration", DURATION + "ms");

  var index = 0;
  var timer = null;
  var visible = true;
  var hovered = false;

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function restartProgress() {
    if (!progressEl || REDUCED.matches) return;
    progressEl.classList.remove("is-running", "is-paused");
    /* Force reflow so the animation restarts cleanly on every slide change. */
    void progressEl.offsetWidth;
    progressEl.classList.add("is-running");
    if (!shouldRun()) progressEl.classList.add("is-paused");
  }

  function syncProgressPause() {
    if (!progressEl || REDUCED.matches) return;
    progressEl.classList.toggle("is-paused", !shouldRun());
  }

  function render() {
    for (var i = 0; i < total; i++) {
      var active = i === index;
      slides[i].classList.toggle("is-active", active);
      slides[i].setAttribute("aria-hidden", active ? "false" : "true");
      if (visuals[i]) visuals[i].classList.toggle("is-active", active);
      if (floats[i]) floats[i].classList.toggle("is-active", active);
      if (dots[i]) {
        dots[i].classList.toggle("is-active", active);
        if (active) dots[i].setAttribute("aria-current", "true");
        else dots[i].removeAttribute("aria-current");
      }
    }
    if (badge) badge.classList.toggle("is-active", index === 0);
    if (currentEl) currentEl.textContent = pad2(index + 1);
    restartProgress();
  }

  function shouldRun() {
    return !REDUCED.matches && visible && !document.hidden && !hovered;
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    syncProgressPause();
  }

  function start() {
    stop();
    if (!shouldRun()) return;
    timer = window.setInterval(function () {
      go(index + 1);
    }, DURATION);
    restartProgress();
  }

  function restart() {
    stop();
    start();
  }

  function go(target) {
    index = ((target % total) + total) % total;
    render();
  }

  function next(manual) {
    go(index + 1);
    if (manual) restart();
  }

  function prev(manual) {
    go(index - 1);
    if (manual) restart();
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      next(true);
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      prev(true);
    });
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      if (i === index) return;
      go(i);
      restart();
    });
  });

  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev(true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next(true);
    }
  });

  root.addEventListener("mouseenter", function () {
    if (!canHover.matches) return;
    hovered = true;
    stop();
  });
  root.addEventListener("mouseleave", function () {
    if (!canHover.matches) return;
    hovered = false;
    start();
  });
  if (canHover.addEventListener) {
    canHover.addEventListener("change", function () {
      hovered = false;
      start();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.15 }
    );
    io.observe(root);
  }

  if (REDUCED.addEventListener) {
    REDUCED.addEventListener("change", function () {
      start();
    });
  }

  /* Counting statistics — runs once, on first viewport reveal. */
  (function initCounters() {
    var els = Array.prototype.slice.call(root.querySelectorAll("[data-hero-count]"));
    if (!els.length) return;

    function fmt(n, pad) {
      var s = String(n);
      while (s.length < pad) s = "0" + s;
      return s;
    }

    function run(el) {
      var target = parseInt(el.getAttribute("data-hero-count"), 10) || 0;
      var pad = parseInt(el.getAttribute("data-hero-pad"), 10) || 0;
      if (REDUCED.matches || !window.requestAnimationFrame) {
        el.textContent = fmt(target, pad);
        return;
      }
      var dur = 1200;
      var started = null;
      var step = function (ts) {
        if (started === null) started = ts;
        var p = Math.min((ts - started) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased), pad);
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = fmt(target, pad);
      };
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(run);
      return;
    }
    var cio = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          run(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    els.forEach(function (el) {
      cio.observe(el);
    });
  })();

  render();
  start();
})();
