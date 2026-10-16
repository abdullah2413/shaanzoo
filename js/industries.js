/* ==========================================================================
   SHANZOO — Data Services showcase
   One structured source of topics lives in the markup (generated from a single
   array), so the media frame and the selector list can never disagree: the
   image is addressed purely by the same index as its button.

   Desktop: hovering or focusing a row swaps the image + caption (click works
   too). Touch: tapping a row. The frame itself never resizes — only the inner
   content cross-fades — so the section never jumps.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  var CAN_HOVER = window.matchMedia("(hover: hover)");

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function init() {
    document.querySelectorAll("[data-dservices]").forEach(setup);
  }

  function setup(root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll(".dsvc"));
    if (!buttons.length) return;

    var images = Array.prototype.slice.call(root.querySelectorAll("[data-dsvc-img]"));
    var indexEl = root.querySelector("[data-dsvc-index]");
    var titleEl = root.querySelector("[data-dsvc-title]");
    var descEl = root.querySelector("[data-dsvc-desc]");

    var total = buttons.length;
    var current = -1;

    function activate(i) {
      i = (i + total) % total;
      if (i === current) return;
      current = i;

      buttons.forEach(function (b, k) {
        var on = k === i;
        b.classList.toggle("is-active", on);
        /* The rows are real links, so expose the highlighted one with
           aria-current rather than aria-pressed (which is for buttons). */
        if (on) {
          b.setAttribute("aria-current", "true");
        } else {
          b.removeAttribute("aria-current");
        }
      });

      /* Same index, both sides — image and caption can never desync. */
      images.forEach(function (img, k) {
        img.classList.toggle("is-active", k === i);
      });

      var btn = buttons[i];
      var title = btn.querySelector(".dsvc__title");
      var desc = btn.querySelector(".dsvc__sub");
      if (titleEl) titleEl.textContent = title ? title.textContent : "";
      if (descEl) descEl.textContent = desc ? desc.textContent : "";
      if (indexEl) indexEl.textContent = pad(i + 1) + " / " + pad(total);
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        activate(i);
      });
      btn.addEventListener("focus", function () {
        activate(i);
      });
      if (CAN_HOVER.matches) {
        btn.addEventListener("pointerenter", function () {
          activate(i);
        });
      }
    });

    /* Keep the first topic in sync if the HTML default ever drifts. */
    activate(0);
    void REDUCED;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
