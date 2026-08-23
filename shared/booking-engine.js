/* ==========================================================================
   AJD Mobile Mechanic — Booking Engine (shared by all 3 mockups)
   --------------------------------------------------------------------------
   Plain-English overview:
   - This file draws a popup ("modal") with a 5-step form.
   - Step 1: what service + what car
   - Step 2: what's wrong + where the car is
   - Step 3: pick a real open date & time slot
   - Step 4: contact info
   - Step 5: review + confirm
   - When someone books a slot, we save it in the browser's "localStorage"
     (a little storage box built into every browser) so that slot shows as
     taken next time — for ANYONE using that same browser/device.
   - IMPORTANT: localStorage only lives in one browser on one device. This
     is great for a demo/mockup. For the real live site, the bookings
     should eventually be saved to a real database so all visitors, on any
     device, see the same taken slots. That's a "phase 2" upgrade.
   ========================================================================== */

(function () {
  "use strict";

  // ---- Configuration you can tweak per mockup --------------------------
  const DEFAULTS = {
    triggerSelector: "[data-open-booking]", // any element with this attribute opens the modal
    storageKey: "ajd_bookings",             // where finished bookings are stored
    slotsKey: "ajd_taken_slots",            // where "taken" date+time combos are stored
    businessName: "AJD Mobile Mechanic",
    phone: "(845) 898-2927",
    // Where finished bookings get sent so they reach the owner. Both optional,
    // set from index.html via window.AJD_CONFIG:
    //  - endpoint: a Formspree URL → email record of every booking
    //  - ntfyTopic: an ntfy.sh topic name → instant push notification on the
    //    owner's phone (free ntfy app, no account), reads like a text message
    // Both empty = demo mode: booking saves locally, nothing is sent.
    endpoint: "",
    ntfyTopic: "",
    daysAhead: 14,                          // how many days forward to show
    closedDays: [],                         // open 24/7 — no closed days
    timeSlots: ["8:00 AM", "9:30 AM", "11:00 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM", "7:00 PM"],
    services: [
      "Oil & Filter Change",
      "Brake Pads & Rotors",
      "Battery Testing & Swap",
      "Check-Engine Diagnostics",
      "Alternator & Starter",
      "Cooling System & Overheating",
      "Something Else / Not Sure"
    ]
  };

  let cfg = {};
  let state = {};

  // Escape user-typed text before it goes into innerHTML, so quotes and
  // angle brackets can't break the form markup (or run as script).
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  // Which fields must be filled before "Next" unlocks, per step.
  function stepIsValid() {
    if (state.step === 1) return !!state.service;
    if (state.step === 3) return !!(state.date && state.time);
    if (state.step === 4) return !!(state.name.trim() && state.phone.trim());
    return true;
  }

  // ---- Language (the page sets window.AJD_LANG via its ES/EN toggle) -----
  function lang() { return window.AJD_LANG === "es" ? "es" : "en"; }
  function t(key) {
    const set = STRINGS[lang()] || STRINGS.en;
    return set[key] != null ? set[key] : STRINGS.en[key];
  }
  const STRINGS = {
    en: {
      step1Title: "What does your car need?", service: "Service", selectService: "Select a service…",
      year: "Year", make: "Make", model: "Model",
      pickYearMake: "Pick year & make first", loadingModels: "Loading models…", otherNotListed: "Other / not listed",
      typeMake: "Type the make", typeModel: "Type the model",
      next: "Next →", back: "← Back", review: "Review →",
      step2Title: "Tell us what's going on", issueLabel: "Describe the issue",
      issuePh: "Grinding noise when braking, check-engine light on, won't start...",
      locLabel: "Where's the car? (address or cross streets)",
      locPh: "123 Ridgeline Dr, or 'Work parking lot, corner of 5th & Main'",
      step3Title: "Pick a date & time", pickDateHint: "Pick a date above to see open times.",
      nightHint: "Broken down right now? We run 24/7 — call or text ", bookedSuffix: " — Booked",
      step4Title: "How should we reach you?", nameLabel: "Full name", namePh: "Jane Smith",
      phoneLabel: "Phone number", emailLabel: "Email (optional)", emailPh: "jane@email.com",
      step5Title: "Confirm your appointment",
      sService: "Service", sVehicle: "Vehicle", sIssue: "Issue", sLocation: "Location", sWhen: "When", sContact: "Contact",
      confirm: "Confirm Booking ✓", sending: "Sending…", at: " at ",
      successTitle: "You're booked!", confirmation: "Confirmation", successNote: " — we'll confirm by call or text.",
      sendFailed1: "Heads up — our notifier hiccuped sending this one. Call or text ", sendFailed2: " to make sure we saw it.",
      change1: "Need to change something? Call or text ", addCal: "Add to calendar", done: "Done"
    },
    es: {
      step1Title: "¿Qué necesita tu auto?", service: "Servicio", selectService: "Elige un servicio…",
      year: "Año", make: "Marca", model: "Modelo",
      pickYearMake: "Elige año y marca primero", loadingModels: "Cargando modelos…", otherNotListed: "Otro / no está en la lista",
      typeMake: "Escribe la marca", typeModel: "Escribe el modelo",
      next: "Siguiente →", back: "← Atrás", review: "Revisar →",
      step2Title: "Cuéntanos qué pasa", issueLabel: "Describe el problema",
      issuePh: "Ruido al frenar, luz de check engine, no arranca...",
      locLabel: "¿Dónde está el auto? (dirección o cruce de calles)",
      locPh: "123 Ridgeline Dr, o 'estacionamiento del trabajo, 5ta y Main'",
      step3Title: "Elige fecha y hora", pickDateHint: "Elige una fecha arriba para ver horarios.",
      nightHint: "¿Averiado ahora mismo? Trabajamos 24/7 — llama o manda mensaje al ", bookedSuffix: " — Lleno",
      step4Title: "¿Cómo te contactamos?", nameLabel: "Nombre completo", namePh: "Juana Pérez",
      phoneLabel: "Teléfono", emailLabel: "Correo (opcional)", emailPh: "juana@email.com",
      step5Title: "Confirma tu cita",
      sService: "Servicio", sVehicle: "Vehículo", sIssue: "Problema", sLocation: "Ubicación", sWhen: "Cuándo", sContact: "Contacto",
      confirm: "Confirmar cita ✓", sending: "Enviando…", at: " a las ",
      successTitle: "¡Cita confirmada!", confirmation: "Confirmación", successNote: " — te confirmamos por llamada o mensaje.",
      sendFailed1: "Aviso — falló el envío de la notificación de esta reserva. Llama o manda mensaje al ", sendFailed2: " para asegurar que la vimos.",
      change1: "¿Necesitas cambiar algo? Llama o manda mensaje al ", addCal: "Añadir al calendario", done: "Listo"
    }
  };

  // ---- Vehicle picker ----------------------------------------------------
  // Curated make list renders instantly and works offline; the model list
  // comes from the free NHTSA vPIC API (no key), with a typed-input fallback
  // so the form never dead-ends if the API is down.
  const MAKES = ["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Fiat","Ford","Genesis","GMC","Honda","Hyundai","Infiniti","Jaguar","Jeep","Kia","Land Rover","Lexus","Lincoln","Mazda","Mercedes-Benz","Mini","Mitsubishi","Nissan","Pontiac","Porsche","Ram","Saab","Saturn","Scion","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo"];
  const OTHER = "__other";
  const modelsCache = {};
  function fetchModels(make, year) {
    const key = make + "|" + year;
    if (modelsCache[key]) return Promise.resolve(modelsCache[key]);
    return fetch("https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/"
        + encodeURIComponent(make) + "/modelyear/" + encodeURIComponent(year) + "?format=json")
      .then((r) => r.json())
      .then((d) => {
        const names = Array.from(new Set((d.Results || []).map((x) => x.Model_Name))).sort();
        modelsCache[key] = names;
        return names;
      });
  }

  // ---- "Add to calendar" (.ics) -------------------------------------------
  function downloadICS() {
    const p = state.date.split("-").map(Number);
    const tm = state.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hh = Number(tm[1]) % 12;
    if (/pm/i.test(tm[3])) hh += 12;
    const start = new Date(p[0], p[1] - 1, p[2], hh, Number(tm[2]));
    const end = new Date(start.getTime() + 90 * 60000);
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
    const escT = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AJD Mobile Mechanic//Booking//EN", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@ajdmobilemechanic.com",
      "DTSTAMP:" + fmt(new Date()),
      "DTSTART:" + fmt(start),
      "DTEND:" + fmt(end),
      "SUMMARY:" + escT("AJD Mobile Mechanic — " + state.service),
      "DESCRIPTION:" + escT((state.issue ? state.issue + " · " : "") + "Questions? " + cfg.phone),
      "LOCATION:" + escT(state.location),
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "ajd-appointment.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function resetState() {
    state = {
      step: 1,
      service: "",
      year: "",
      make: "",
      model: "",
      issue: "",
      location: "",
      date: "",
      time: "",
      name: "",
      phone: "",
      email: "",
      sendFailed: false
    };
  }

  // Send the finished booking to the owner over every configured channel:
  // ntfy push (instant phone notification) and/or Formspree (email record).
  // Marks sendFailed only if EVERY channel fails — and always resolves, since
  // a delivery hiccup must never eat a customer's booking.
  function sendToOwner(booking) {
    const vehicle = (booking.year + " " + booking.make + " " + booking.model).trim();
    const when = formatDateHuman(booking.date) + " at " + booking.time;
    const sends = [];

    if (cfg.ntfyTopic) {
      sends.push(fetch("https://ntfy.sh/" + encodeURIComponent(cfg.ntfyTopic), {
        method: "POST",
        headers: {
          // header values must stay plain ASCII — no fancy dashes
          "Title": "NEW BOOKING - " + booking.service,
          "Priority": "high",
          "Tags": "wrench"
        },
        body: when + "\n"
            + booking.name + " - " + booking.phone + "\n"
            + (vehicle ? vehicle + "\n" : "")
            + (booking.issue ? "Issue: " + booking.issue + "\n" : "")
            + (booking.location ? "Where: " + booking.location : "")
      }).then((r) => { if (!r.ok) throw new Error("ntfy " + r.status); }));
    }

    if (cfg.endpoint) {
      sends.push(fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: "NEW BOOKING — " + booking.service + " · " + when,
          service: booking.service,
          vehicle: vehicle,
          issue: booking.issue,
          location: booking.location,
          when: when,
          name: booking.name,
          phone: booking.phone,
          email: booking.email
        })
      }).then((r) => { if (!r.ok) throw new Error("formspree " + r.status); }));
    }

    if (!sends.length) return Promise.resolve();
    return Promise.allSettled(sends).then((results) => {
      state.sendFailed = !results.some((r) => r.status === "fulfilled");
    });
  }

  // ---- localStorage helpers ---------------------------------------------
  function getTakenSlots() {
    try {
      return JSON.parse(localStorage.getItem(cfg.slotsKey)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveTakenSlot(dateStr, timeStr) {
    const taken = getTakenSlots();
    if (!taken[dateStr]) taken[dateStr] = [];
    taken[dateStr].push(timeStr);
    localStorage.setItem(cfg.slotsKey, JSON.stringify(taken));
  }

  function saveBooking(booking) {
    let all = [];
    try {
      all = JSON.parse(localStorage.getItem(cfg.storageKey)) || [];
    } catch (e) {
      all = [];
    }
    all.push(booking);
    localStorage.setItem(cfg.storageKey, JSON.stringify(all));
  }

  // ---- Date helpers -------------------------------------------------------
  function buildUpcomingDates() {
    const dates = [];
    const today = new Date();
    let i = 0;
    while (dates.length < cfg.daysAhead) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      i++;
      if (cfg.closedDays.includes(d.getDay())) continue;
      dates.push(d);
    }
    return dates;
  }

  function formatDateKey(d) {
    // Local date, NOT toISOString() — UTC keys shift to tomorrow's date
    // in the evening for anyone west of Greenwich (i.e. all US customers).
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function formatDateLabel(d) {
    return d.toLocaleDateString(lang() === "es" ? "es" : undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  // Turn a stored "YYYY-MM-DD" key back into a human date for the summary.
  function formatDateHuman(key) {
    if (!key) return "—";
    const parts = key.split("-").map(Number);
    return formatDateLabel(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  // ---- Modal markup --------------------------------------------------------
  function buildModalSkeleton() {
    const wrap = document.createElement("div");
    wrap.id = "ajd-booking-modal";
    wrap.className = "ajd-bk-overlay";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <div class="ajd-bk-modal" role="dialog" aria-modal="true" aria-label="Book an appointment">
        <button type="button" class="ajd-bk-close" aria-label="Close booking form">&times;</button>
        <div class="ajd-bk-progress">
          <span class="ajd-bk-dot" data-dot="1"></span>
          <span class="ajd-bk-dot" data-dot="2"></span>
          <span class="ajd-bk-dot" data-dot="3"></span>
          <span class="ajd-bk-dot" data-dot="4"></span>
          <span class="ajd-bk-dot" data-dot="5"></span>
        </div>
        <div class="ajd-bk-body"></div>
      </div>
    `;
    document.body.appendChild(wrap);

    // Bind close behaviors ONCE here — binding them in openModal stacked a
    // duplicate listener every time the modal was reopened.
    wrap.querySelector(".ajd-bk-close").addEventListener("click", closeModal);
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wrap.classList.contains("is-open")) closeModal();
    });

    return wrap;
  }

  function renderStep() {
    const modal = document.getElementById("ajd-booking-modal");
    const body = modal.querySelector(".ajd-bk-body");
    modal.querySelectorAll(".ajd-bk-dot").forEach((dot) => {
      const n = Number(dot.dataset.dot);
      dot.classList.toggle("is-active", n === state.step);
      dot.classList.toggle("is-done", n < state.step);
    });

    let html = "";

    if (state.step === 1) {
      const yearNow = new Date().getFullYear();
      let yearOpts = `<option value="">${t("year")}…</option>`;
      for (let y = yearNow + 1; y >= 1990; y--) {
        yearOpts += `<option value="${y}" ${String(state.year) === String(y) ? "selected" : ""}>${y}</option>`;
      }
      const makeIsCustom = state.make && MAKES.indexOf(state.make) === -1;
      const makeOpts = `<option value="">${t("make")}…</option>`
        + MAKES.map((m) => `<option value="${esc(m)}" ${state.make === m ? "selected" : ""}>${esc(m)}</option>`).join("")
        + `<option value="${OTHER}" ${makeIsCustom ? "selected" : ""}>${t("otherNotListed")}</option>`;
      html = `
        <h3>${t("step1Title")}</h3>
        <label class="ajd-bk-label">${t("service")}</label>
        <select class="ajd-bk-input" data-field="service">
          <option value="">${t("selectService")}</option>
          ${cfg.services.map((s) => `<option value="${esc(s)}" ${state.service === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
        </select>
        <div class="ajd-bk-row">
          <div>
            <label class="ajd-bk-label">${t("year")}</label>
            <select class="ajd-bk-input" data-field="year">${yearOpts}</select>
          </div>
          <div>
            <label class="ajd-bk-label">${t("make")}</label>
            <select class="ajd-bk-input" id="ajd-bk-make">${makeOpts}</select>
          </div>
          <div>
            <label class="ajd-bk-label">${t("model")}</label>
            <span id="ajd-bk-model-slot"></span>
          </div>
        </div>
        ${makeIsCustom ? `<label class="ajd-bk-label">${t("typeMake")}</label><input class="ajd-bk-input" data-field="make" type="text" placeholder="${t("typeMake")}" value="${esc(state.make)}">` : ""}
        <div class="ajd-bk-actions">
          <span></span>
          <button type="button" class="ajd-bk-next" ${stepIsValid() ? "" : "disabled"}>${t("next")}</button>
        </div>
      `;
    } else if (state.step === 2) {
      html = `
        <h3>${t("step2Title")}</h3>
        <label class="ajd-bk-label">${t("issueLabel")}</label>
        <textarea class="ajd-bk-input" data-field="issue" rows="3" placeholder="${t("issuePh")}">${esc(state.issue)}</textarea>
        <label class="ajd-bk-label">${t("locLabel")}</label>
        <input class="ajd-bk-input" data-field="location" type="text" placeholder="${t("locPh")}" value="${esc(state.location)}">
        <div class="ajd-bk-actions">
          <button type="button" class="ajd-bk-back">${t("back")}</button>
          <button type="button" class="ajd-bk-next">${t("next")}</button>
        </div>
      `;
    } else if (state.step === 3) {
      const dates = buildUpcomingDates();
      const taken = getTakenSlots();
      html = `
        <h3>${t("step3Title")}</h3>
        <div class="ajd-bk-dates">
          ${dates
            .map((d) => {
              const key = formatDateKey(d);
              const isSelected = state.date === key;
              return `<button type="button" class="ajd-bk-date-pill ${isSelected ? "is-selected" : ""}" data-date="${key}">${formatDateLabel(d)}</button>`;
            })
            .join("")}
        </div>
        <div class="ajd-bk-times">
          ${
            state.date
              ? cfg.timeSlots
                  .map((tSlot) => {
                    const isTaken = (taken[state.date] || []).includes(tSlot);
                    const isSelected = state.time === tSlot;
                    return `<button type="button" class="ajd-bk-time-pill ${isSelected ? "is-selected" : ""}" ${isTaken ? "disabled" : ""} data-time="${tSlot}">${tSlot}${isTaken ? t("bookedSuffix") : ""}</button>`;
                  })
                  .join("")
              : `<p class="ajd-bk-hint">${t("pickDateHint")}</p>`
          }
        </div>
        <p class="ajd-bk-hint" style="margin-top:14px;">${t("nightHint")}${esc(cfg.phone)}.</p>
        <div class="ajd-bk-actions">
          <button type="button" class="ajd-bk-back">${t("back")}</button>
          <button type="button" class="ajd-bk-next" ${stepIsValid() ? "" : "disabled"}>${t("next")}</button>
        </div>
      `;
    } else if (state.step === 4) {
      html = `
        <h3>${t("step4Title")}</h3>
        <label class="ajd-bk-label">${t("nameLabel")}</label>
        <input class="ajd-bk-input" data-field="name" type="text" placeholder="${t("namePh")}" value="${esc(state.name)}">
        <label class="ajd-bk-label">${t("phoneLabel")}</label>
        <input class="ajd-bk-input" data-field="phone" type="tel" placeholder="${esc(cfg.phone)}" value="${esc(state.phone)}">
        <label class="ajd-bk-label">${t("emailLabel")}</label>
        <input class="ajd-bk-input" data-field="email" type="email" placeholder="${t("emailPh")}" value="${esc(state.email)}">
        <div class="ajd-bk-actions">
          <button type="button" class="ajd-bk-back">${t("back")}</button>
          <button type="button" class="ajd-bk-next" ${stepIsValid() ? "" : "disabled"}>${t("review")}</button>
        </div>
      `;
    } else if (state.step === 5) {
      html = `
        <h3>${t("step5Title")}</h3>
        <div class="ajd-bk-summary">
          <div><span>${t("sService")}</span><strong>${esc(state.service) || "—"}</strong></div>
          <div><span>${t("sVehicle")}</span><strong>${esc((state.year + " " + state.make + " " + state.model).trim()) || "—"}</strong></div>
          <div><span>${t("sIssue")}</span><strong>${esc(state.issue) || "—"}</strong></div>
          <div><span>${t("sLocation")}</span><strong>${esc(state.location) || "—"}</strong></div>
          <div><span>${t("sWhen")}</span><strong>${formatDateHuman(state.date)}${t("at")}${esc(state.time)}</strong></div>
          <div><span>${t("sContact")}</span><strong>${esc(state.name)} · ${esc(state.phone)}</strong></div>
        </div>
        <div class="ajd-bk-actions">
          <button type="button" class="ajd-bk-back">${t("back")}</button>
          <button type="button" class="ajd-bk-confirm">${t("confirm")}</button>
        </div>
      `;
    } else if (state.step === "success") {
      const confNum = "AJD-" + Math.floor(100000 + Math.random() * 900000);
      html = `
        <div class="ajd-bk-success">
          <div class="ajd-bk-check">✓</div>
          <h3>${t("successTitle")}</h3>
          <p>${t("confirmation")} <strong>${confNum}</strong><br>
          ${formatDateHuman(state.date)}${t("at")}${esc(state.time)}${t("successNote")}</p>
          ${state.sendFailed ? `<p class="ajd-bk-hint" style="color:#E5484D;">${t("sendFailed1")}${esc(cfg.phone)}${t("sendFailed2")}</p>` : ""}
          <p class="ajd-bk-hint">${t("change1")}${esc(cfg.phone)}.</p>
          <button type="button" class="ajd-bk-cal">📅 ${t("addCal")}</button>
          <button type="button" class="ajd-bk-close2">${t("done")}</button>
        </div>
      `;
    }

    body.innerHTML = html;
    wireStepEvents(modal, body);
  }

  function wireStepEvents(modal, body) {
    // Text/select inputs update state as you type, and re-check whether
    // this step's "Next" button should unlock. (Without this, the button
    // stayed disabled forever and nobody could finish a booking.)
    function syncField(el) {
      state[el.dataset.field] = el.value;
      const next = body.querySelector(".ajd-bk-next");
      if (next) next.disabled = !stepIsValid();
    }
    body.querySelectorAll("[data-field]").forEach((el) => {
      el.addEventListener("input", () => syncField(el));
      el.addEventListener("change", () => syncField(el)); // covers <select> in older browsers
    });

    // Step 1: the year/make/model picker. Make + year are instant local
    // selects; the model list loads from NHTSA, falling back to a plain
    // text input if the API is unreachable or the make isn't listed.
    const makeSel = body.querySelector("#ajd-bk-make");
    if (makeSel) {
      const modelSlot = body.querySelector("#ajd-bk-model-slot");
      const bindField = (el) => {
        el.addEventListener("input", () => syncField(el));
        el.addEventListener("change", () => syncField(el));
      };
      const textInput = (field, ph, val) => {
        const inp = document.createElement("input");
        inp.className = "ajd-bk-input";
        inp.type = "text";
        inp.dataset.field = field;
        inp.placeholder = ph;
        inp.value = val || "";
        bindField(inp);
        return inp;
      };
      function renderModelSlot() {
        modelSlot.innerHTML = "";
        const mk = makeSel.value;
        if (mk === OTHER) {
          modelSlot.appendChild(textInput("model", t("typeModel"), state.model));
          return;
        }
        if (!mk || !state.year) {
          const sel = document.createElement("select");
          sel.className = "ajd-bk-input";
          sel.disabled = true;
          sel.innerHTML = `<option>${t("pickYearMake")}</option>`;
          modelSlot.appendChild(sel);
          return;
        }
        const loading = document.createElement("select");
        loading.className = "ajd-bk-input";
        loading.disabled = true;
        loading.innerHTML = `<option>${t("loadingModels")}</option>`;
        modelSlot.appendChild(loading);
        fetchModels(mk, state.year)
          .then((models) => {
            if (makeSel.value !== mk || !modelSlot.contains(loading)) return;
            if (!models.length) throw new Error("no models");
            const sel = document.createElement("select");
            sel.className = "ajd-bk-input";
            sel.dataset.field = "model";
            sel.innerHTML = `<option value="">${t("model")}…</option>`
              + models.map((m) => `<option value="${esc(m)}" ${state.model === m ? "selected" : ""}>${esc(m)}</option>`).join("")
              + `<option value="${OTHER}">${t("otherNotListed")}</option>`;
            sel.addEventListener("change", () => {
              if (sel.value === OTHER) {
                state.model = "";
                modelSlot.innerHTML = "";
                const inp = textInput("model", t("typeModel"), "");
                modelSlot.appendChild(inp);
                inp.focus();
              } else {
                syncField(sel);
              }
            });
            modelSlot.innerHTML = "";
            modelSlot.appendChild(sel);
          })
          .catch(() => {
            if (makeSel.value !== mk) return;
            modelSlot.innerHTML = "";
            modelSlot.appendChild(textInput("model", t("typeModel"), state.model));
          });
      }
      makeSel.addEventListener("change", () => {
        state.model = "";
        const existing = body.querySelector('input[data-field="make"]');
        if (existing) { existing.previousElementSibling.remove(); existing.remove(); }
        if (makeSel.value === OTHER) {
          state.make = "";
          const lab = document.createElement("label");
          lab.className = "ajd-bk-label";
          lab.textContent = t("typeMake");
          const inp = textInput("make", t("typeMake"), "");
          body.querySelector(".ajd-bk-row").after(lab, inp);
          inp.focus();
        } else {
          state.make = makeSel.value;
        }
        renderModelSlot();
      });
      const yearSel = body.querySelector('select[data-field="year"]');
      if (yearSel) yearSel.addEventListener("change", () => { state.model = ""; renderModelSlot(); });
      renderModelSlot();
    }

    const nextBtn = body.querySelector(".ajd-bk-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        state.step += 1;
        renderStep();
      });
    }
    const backBtn = body.querySelector(".ajd-bk-back");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        state.step -= 1;
        renderStep();
      });
    }
    const confirmBtn = body.querySelector(".ajd-bk-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const booking = { ...state, bookedAt: new Date().toISOString() };
        saveTakenSlot(state.date, state.time);
        saveBooking(booking);
        confirmBtn.disabled = true;
        confirmBtn.textContent = t("sending");
        sendToOwner(booking).then(() => {
          state.step = "success";
          renderStep();
        });
      });
    }
    const closeBtn2 = body.querySelector(".ajd-bk-close2");
    if (closeBtn2) {
      closeBtn2.addEventListener("click", closeModal);
    }
    const calBtn = body.querySelector(".ajd-bk-cal");
    if (calBtn) {
      calBtn.addEventListener("click", downloadICS);
    }

    // date pills
    body.querySelectorAll(".ajd-bk-date-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        state.date = pill.dataset.date;
        state.time = ""; // reset time when date changes
        renderStep();
      });
    });
    // time pills
    body.querySelectorAll(".ajd-bk-time-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        if (pill.disabled) return;
        state.time = pill.dataset.time;
        renderStep();
      });
    });
  }

  function openModal(presetService) {
    resetState();
    if (presetService) state.service = presetService;
    let modal = document.getElementById("ajd-booking-modal");
    if (!modal) modal = buildModalSkeleton();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderStep();
    modal.querySelector(".ajd-bk-close").focus(); // keyboard users land inside the dialog
  }

  function closeModal() {
    const modal = document.getElementById("ajd-booking-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function init(userConfig) {
    cfg = Object.assign({}, DEFAULTS, userConfig || {});
    document.querySelectorAll(cfg.triggerSelector).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(el.dataset.service || null);
      });
    });
  }

  window.AJDBooking = { init, open: openModal, close: closeModal };
})();
