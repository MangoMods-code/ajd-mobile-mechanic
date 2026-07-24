/* ==========================================================================
   AJD Mobile Mechanic — Tap-to-Call Contact Button (shared by all 3 mockups)
   --------------------------------------------------------------------------
   Plain-English overview:
   - A round floating button (opposite corner from the chat bubble).
   - Tap it, it "unfolds" into a small stack of buttons: Call, Text, Email,
     and Service Area — each one is a real link (tel:, sms:, mailto:).
   ========================================================================== */

(function () {
  "use strict";

  const DEFAULTS = {
    position: "left", // opposite side from the chat widget by default
    phoneDisplay: "(845) 720-2863",
    phoneHref: "tel:+18457202863",
    smsHref: "sms:+18457202863",
    email: "", // no public email yet — leave blank to hide the option
    facebookHref: "https://www.facebook.com/p/AJD-Mobile-Mechanic-61581121402634/",
    i18n: {
      en: { call: "Call", text: "Text Us", email: "Email Us", area: "Liberty, NY — we travel to you" },
      es: { call: "Llamar", text: "Envíanos mensaje", email: "Escríbenos", area: "Liberty, NY — vamos hasta ti" }
    }
  };

  let cfg = {};

  function lang() { return window.AJD_LANG === "es" ? "es" : "en"; }

  function optionsHTML() {
    const L = cfg.i18n[lang()] || cfg.i18n.en;
    return `
        <a class="ajd-fab-option" href="${cfg.phoneHref}">
          <span class="ajd-fab-opt-icon">☎</span> ${L.call} ${cfg.phoneDisplay}
        </a>
        <a class="ajd-fab-option" href="${cfg.smsHref}">
          <span class="ajd-fab-opt-icon">✉</span> ${L.text}
        </a>
        ${cfg.email ? `<a class="ajd-fab-option" href="mailto:${cfg.email}">
          <span class="ajd-fab-opt-icon">@</span> ${L.email}
        </a>` : ""}
        ${cfg.facebookHref ? `<a class="ajd-fab-option" href="${cfg.facebookHref}" target="_blank" rel="noopener">
          <span class="ajd-fab-opt-icon">f</span> Facebook
        </a>` : ""}
        <div class="ajd-fab-option ajd-fab-option-static">
          <span class="ajd-fab-opt-icon">📍</span> ${L.area}
        </div>`;
  }

  function buildFab() {
    const wrap = document.createElement("div");
    wrap.id = "ajd-contact-fab";
    wrap.className = "ajd-fab-wrap ajd-fab-pos-" + cfg.position;
    wrap.innerHTML = `
      <div class="ajd-fab-options" aria-hidden="true">${optionsHTML()}</div>
      <button type="button" class="ajd-fab-toggle" aria-label="Contact options">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.902.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
      </button>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  // Called by the page's ES/EN toggle — the option links carry no JS
  // listeners, so swapping their markup is safe.
  function setLang() {
    const wrap = document.getElementById("ajd-contact-fab");
    if (wrap) wrap.querySelector(".ajd-fab-options").innerHTML = optionsHTML();
  }

  function init(userConfig) {
    cfg = Object.assign({}, DEFAULTS, userConfig || {});
    const wrap = buildFab();
    const toggle = wrap.querySelector(".ajd-fab-toggle");
    const options = wrap.querySelector(".ajd-fab-options");
    toggle.addEventListener("click", () => {
      const isOpen = wrap.classList.toggle("is-open");
      options.setAttribute("aria-hidden", isOpen ? "false" : "true");
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove("is-open");
        options.setAttribute("aria-hidden", "true");
      }
    });
  }

  window.AJDContactFab = { init, setLang };
})();
