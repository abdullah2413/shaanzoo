/* ==========================================================================
   SHANZOO — Authentication client
   Talks to the Express API (same origin, session cookie based):
     signup -> email OTP, two-step login, forgot/reset password,
     logout, delete-account (re-auth + OTP). Updates the header immediately.
   ========================================================================== */
(function () {
  "use strict";

  var API = "/api/auth";
  var currentUser = null;
  // Set to false when the page is served without the Express backend (e.g. a
  // static preview server). Requests are then skipped instead of 404-ing.
  var apiAvailable = true;

  function getCookie(name) {
    if (window.SHANZOO && window.SHANZOO.getCookie) return window.SHANZOO.getCookie(name);
    var m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ------------------------------- HTTP ---------------------------------- */
  function request(path, opts) {
    if (!apiAvailable && path !== API + "/me") {
      return Promise.resolve({
        ok: false,
        status: 0,
        data: {},
        message:
          "The backend isn't running on this address. Start it with \"npm start\" and open http://localhost:3000 — sign-in and form submission are unavailable in this static preview."
      });
    }
    opts = opts || {};
    var method = (opts.method || "GET").toUpperCase();
    var headers = { Accept: "application/json" };
    var hasBody = opts.body !== undefined;
    if (hasBody) headers["Content-Type"] = "application/json";
    if (method !== "GET" && method !== "HEAD") {
      var csrf = getCookie("shanzoo.csrf");
      if (csrf) headers["X-CSRF-Token"] = csrf;
    }
    return fetch(path, {
      method: method,
      headers: headers,
      credentials: "same-origin",
      body: hasBody ? JSON.stringify(opts.body) : undefined
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            var data = (body && body.data) || {};
            var message =
              (body && body.message) ||
              (data && data.message) ||
              (res.ok ? "" : "Something went wrong. Please try again.");
            return { ok: res.ok, status: res.status, data: data, message: message };
          });
      })
      .catch(function () {
        return {
          ok: false,
          status: 0,
          data: {},
          message: "Network error. Please check your connection and try again."
        };
      });
  }

  /* ------------------------------ Helpers -------------------------------- */
  var CARET =
    '<svg class="auth-user__caret" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function rootPrefix() {
    var link = document.querySelector('link[href*="css/"]');
    if (link) {
      var href = link.getAttribute("href");
      var i = href.indexOf("css/");
      if (i >= 0) return href.slice(0, i);
    }
    var s = document.querySelector('script[src*="js/"]');
    if (s) {
      var src = s.getAttribute("src");
      var j = src.indexOf("js/");
      if (j >= 0) return src.slice(0, j);
    }
    return "";
  }

  function goHome() {
    window.location.href = rootPrefix() + "index.html";
  }

  /* --------------------------- Auth gating ------------------------------- */
  // Single reusable check used by the UI. Returns true only for a verified,
  // server-confirmed session (populated by refreshAuth()).
  function isUserAuthenticated() {
    return !!currentUser;
  }

  function currentPath() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  // Append the current page as ?next= so a visitor returns here after signing in.
  function withNext(href) {
    if (!href) return href;
    var sep = href.indexOf("?") >= 0 ? "&" : "?";
    return href + sep + "next=" + encodeURIComponent(currentPath());
  }

  // Apply auth-gated UI. Logged-out visitors see the sign-in prompt
  // ([data-auth-required]) and the gated submit button ([data-auth-submit]) is
  // disabled. Forms marked [data-requires-auth] are additionally guarded on
  // submit (see js/forms.js) as a fallback.
  function applyAuthGates() {
    var authed = isUserAuthenticated();
    // The contact form stays visible; only its submit is gated until sign-in.
    document.querySelectorAll("[data-auth-submit]").forEach(function (btn) {
      btn.disabled = !authed;
      btn.setAttribute("aria-disabled", authed ? "false" : "true");
    });
    document.querySelectorAll("[data-auth-required]").forEach(function (el) {
      el.classList.toggle("is-hidden", authed);
    });
    if (!authed) {
      document.querySelectorAll("[data-gate-auth]").forEach(function (a) {
        if (a.dataset.gateApplied === "true") return;
        a.setAttribute("href", withNext(a.getAttribute("href")));
        a.dataset.gateApplied = "true";
      });
    }
    document.dispatchEvent(
      new CustomEvent("shanzoo:authchange", {
        detail: { user: currentUser, isAuthenticated: authed }
      })
    );
  }

  // Guard: if a session exists continue, otherwise send the visitor to sign in.
  function requireAuth() {
    if (isUserAuthenticated()) return true;
    window.location.href = withNext(rootPrefix() + "pages/login.html");
    return false;
  }

  // After a successful sign-in, prefer the page the visitor came from (?next=).
  function redirectAfterAuth() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get("next");
    if (next && next.charAt(0) === "/" && next.charAt(1) !== "/") {
      try {
        window.location.href = decodeURIComponent(next);
        return;
      } catch (e) {
        /* fall through to home */
      }
    }
    goHome();
  }

  function setBusy(el, busy, label) {
    if (!el) return;
    if (busy) {
      el.dataset.originalText = el.textContent;
      el.disabled = true;
      if (label) el.textContent = label;
    } else {
      el.disabled = false;
      if (el.dataset.originalText) el.textContent = el.dataset.originalText;
    }
  }

  function collect(form) {
    var data = {};
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!el.name || el.name === "confirm") return;
      if (el.type === "checkbox") data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    return data;
  }

  /* ------------------------------- Header -------------------------------- */
  function buildUserNode(user, variant) {
    var initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    var wrap = document.createElement("div");

    /* Mobile variant: a flat account card with its own action buttons, so the
       off-canvas menu never nests a second dropdown inside itself. */
    if (variant === "mobile") {
      wrap.className = "auth-user auth-user--card";
      wrap.setAttribute("data-auth-user", "");
      wrap.innerHTML =
        '<div class="auth-user__head">' +
        '<span class="auth-user__avatar">' + esc(initial) + "</span>" +
        '<span class="auth-user__meta">' +
        '<span class="auth-user__name">' + esc(user.name || "Your account") + "</span>" +
        '<span class="auth-user__email">' + esc(user.email) + "</span>" +
        "</span></div>" +
        '<div class="auth-user__actions">' +
        '<button class="auth-user__action" type="button" data-auth-action="logout">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 17l5-5-5-5M21 12H9M12 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "Sign out</button>" +
        '<button class="auth-user__action auth-user__action--danger" type="button" data-auth-action="delete">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "Delete account</button>" +
        "</div>";

      wrap.addEventListener("click", function (e) {
        var item = e.target.closest("[data-auth-action]");
        if (!item) return;
        var action = item.getAttribute("data-auth-action");
        if (action === "logout") doLogout();
        else if (action === "delete") openDeleteModal();
      });
      return wrap;
    }

    wrap.className = "auth-user";
    wrap.setAttribute("data-auth-user", "");
    wrap.innerHTML =
      '<button class="auth-user__btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Open account menu">' +
      '<span class="auth-user__avatar">' + esc(initial) + "</span>" +
      "</button>" +
      '<div class="auth-menu" role="menu" aria-label="Account menu">' +
      '<div class="auth-menu__head">' +
      '<div class="auth-menu__name">' + esc(user.name || "Your account") + "</div>" +
      '<div class="auth-menu__email">' + esc(user.email) + "</div>" +
      "</div>" +
      '<button class="auth-menu__item" type="button" role="menuitem" data-auth-action="logout">' +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 17l5-5-5-5M21 12H9M12 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "Sign out</button>" +
      '<button class="auth-menu__item auth-menu__item--danger" type="button" role="menuitem" data-auth-action="delete">' +
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "Delete account</button>" +
      "</div>";

    var btn = wrap.querySelector(".auth-user__btn");
    var menu = wrap.querySelector(".auth-menu");
    function setOpen(open) {
      wrap.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = wrap.classList.contains("is-open");
      closeMenus(wrap);
      if (!isOpen) {
        setOpen(true);
      }
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeMenus(wrap);
        setOpen(true);
        var firstItem = menu.querySelector(".auth-menu__item");
        if (firstItem) firstItem.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        closeMenus(wrap);
        setOpen(true);
        var lastItem = menu.querySelectorAll(".auth-menu__item");
        if (lastItem.length) lastItem[lastItem.length - 1].focus();
      }
    });
    menu.addEventListener("click", function (e) {
      var item = e.target.closest("[data-auth-action]");
      if (!item) return;
      var action = item.getAttribute("data-auth-action");
      setOpen(false);
      if (action === "logout") doLogout();
      else if (action === "delete") openDeleteModal();
    });
    menu.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(menu.querySelectorAll(".auth-menu__item"));
      if (!items.length) return;
      var index = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(index + 1) % items.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(index - 1 + items.length) % items.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btn.focus();
      }
    });
    return wrap;
  }

  function closeMenus(except) {
    document.querySelectorAll(".auth-user.is-open").forEach(function (n) {
      if (n !== except) {
        n.classList.remove("is-open");
        var b = n.querySelector(".auth-user__btn");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });
  }

  function renderHeader() {
    document.querySelectorAll("[data-auth-user]").forEach(function (n) {
      n.remove();
    });
    var loginEls = document.querySelectorAll("[data-auth-login]");
    var signupEls = document.querySelectorAll("[data-auth-signup]");
    var rows = document.querySelectorAll("[data-auth-row]");

    if (currentUser) {
      loginEls.forEach(function (n) {
        n.classList.add("is-hidden");
      });
      signupEls.forEach(function (n) {
        n.classList.add("is-hidden");
      });
      rows.forEach(function (n) {
        n.classList.add("is-hidden");
      });
      var node = buildUserNode(currentUser);
      insertUser(document.querySelector(".header__actions"), node);
      insertUser(
        document.querySelector(".mobile-actions"),
        buildUserNode(currentUser, "mobile")
      );
    } else {
      loginEls.forEach(function (n) {
        n.classList.remove("is-hidden");
      });
      signupEls.forEach(function (n) {
        n.classList.remove("is-hidden");
      });
      rows.forEach(function (n) {
        n.classList.remove("is-hidden");
      });
    }

    applyAuthGates();
  }

  function insertUser(container, node) {
    if (!container) return;
    var cta = container.querySelector("[data-auth-cta]");
    if (cta) container.insertBefore(node, cta);
    else container.appendChild(node);
  }

  document.addEventListener("click", function () {
    closeMenus(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMenus(null);
      closeModal();
    }
  });

  /* ----------------------------- Refresh me ------------------------------ */
  function refreshAuth() {
    if (!apiAvailable) {
      currentUser = null;
      renderHeader();
      return Promise.resolve(null);
    }
    return request(API + "/me").then(function (res) {
      if (res.status === 0 || res.status === 404 || res.status === 405) {
        // No API on this origin (e.g. a static preview). Stop trying quietly.
        apiAvailable = false;
        currentUser = null;
      } else {
        currentUser = (res.ok && res.data && res.data.user) || null;
      }
      renderHeader();
      return currentUser;
    });
  }

  /* ------------------------------- Logout -------------------------------- */
  function doLogout() {
    return request(API + "/logout", { method: "POST" }).then(function () {
      currentUser = null;
      renderHeader();
      var card = document.querySelector(".auth__card");
      if (card) window.location.reload();
    });
  }

  /* ------------------------------ Steps UI ------------------------------- */
  function formOf(card) {
    return card ? card.querySelector('form[data-own="auth"]') : null;
  }

  function showStep(card, html) {
    var form = formOf(card);
    var foot = card.querySelector(".auth__foot");
    if (form) form.classList.add("is-hidden");
    if (foot) foot.classList.add("is-hidden");
    var existing = card.querySelector(".auth-step");
    if (existing) existing.remove();
    var step = document.createElement("div");
    step.className = "auth-step";
    step.innerHTML = html;
    card.appendChild(step);
    return step;
  }

  function closeStep(card) {
    var step = card.querySelector(".auth-step");
    if (step) step.remove();
    var form = formOf(card);
    if (form) form.classList.remove("is-hidden");
    var foot = card.querySelector(".auth__foot");
    if (foot) foot.classList.remove("is-hidden");
  }

  function statusHtml(kind, msg) {
    return '<div class="auth-status auth-status--' + kind + '">' + msg + "</div>";
  }

  function startResendCountdown(btn, seconds) {
    var remaining = seconds;
    btn.disabled = true;
    var timer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = "Resend code";
      } else {
        btn.textContent = "Resend in " + remaining + "s";
      }
    }, 1000);
  }

  function showOtpStep(card, opts) {
    var step = showStep(
      card,
      '<p class="auth-step__lead">Enter the 6-digit code we sent to <strong>' +
        esc(opts.email) +
        "</strong>. It expires in 2 minutes.</p>" +
        '<div class="field"><label for="otp-code">Verification code</label>' +
        '<input class="input otp-input" id="otp-code" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" placeholder="------" aria-describedby="otp-status"></div>' +
        '<div id="otp-status" role="status" aria-live="polite"></div>' +
        '<div class="auth-step__actions">' +
        '<button class="btn btn--primary" type="button" data-otp-verify>Verify</button>' +
        '<button class="btn btn--ghost resend-btn" type="button" data-otp-resend>Resend code</button>' +
        "</div>" +
        '<p class="auth-step__foot"><button class="linklike" type="button" data-otp-back>Use a different account</button></p>'
    );

    var input = step.querySelector("#otp-code");
    var verifyBtn = step.querySelector("[data-otp-verify]");
    var resendBtn = step.querySelector("[data-otp-resend]");
    var status = step.querySelector("#otp-status");

    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
    });
    input.focus();

    function verify() {
      var code = (input.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        status.innerHTML = statusHtml("error", "Please enter the 6-digit code.");
        return;
      }
      status.innerHTML = "";
      setBusy(verifyBtn, true, "Verifying…");
      request(opts.verifyPath, { method: "POST", body: { email: opts.email, otp: code } })
        .then(function (res) {
          if (!res.ok) {
            status.innerHTML = statusHtml("error", esc(res.message));
            setBusy(verifyBtn, false);
            return;
          }
          currentUser = (res.data && res.data.user) || null;
          renderHeader();
          status.innerHTML = statusHtml("success", "<strong>Verified.</strong> Signing you in…");
          setTimeout(redirectAfterAuth, 800);
        })
        .finally(function () {
          setBusy(verifyBtn, false);
        });
    }

    verifyBtn.addEventListener("click", verify);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        verify();
      }
    });

    resendBtn.addEventListener("click", function () {
      var purpose = opts.purpose;
      setBusy(resendBtn, true);
      request(API + "/resend-otp", { method: "POST", body: { email: opts.email, purpose: purpose } }).then(function (res) {
        status.innerHTML = statusHtml(res.ok ? "info" : "error", esc(res.message || "Please try again."));
        startResendCountdown(resendBtn, 30);
      });
    });

    step.querySelector("[data-otp-back]").addEventListener("click", function () {
      closeStep(card);
    });
  }

  /* --------------------------- Login / Signup ---------------------------- */
  function initAuthForm(form) {
    var kind = form.getAttribute("data-auth");
    var card = form.closest(".auth__card") || form.parentElement;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.submitting === "true") return;
      var valid = window.SHANZOO && window.SHANZOO.validateForm ? window.SHANZOO.validateForm(form) : true;
      if (!valid) {
        if (window.SHANZOO) window.SHANZOO.formNote(form, "warn", "<strong>Please review the highlighted fields.</strong>");
        return;
      }
      var data = collect(form);
      var btn = form.querySelector("button[type='submit']");
      setBusy(btn, true, kind === "signup" ? "Creating…" : "Signing in…");
      form.dataset.submitting = "true";

      request(form.getAttribute("data-endpoint"), { method: "POST", body: data })
        .then(function (res) {
          if (!res.ok) {
            if (window.SHANZOO) window.SHANZOO.formNote(form, "warn", "<strong>Not signed in.</strong> " + esc(res.message));
            return;
          }
          var d = res.data || {};
          if (d.requiresOtp) {
            showOtpStep(card, {
              email: d.email || data.email,
              purpose: d.purpose,
              verifyPath: d.purpose === "SIGNUP_VERIFY" ? API + "/verify-signup-otp" : API + "/verify-login-otp"
            });
          } else {
            if (window.SHANZOO) window.SHANZOO.formNote(form, "success", "<strong>Signed in.</strong> Redirecting…");
            refreshAuth().then(function () {
              redirectAfterAuth();
            });
          }
        })
        .finally(function () {
          setBusy(btn, false);
          form.dataset.submitting = "false";
        });
    });

    // Forgot password (login page only)
    var forgotBtn = card.querySelector("[data-auth-forgot]");
    if (forgotBtn) {
      forgotBtn.addEventListener("click", function () {
        startForgot(card);
      });
    }
  }

  /* ---------------------------- Forgot password -------------------------- */
  function startForgot(card) {
    var form = formOf(card);
    var emailInput = form ? form.querySelector('input[name="email"]') : null;
    var prefill = emailInput ? emailInput.value.trim() : "";

    var step = showStep(
      card,
      '<p class="auth-step__lead">Enter your account email and we will send a 6-digit reset code.</p>' +
        '<div class="field"><label for="forgot-email">Email</label>' +
        '<input class="input" id="forgot-email" type="email" autocomplete="email" placeholder="you@company.com" value="' +
        esc(prefill) +
        '"></div>' +
        '<div id="forgot-status" role="status" aria-live="polite"></div>' +
        '<div class="auth-step__actions"><button class="btn btn--primary" type="button" data-forgot-send>Send reset code</button></div>' +
        '<p class="auth-step__foot"><button class="linklike" type="button" data-forgot-back>Back to sign in</button></p>'
    );

    var input = step.querySelector("#forgot-email");
    var sendBtn = step.querySelector("[data-forgot-send]");
    var status = step.querySelector("#forgot-status");
    if (input) input.focus();

    step.querySelector("[data-forgot-back]").addEventListener("click", function () {
      closeStep(card);
    });

    sendBtn.addEventListener("click", function () {
      var email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        status.innerHTML = statusHtml("error", "Please enter a valid email address.");
        return;
      }
      status.innerHTML = "";
      setBusy(sendBtn, true, "Sending…");
      request(API + "/forgot-password", { method: "POST", body: { email: email } })
        .then(function (res) {
          status.innerHTML = statusHtml(res.ok ? "info" : "error", esc(res.message || "Please try again."));
          if (res.ok) setTimeout(function () { showResetOtp(card, email); }, 700);
        })
        .finally(function () {
          setBusy(sendBtn, false);
        });
    });
  }

  function showResetOtp(card, email) {
    var step = showStep(
      card,
      '<p class="auth-step__lead">Enter the 6-digit reset code sent to <strong>' + esc(email) + "</strong>.</p>" +
        '<div class="field"><label for="reset-otp">Reset code</label>' +
        '<input class="input otp-input" id="reset-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" placeholder="------"></div>' +
        '<div id="reset-status" role="status" aria-live="polite"></div>' +
        '<div class="auth-step__actions">' +
        '<button class="btn btn--primary" type="button" data-reset-verify>Verify code</button>' +
        '<button class="btn btn--ghost resend-btn" type="button" data-reset-resend>Resend code</button>' +
        "</div>" +
        '<p class="auth-step__foot"><button class="linklike" type="button" data-reset-back>Back</button></p>'
    );

    var input = step.querySelector("#reset-otp");
    var verifyBtn = step.querySelector("[data-reset-verify]");
    var resendBtn = step.querySelector("[data-reset-resend]");
    var status = step.querySelector("#reset-status");
    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
    });
    input.focus();

    step.querySelector("[data-reset-back]").addEventListener("click", function () {
      closeStep(card);
    });

    resendBtn.addEventListener("click", function () {
      setBusy(resendBtn, true);
      request(API + "/resend-otp", { method: "POST", body: { email: email, purpose: "PASSWORD_RESET" } }).then(function (res) {
        status.innerHTML = statusHtml(res.ok ? "info" : "error", esc(res.message || "Please try again."));
        startResendCountdown(resendBtn, 30);
      });
    });

    verifyBtn.addEventListener("click", function () {
      var code = (input.value || "").trim();
      if (!/^\d{6}$/.test(code)) {
        status.innerHTML = statusHtml("error", "Please enter the 6-digit code.");
        return;
      }
      status.innerHTML = "";
      setBusy(verifyBtn, true, "Verifying…");
      request(API + "/verify-reset-otp", { method: "POST", body: { email: email, otp: code } })
        .then(function (res) {
          if (!res.ok) {
            status.innerHTML = statusHtml("error", esc(res.message));
            return;
          }
          showNewPassword(card, email, res.data.resetToken);
        })
        .finally(function () {
          setBusy(verifyBtn, false);
        });
    });
  }

  function showNewPassword(card, email, resetToken) {
    var step = showStep(
      card,
      '<p class="auth-step__lead">Choose a new password for <strong>' + esc(email) + "</strong>.</p>" +
        '<div class="field"><label for="new-password">New password</label>' +
        '<input class="input" id="new-password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters"></div>' +
        '<div class="field"><label for="new-password2">Confirm password</label>' +
        '<input class="input" id="new-password2" type="password" autocomplete="new-password" minlength="8" placeholder="Re-enter password"></div>' +
        '<div id="newpass-status" role="status" aria-live="polite"></div>' +
        '<div class="auth-step__actions"><button class="btn btn--primary" type="button" data-newpass-save>Reset password</button></div>'
    );

    var p1 = step.querySelector("#new-password");
    var p2 = step.querySelector("#new-password2");
    var saveBtn = step.querySelector("[data-newpass-save]");
    var status = step.querySelector("#newpass-status");
    p1.focus();

    saveBtn.addEventListener("click", function () {
      var v1 = p1.value;
      var v2 = p2.value;
      if (v1.length < 8 || !/[A-Za-z]/.test(v1) || !/[0-9]/.test(v1)) {
        status.innerHTML = statusHtml("error", "Password must be at least 8 characters and include a letter and a number.");
        return;
      }
      if (v1 !== v2) {
        status.innerHTML = statusHtml("error", "Passwords do not match.");
        return;
      }
      status.innerHTML = "";
      setBusy(saveBtn, true, "Saving…");
      request(API + "/reset-password", { method: "POST", body: { email: email, resetToken: resetToken, password: v1 } })
        .then(function (res) {
          if (!res.ok) {
            status.innerHTML = statusHtml("error", esc(res.message));
            return;
          }
          status.innerHTML = statusHtml("success", "<strong>Password updated.</strong> Redirecting to sign in…");
          setTimeout(function () {
            window.location.href = rootPrefix() + "pages/login.html";
          }, 1200);
        })
        .finally(function () {
          setBusy(saveBtn, false);
        });
    });
  }

  /* --------------------------- Delete account ---------------------------- */
  var modalEl = null;
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    document.body.classList.remove("auth-modal-open");
    modalEl.innerHTML = "";
  }
  function openModal(html) {
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.className = "auth-modal";
      document.body.appendChild(modalEl);
    }
    modalEl.innerHTML = '<div class="auth-modal__card">' + html + "</div>";
    modalEl.classList.add("is-open");
    document.body.classList.add("auth-modal-open");
    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeModal();
    });
    var close = modalEl.querySelector("[data-modal-close]");
    if (close) close.addEventListener("click", closeModal);
    return modalEl;
  }

  function openDeleteModal() {
    var html =
      '<button class="auth-modal__close" type="button" data-modal-close aria-label="Close">×</button>' +
      "<h2 class=\"auth-modal__title\">Delete account</h2>" +
      '<p class="auth-modal__lead">This permanently deletes your account and data. Confirm your password to receive a verification code.</p>' +
      '<div class="field"><label for="del-password">Password</label>' +
      '<input class="input" id="del-password" type="password" autocomplete="current-password" placeholder="Your password"></div>' +
      '<div id="del-status" role="status" aria-live="polite"></div>' +
      '<div class="auth-step__actions">' +
      '<button class="btn btn--primary" type="button" data-del-request>Send code</button>' +
      '<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button></div>';
    var m = openModal(html);
    var input = m.querySelector("#del-password");
    var status = m.querySelector("#del-status");
    var btn = m.querySelector("[data-del-request]");
    input.focus();

    m.querySelectorAll("[data-modal-close]").forEach(function (b) {
      b.addEventListener("click", closeModal);
    });

    btn.addEventListener("click", function () {
      var password = input.value;
      if (!password) {
        status.innerHTML = statusHtml("error", "Please enter your password.");
        return;
      }
      status.innerHTML = "";
      setBusy(btn, true, "Sending…");
      request(API + "/request-delete-account", { method: "POST", body: { password: password } })
        .then(function (res) {
          if (!res.ok) {
            if (res.status === 401) {
              closeModal();
              refreshAuth();
              return;
            }
            status.innerHTML = statusHtml("error", esc(res.message));
            return;
          }
          showDeleteOtp(password);
        })
        .finally(function () {
          setBusy(btn, false);
        });
    });
  }

  function showDeleteOtp(password) {
    var html =
      '<button class="auth-modal__close" type="button" data-modal-close aria-label="Close">×</button>' +
      "<h2 class=\"auth-modal__title\">Confirm deletion</h2>" +
      '<p class="auth-modal__lead">Enter the 6-digit code we emailed you. This action cannot be undone.</p>' +
      '<div class="field"><label for="del-otp">Verification code</label>' +
      '<input class="input otp-input" id="del-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" placeholder="------"></div>' +
      '<div id="del-otp-status" role="status" aria-live="polite"></div>' +
      '<div class="auth-step__actions">' +
      '<button class="btn btn--primary" type="button" data-del-confirm>Delete my account</button>' +
      '<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button></div>';
    var m = openModal(html);
    var input = m.querySelector("#del-otp");
    var status = m.querySelector("#del-otp-status");
    var btn = m.querySelector("[data-del-confirm]");
    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
    });
    input.focus();
    m.querySelectorAll("[data-modal-close]").forEach(function (b) {
      b.addEventListener("click", closeModal);
    });

    btn.addEventListener("click", function () {
      var otp = (input.value || "").trim();
      if (!/^\d{6}$/.test(otp)) {
        status.innerHTML = statusHtml("error", "Please enter the 6-digit code.");
        return;
      }
      status.innerHTML = "";
      setBusy(btn, true, "Deleting…");
      request(API + "/account", { method: "DELETE", body: { otp: otp, password: password } })
        .then(function (res) {
          if (!res.ok) {
            status.innerHTML = statusHtml("error", esc(res.message));
            return;
          }
          currentUser = null;
          renderHeader();
          status.innerHTML = statusHtml("success", "<strong>Account deleted.</strong> Redirecting…");
          setTimeout(function () {
            window.location.href = rootPrefix() + "index.html";
          }, 1400);
        })
        .finally(function () {
          setBusy(btn, false);
        });
    });
  }

  /* ------------------------------- Boot ---------------------------------- */
  function markAuthPageNote() {
    // On login/signup pages, tell a signed-in visitor they are already in.
    document.querySelectorAll(".auth__card").forEach(function (card) {
      if (!formOf(card) || !currentUser) return;
      if (card.querySelector("[data-signed-in-note]")) return;
      var note = document.createElement("div");
      note.className = "auth-status auth-status--info";
      note.setAttribute("data-signed-in-note", "");
      note.innerHTML =
        "Signed in as <strong>" +
        esc(currentUser.email) +
        '</strong>. <button class="linklike" type="button" data-auth-inline-logout>Sign out</button>';
      card.insertBefore(note, card.firstChild);
      note.querySelector("[data-auth-inline-logout]").addEventListener("click", doLogout);
    });
  }

  function init() {
    document.querySelectorAll('form[data-own="auth"]').forEach(initAuthForm);
    refreshAuth().then(markAuthPageNote);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public, reusable auth API for other modules.
  window.SHANZOO = window.SHANZOO || {};
  window.SHANZOO.auth = {
    isAuthenticated: isUserAuthenticated,
    apiAvailable: function () {
      return apiAvailable;
    },
    getUser: function () {
      return currentUser;
    },
    refresh: refreshAuth,
    requireAuth: requireAuth,
    redirectAfterAuth: redirectAfterAuth
  };
})();
