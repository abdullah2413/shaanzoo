/* ==========================================================================
   SHANZOO — Forms
   Frontend-only validation and UX for the contact, login and sign-up forms.

   FUTURE BACKEND INTEGRATION NOTES
   --------------------------------------------------------------------------
   Each form has a `data-endpoint` attribute pointing at the REST route the
   future Express.js API will expose (e.g. "/api/contact"). In this phase the
   value is empty and handlers stop after client-side validation, showing an
   honest "preview only" message.

   To connect the backend later:
   1. Point the form's `data-endpoint` to the real route.
   2. Replace `submitToBackend(form, data)` below with a fetch call
      (see the commented placeholder).
   3. Update the success message copy on the contact page.
   ========================================================================== */
(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[+\d][\d\s().-]{6,}$/;

  function setError(field, message) {
    field.classList.add("has-error");
    var input = field.querySelector("input, select, textarea");
    if (input) input.setAttribute("aria-invalid", "true");
    var box = field.querySelector(".field__error");
    if (box && message) box.textContent = message;
  }

  function clearError(field) {
    field.classList.remove("has-error");
    var input = field.querySelector("input, select, textarea");
    if (input) input.removeAttribute("aria-invalid");
  }

  function validateField(group) {
    var input = group.querySelector("input, select, textarea");
    if (!input) return true;
    var name = input.name;
    var label = group.querySelector("label") ? group.querySelector("label").textContent.replace(/\s+/g, " ").trim() : "This field";
    var listen = input.type === "checkbox" ? "change" : "input";

    function check() {
      var value = (input.value || "").trim();
      var ok = true;
      var msg = "";
      if (input.required && (input.type === "checkbox" ? !input.checked : !value)) {
        ok = false;
        msg = "Please provide " + label.toLowerCase() + ". " + (input.type === "checkbox" ? "This consent is required." : "");
      } else if (value && input.type === "email" && !EMAIL_RE.test(value)) {
        ok = false;
        msg = "Please enter a valid email address, e.g. name@company.com";
      } else if (value && name === "phone" && !PHONE_RE.test(value)) {
        ok = false;
        msg = "Please enter a valid phone number.";
      } else if (input.hasAttribute("data-match") && value) {
        var matchEl = document.getElementById(input.getAttribute("data-match-for"));
        if (matchEl && matchEl.value !== value) {
          ok = false;
          msg = "Passwords do not match.";
        }
      } else if (name === "password" && input.dataset.min && value && value.length < parseInt(input.dataset.min, 10)) {
        ok = false;
        msg = "Password must be at least " + input.dataset.min + " characters.";
      } else if (input.maxLength && value.length >= input.maxLength) {
        input.setCustomValidity("");
      }
      if (ok) clearError(group);
      else setError(group, msg);
      return ok;
    }
    input.addEventListener(listen, check);
    input.addEventListener("blur", check);
    return true;
  }

  function initGenesisValidation() {
    var forms = document.querySelectorAll("form[data-validate]");
    forms.forEach(function (form) {
      var groups = Array.prototype.slice.call(form.querySelectorAll(".field"));
      groups.forEach(validateField);
    });
  }

  function runDynamicValidation(form) {
    var groups = Array.prototype.slice.call(form.querySelectorAll(".field"));
    var valid = true;
    groups.forEach(function (g) {
      var input = g.querySelector("input, select, textarea");
      var value = (input && input.value ? input.value : "").trim();
      var label = g.querySelector("label") ? g.querySelector("label").textContent.replace(/\s+/g, " ").trim() : "This field";
      var ok = true;
      if (input && input.required && (input.type === "checkbox" ? !input.checked : !value)) {
        ok = false;
        setError(g, "Please provide " + label.toLowerCase() + ". " + (input.type === "checkbox" ? "This consent is required." : ""));
      } else if (input && value && input.type === "email" && !EMAIL_RE.test(value)) {
        ok = false;
        setError(g, "Please enter a valid email address.");
      } else if (input && value && input.name === "phone" && !PHONE_RE.test(value)) {
        ok = false;
        setError(g, "Please enter a valid phone number.");
      } else if (input && input.hasAttribute("data-match") && input.value) {
        var matchEl = document.getElementById(input.getAttribute("data-match-for"));
        if (matchEl && matchEl.value !== input.value) {
          ok = false;
          setError(g, "Passwords do not match.");
        }
      } else if (input && input.name === "password" && input.dataset.min && input.value && input.value.length < parseInt(input.dataset.min, 10)) {
        ok = false;
        setError(g, "Password must be at least " + input.dataset.min + " characters.");
      } else {
        if (input && input.type === "checkbox" && !input.checked) {
          ok = false;
          setError(g, "This consent is required.");
        } else if (g.classList.contains("has-error")) {
          clearError(g);
        }
        if (input && !ok) {
          if (input.checkValidity && !input.checkValidity()) {
            setError(g, "Please check this field.");
          }
        }
      }
      if (!ok) valid = false;
    });
    return valid;
  }

  function showFormNote(form, type, html) {
    var existing = form.querySelector(".form-note[data-dynamic]");
    if (existing) existing.remove();
    var note = document.createElement("div");
    note.className = "form-note form-note--" + type + " reveal-fast";
    note.setAttribute("data-dynamic", "");
    note.setAttribute("role", "status");
    note.innerHTML = html;
    form.prepend(note);
  }

  function getCookie(name) {
    var escaped = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
    var m = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // POST the form to the REST endpoint declared in `data-endpoint`.
  // Returns a promise resolving to { ok, status, message }.
  function submitToBackend(form, data) {
    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) {
      return Promise.resolve({ ok: false, status: 0, message: "This form is not configured." });
    }
    var headers = { "Content-Type": "application/json", Accept: "application/json" };
    var csrf = getCookie("shanzoo.csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;

    return fetch(endpoint, {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            var data = body && body.data;
            var message =
              (body && body.message) ||
              (data && data.message) ||
              (res.ok ? "Thank you — your message has been received." : "Something went wrong. Please try again.");
            return { ok: res.ok, status: res.status, message: message };
          });
      })
      .catch(function () {
        return { ok: false, status: 0, message: "Network error. Please check your connection and try again." };
      });
  }

  function collectData(form) {
    var data = {};
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!el.name) return;
      if (el.type === "checkbox") data[el.name] = el.checked;
      else if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function wireSubmit(form) {
    // Forms flagged as owned by another module (e.g. the auth flows) are
    // handled elsewhere; skip the generic submit handler for them.
    if (form.getAttribute("data-own")) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.submitting === "true") return;

      var valid = runDynamicValidation(form);
      if (!valid) {
        showFormNote(form, "warn", "<strong>Please review the highlighted fields.</strong>");
        var firstError = form.querySelector(".field.has-error");
        if (firstError) {
          var fi = firstError.querySelector("input, select, textarea");
          if (fi) fi.focus();
        }
        return;
      }

      var btn = form.querySelector("button[type='submit']");
      var original = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending…";
      }
      form.dataset.submitting = "true";

      submitToBackend(form, collectData(form))
        .then(function (result) {
          if (result.ok) {
            showFormNote(form, "success", "<strong>Thank you.</strong> " + escapeHtml(result.message));
            form.reset();
          } else {
            showFormNote(form, "warn", "<strong>Not sent.</strong> " + escapeHtml(result.message));
          }
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = original;
          }
          form.dataset.submitting = "false";
          form.dataset.submitted = "true";
        });
    });
  }

  function initPasswordToggles() {
    document.querySelectorAll(".password-wrap").forEach(function (wrap) {
      var input = wrap.querySelector(".input");
      var btn = wrap.querySelector(".password-toggle");
      if (!input || !btn) return;
      var iconShow = btn.querySelector(".pw-icon-show");
      var iconHide = btn.querySelector(".pw-icon-hide");
      btn.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        if (iconShow) iconShow.style.display = show ? "none" : "";
        if (iconHide) iconHide.style.display = show ? "" : "none";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  }

  function initPasswordMeter() {
    var input = document.getElementById("signup-password");
    var confirmation = document.getElementById("signup-confirm");
    var meter = document.querySelector("[data-password-meter]");
    if (!input || !meter) return;
    var bars = meter.querySelectorAll("span");
    function score(v) {
      var s = 0;
      if (v.length >= 8) s++;
      if (v.length >= 12) s++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
      if (/[0-9]/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      return Math.min(3, s >= 5 ? 3 : s >= 3 ? 2 : s >= 1 ? 1 : 0);
    }
    input.addEventListener("input", function () {
      var s = score(input.value);
      bars.forEach(function (b, i) {
        b.classList.remove("on-weak", "on-good");
        if (i < s) b.classList.add(s === 1 ? "on-weak" : "on-good");
      });
      var label = meter.querySelector(".password-meter__label");
      if (label) {
        label.textContent =
          s === 0 ? "Your password needs at least 8 characters." :
          s === 1 ? "Weak — add length and variety." :
          s === 2 ? "Good — consider mixing symbols and numbers." :
          "Strong password.";
      }
    });
    if (confirmation) {
      confirmation.addEventListener("input", function () {
        var group = confirmation.closest(".field");
        if (confirmation.value && confirmation.value !== input.value) {
          setError(group, "Passwords do not match.");
        } else {
          clearError(group);
        }
      });
    }
  }

  function initCharCounters() {
    document.querySelectorAll("[data-charcount]").forEach(function (input) {
      var out = document.getElementById(input.getAttribute("data-charcount"));
      if (!out) return;
      var update = function () {
        out.textContent = input.value.length + " / " + input.maxLength;
      };
      update();
      input.addEventListener("input", update);
    });
  }

  function initSubmitGuard() {
    document.querySelectorAll("form[data-validate]").forEach(function (form) {
      var submitted = false;
      form.addEventListener("submit", function () {
        if (form.dataset.submitted === "true") submitted = true;
      });
      form.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && submitted) e.preventDefault();
      });
    });
  }

  function init() {
    initGenesisValidation();
    initPasswordToggles();
    initPasswordMeter();
    initCharCounters();
    initSubmitGuard();
    document.querySelectorAll("form[data-validate]").forEach(wireSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Shared with js/auth.js so the auth flows reuse the same validation + notes.
  window.SHANZOO = window.SHANZOO || {};
  window.SHANZOO.validateForm = runDynamicValidation;
  window.SHANZOO.formNote = showFormNote;
  window.SHANZOO.escapeHtml = escapeHtml;
  window.SHANZOO.getCookie = getCookie;
})();