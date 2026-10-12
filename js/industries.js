/* ==========================================================================
   SHANZOO — Industries orbit
   Keeps the hub in sync with the selected industry node. Desktop gets a
   connected grid, mobile gets a compact orbit — same data either way.
   Auto-cycles gently and pauses on hover, focus, or when off screen.
   Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  var CAN_HOVER = window.matchMedia("(hover: hover)");
  var CYCLE_MS = 4600;

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function init() {
    var roots = document.querySelectorAll("[data-industries]");
    roots.forEach(setup);
  }

  function setup(root) {
    var nodes = Array.prototype.slice.call(
      root.querySelectorAll(".industry-node")
    );
    if (!nodes.length) return;

    var spokes = Array.prototype.slice.call(
      root.querySelectorAll(".industries__spoke")
    );
    var hubIcon = root.querySelector("[data-hub-icon]");
    var hubName = root.querySelector("[data-hub-name]");
    var hubDesc = root.querySelector("[data-hub-desc]");
    var infoIndex = root.querySelector("[data-info-index]");
    var infoTitle = root.querySelector("[data-info-title]");
    var infoDesc = root.querySelector("[data-info-desc]");

    var total = nodes.length;
    var current = 0;
    var timer = null;
    var paused = false;
    var inView = true;

    function activate(index) {
      current = (index + total) % total;
      var node = nodes[current];
      var labelEl = node.querySelector(".industry-node__label");
      var title = (labelEl ? labelEl.textContent : node.textContent).trim();
      var desc = node.getAttribute("data-desc") || "";

      if (hubName) hubName.textContent = title;
      if (hubDesc) hubDesc.textContent = desc;
      if (infoTitle) infoTitle.textContent = title;
      if (infoDesc) infoDesc.textContent = desc;
      if (infoIndex) infoIndex.textContent = pad(current + 1) + " / " + pad(total);

      var nodeIcon = node.querySelector(".industry-node__icon svg");
      if (hubIcon && nodeIcon) {
        hubIcon.innerHTML = "";
        hubIcon.appendChild(nodeIcon.cloneNode(true));
      }

      nodes.forEach(function (n, i) {
        var on = i === current;
        n.classList.toggle("is-active", on);
        n.setAttribute("aria-pressed", on ? "true" : "false");
      });
      spokes.forEach(function (s, i) {
        s.classList.toggle("is-active", i === current);
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (REDUCED.matches || total < 2) return;
      stop();
      timer = window.setInterval(function () {
        if (!paused && inView) activate(current + 1);
      }, CYCLE_MS);
    }

    nodes.forEach(function (node, i) {
      node.addEventListener("click", function () {
        activate(i);
      });
      node.addEventListener("focus", function () {
        activate(i);
      });
      node.addEventListener("pointerenter", function () {
        if (CAN_HOVER.matches) activate(i);
      });
    });

    root.addEventListener("pointerenter", function () {
      paused = true;
    });
    root.addEventListener("pointerleave", function () {
      paused = false;
    });
    root.addEventListener("focusin", function () {
      paused = true;
    });
    root.addEventListener("focusout", function () {
      paused = false;
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            inView = entry.isIntersecting;
          });
        },
        { threshold: 0.25 }
      );
      io.observe(root);
    }

    activate(0);
    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
