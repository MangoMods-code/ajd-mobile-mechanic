/* ==========================================================================
   AJD Mobile Mechanic — Support Chat Widget (shared by all 3 mockups)
   --------------------------------------------------------------------------
   Plain-English overview:
   - A little chat bubble in the corner of the screen.
   - Click it, a chat panel opens with a friendly greeting + quick-reply buttons.
   - When the visitor types a question, we check it against a small list of
     keyword -> answer pairs ("rules"). No AI API, no cost, works offline.
   - If nothing matches, it politely says so and offers the phone number
     and the "Book Now" button.
   ========================================================================== */

(function () {
  "use strict";

  const DEFAULTS = {
    position: "right", // "right" or "left"
    businessName: "AJD Mobile Mechanic",
    phone: "(845) 898-2927",
    phoneHref: "tel:+18458982927",
    // Everything user-facing exists in English and Spanish; the page's ES/EN
    // toggle sets window.AJD_LANG and calls AJDChat.setLang(). Rule keywords
    // include both languages so typed questions match either way.
    greeting: {
      en: "Hey! I'm the AJD virtual assistant. Ask me about pricing, hours, service area, or hit a quick question below.",
      es: "¡Hola! Soy el asistente virtual de AJD. Pregúntame por precios, horarios, zona de servicio o toca una pregunta rápida."
    },
    status: { en: "Usually replies in minutes", es: "Suele responder en minutos" },
    inputPh: { en: "Type a question…", es: "Escribe una pregunta…" },
    bookBtn: { en: "Open Booking →", es: "Abrir reservas →" },
    quickReplies: {
      en: ["How much is a brake job?", "What's your service area?", "What are your hours?", "How do I book?"],
      es: ["¿Cuánto cuesta un trabajo de frenos?", "¿Cuál es su zona de servicio?", "¿Cuál es su horario?", "¿Cómo reservo?"]
    },
    // Each rule: keywords (English + Spanish) and a reply per language.
    rules: [
      {
        keywords: ["hour", "open", "close", "time", "hora", "abierto", "cierran"],
        en: "We're on call 24/7 — nights, weekends, holidays. Breakdowns don't make appointments, so neither do we.",
        es: "Estamos de guardia 24/7 — noches, fines de semana, feriados. Las averías no piden cita, así que nosotros tampoco."
      },
      {
        keywords: ["area", "location", "radius", "where", "zip", "come to", "zona", "dónde", "donde", "vienen", "área"],
        en: "We're based in Liberty, NY and cover Sullivan County and beyond — we travel to you, no matter where you're at. Send your location and we'll confirm.",
        es: "Estamos en Liberty, NY y cubrimos el Condado de Sullivan y más allá — vamos hasta ti, estés donde estés. Envía tu ubicación y te confirmamos."
      },
      {
        keywords: ["price", "cost", "how much", "quote", "precio", "cuánto", "cuanto", "costo", "cotiza"],
        en: "Every job gets a straightforward quote — call or text (845) 898-2927 with your vehicle and what's going on, and we'll give you a real number, no runaround. Or book a slot and we'll confirm everything before touching anything.",
        es: "Cada trabajo lleva una cotización clara — llama o escribe al (845) 898-2927 con tu vehículo y lo que pasa, y te damos un número real, sin vueltas. O reserva y te confirmamos todo antes de tocar nada."
      },
      {
        keywords: ["brake", "freno"],
        en: "Brake pads & rotors including a full caliper inspection — call or text for a straightforward quote on your vehicle. Want to lock in a time?",
        es: "Pastillas y rotores con inspección completa de calipers incluida — llama o escribe para una cotización clara para tu vehículo. ¿Quieres apartar un horario?"
      },
      {
        keywords: ["battery", "batería", "bateria"],
        en: "Battery testing is free on most visits, and replacements are load-tested and swapped curbside — call or text for a straightforward quote on the battery you need.",
        es: "La prueba de batería es gratis en la mayoría de visitas, y los reemplazos se prueban bajo carga y se cambian en la acera — llama o escribe para una cotización clara de la batería que necesitas."
      },
      {
        keywords: ["oil", "aceite"],
        en: "Oil & filter changes usually take 30–45 minutes, done right in your driveway — call or text for a straightforward quote.",
        es: "El cambio de aceite y filtro suele tomar 30–45 minutos, hecho en tu propia entrada — llama o escribe para una cotización clara."
      },
      {
        keywords: ["engine light", "check engine", "diagnostic", "obd", "diagnóstico", "diagnostico"],
        en: "We run a full check-engine diagnostic and give you a straightforward quote before any repair — call or text and we'll get you scheduled.",
        es: "Hacemos un diagnóstico completo de check engine y te damos una cotización clara antes de cualquier reparación — llama o escribe y te agendamos."
      },
      {
        keywords: ["alternator", "starter", "charging", "alternador", "arranque", "carga"],
        en: "We test the charging system first (so you're not paying to swap a part that isn't the issue) — call or text for a straightforward quote on alternator/starter work.",
        es: "Primero probamos el sistema de carga (para que no pagues por cambiar una pieza que no era) — llama o escribe para una cotización clara del trabajo de alternador/arranque."
      },
      {
        keywords: ["cooling", "coolant", "overheat", "radiator", "thermostat", "water pump", "temperature", "sobrecalienta", "refrigerante", "radiador", "termostato", "enfriamiento"],
        en: "Cooling system work covers radiator, thermostat, hoses, and water pump — call or text for a straightforward quote. If you're overheating, pull over and call; we come to you before it turns into a blown head gasket.",
        es: "El trabajo del sistema de enfriamiento cubre radiador, termostato, mangueras y bomba de agua — llama o escribe para una cotización clara. Si se está sobrecalentando, oríllate y llama; vamos hasta ti antes de que se convierta en un empaque de culata quemado."
      },
      {
        keywords: ["book", "appointment", "schedule", "reserve", "reserv", "cita", "agendar"],
        en: "Easiest way is the Book Now button — pick your service, describe the issue, and grab an open time slot. Want me to open it for you?",
        es: "Lo más fácil es el botón de reservas — elige tu servicio, describe el problema y aparta un horario libre. ¿Te lo abro?",
        showBookButton: true
      },
      {
        keywords: ["call", "phone", "text", "number", "llamar", "teléfono", "telefono", "número", "numero", "mensaje"],
        en: "You can reach us directly at (845) 898-2927 — call or text, whichever's easier.",
        es: "Nos encuentras directo al (845) 898-2927 — llamada o mensaje, lo que te quede más fácil."
      },
      {
        keywords: ["warranty", "guarantee", "garantía", "garantia"],
        en: "Call or text (845) 898-2927 and we'll walk you through exactly how we stand behind the work before you book anything.",
        es: "Llama o manda mensaje al (845) 898-2927 y te explicamos exactamente cómo respaldamos el trabajo antes de reservar."
      },
      {
        keywords: ["certif", "ase", "license", "insured", "bonded", "licencia", "asegurado"],
        en: "AJD Mobile Mechanic LLC is a registered New York business, owner-run out of Liberty. Honest, reliable, affordable is the whole pitch — ask us anything before you book.",
        es: "AJD Mobile Mechanic LLC es un negocio registrado en Nueva York, manejado por su dueño desde Liberty. Honesto, confiable, económico — ese es todo el discurso. Pregúntanos lo que quieras."
      }
    ],
    fallback: {
      en: "I don't have an exact answer for that, but a real person can — call/text {PHONE} or book a slot and describe it there.",
      es: "No tengo una respuesta exacta para eso, pero una persona real sí — llama o manda mensaje al {PHONE}, o reserva y descríbelo ahí."
    }
  };

  let cfg = {};
  let messages = [];

  function lang() { return window.AJD_LANG === "es" ? "es" : "en"; }
  function pick(v) { return (v && typeof v === "object" && !Array.isArray(v)) ? (v[lang()] || v.en) : v; }

  function findReply(userText) {
    const text = userText.toLowerCase();
    for (const rule of cfg.rules) {
      if (rule.keywords.some((k) => text.includes(k))) {
        return { reply: rule[lang()] || rule.en || rule.reply, showBookButton: !!rule.showBookButton };
      }
    }
    return { reply: pick(cfg.fallback).replace("{PHONE}", cfg.phone), showBookButton: false };
  }

  function buildWidget() {
    const wrap = document.createElement("div");
    wrap.id = "ajd-chat-widget";
    wrap.className = "ajd-chat-wrap ajd-chat-pos-" + cfg.position;
    wrap.innerHTML = `
      <button type="button" class="ajd-chat-bubble" aria-label="Open support chat">
        <svg class="ajd-chat-icon-open" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
        <svg class="ajd-chat-icon-close" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="ajd-chat-panel" aria-hidden="true">
        <div class="ajd-chat-header">
          <div>
            <strong>${cfg.businessName}</strong>
            <span class="ajd-chat-status"><span class="ajd-chat-dot"></span> ${pick(cfg.status)}</span>
          </div>
        </div>
        <div class="ajd-chat-messages"></div>
        <div class="ajd-chat-quick"></div>
        <form class="ajd-chat-form">
          <input class="ajd-chat-input" type="text" placeholder="${pick(cfg.inputPh)}" autocomplete="off">
          <button type="submit" class="ajd-chat-send" aria-label="Send">→</button>
        </form>
      </div>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  function addMessage(text, from, opts) {
    opts = opts || {};
    messages.push({ text, from });
    const list = document.querySelector(".ajd-chat-messages");
    const bubble = document.createElement("div");
    bubble.className = "ajd-chat-bubble-msg ajd-chat-from-" + from;
    bubble.textContent = text;
    list.appendChild(bubble);

    if (opts.showBookButton) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ajd-chat-inline-book";
      btn.textContent = pick(cfg.bookBtn);
      btn.addEventListener("click", () => {
        if (window.AJDBooking) window.AJDBooking.open();
      });
      list.appendChild(btn);
    }

    list.scrollTop = list.scrollHeight;
  }

  function renderQuickReplies() {
    const qWrap = document.querySelector(".ajd-chat-quick");
    qWrap.innerHTML = "";
    pick(cfg.quickReplies).forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ajd-chat-quick-btn";
      btn.textContent = q;
      btn.addEventListener("click", () => handleUserMessage(q));
      qWrap.appendChild(btn);
    });
  }

  function handleUserMessage(text) {
    if (!text.trim()) return;
    addMessage(text, "user");
    const { reply, showBookButton } = findReply(text);
    // tiny delay so it feels like a real reply, not an instant canned dump
    setTimeout(() => addMessage(reply, "bot", { showBookButton }), 350);
  }

  function toggleOpen() {
    const wrap = document.getElementById("ajd-chat-widget");
    const panel = wrap.querySelector(".ajd-chat-panel");
    const isOpen = wrap.classList.toggle("is-open");
    panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function init(userConfig) {
    cfg = Object.assign({}, DEFAULTS, userConfig || {});
    if (userConfig && userConfig.rules) {
      cfg.rules = userConfig.rules; // full override if provided
    }
    const wrap = buildWidget();

    wrap.querySelector(".ajd-chat-bubble").addEventListener("click", toggleOpen);

    addMessage(pick(cfg.greeting), "bot");
    renderQuickReplies();

    const form = wrap.querySelector(".ajd-chat-form");
    const input = wrap.querySelector(".ajd-chat-input");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value;
      input.value = "";
      handleUserMessage(val);
    });
  }

  // Called by the page's ES/EN toggle: restart the conversation in the new
  // language (old bubbles would be a confusing mixed-language transcript).
  function setLang() {
    const wrap = document.getElementById("ajd-chat-widget");
    if (!wrap) return;
    messages = [];
    wrap.querySelector(".ajd-chat-messages").innerHTML = "";
    wrap.querySelector(".ajd-chat-status").innerHTML = '<span class="ajd-chat-dot"></span> ' + pick(cfg.status);
    wrap.querySelector(".ajd-chat-input").placeholder = pick(cfg.inputPh);
    addMessage(pick(cfg.greeting), "bot");
    renderQuickReplies();
  }

  window.AJDChat = { init, setLang };
})();
