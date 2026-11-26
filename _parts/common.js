(function () {
  const BOOK = "https://govindamroyalstay.pripgo.com/";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("is-ready");

  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".menu");
  const progress = document.querySelector(".progress");

  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setMenu(false);
      closeLight();
    }
  });

  const solidAt = document.body.dataset.solid === "always" ? 0 : 40;
  function onScroll() {
    if (!nav) return;
    const y = window.scrollY || 0;
    if (document.body.dataset.solid === "always") nav.classList.add("is-solid");
    else nav.classList.toggle("is-solid", y > solidAt && !nav.classList.contains("is-light"));
    if (progress && reduce) progress.style.transform = "scaleX(" + Math.min(1, y / (document.body.scrollHeight - window.innerHeight || 1)) + ")";
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll("a[data-internal]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (reduce) return;
      e.preventDefault();
      document.body.classList.remove("is-ready");
      document.body.classList.add("is-leaving");
      window.setTimeout(function () { location.href = a.href; }, 420);
    });
  });

  const lb = document.querySelector(".lightbox");
  const lbImg = lb ? lb.querySelector("img") : null;
  const lbCap = lb ? lb.querySelector("p") : null;
  let lbItems = [];
  let lbIndex = 0;
  function openLight(items, index) {
    if (!lb) return;
    lbItems = items;
    lbIndex = index;
    paintLight();
    lb.classList.add("is-on");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function paintLight() {
    const item = lbItems[lbIndex];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt || "";
    lbCap.textContent = item.cap || item.alt || "";
  }
  function closeLight() {
    if (!lb || !lb.classList.contains("is-on")) return;
    lb.classList.remove("is-on");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
  }
  function step(dir) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    paintLight();
  }
  if (lb) {
    lb.querySelector(".lb-x").addEventListener("click", closeLight);
    lb.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLight(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-on")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }
  document.querySelectorAll("[data-gallery]").forEach(function (group) {
    const figs = Array.prototype.slice.call(group.querySelectorAll("figure"));
    const items = figs.map(function (fig) {
      const img = fig.querySelector("img");
      return { src: img.currentSrc || img.src, alt: img.alt, cap: fig.getAttribute("data-cap") || img.alt };
    });
    figs.forEach(function (fig, i) {
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      function open() { openLight(items, i); }
      fig.addEventListener("click", open);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  });

  function fieldError(input, message) {
    const slot = input.closest(".field").querySelector(".err");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (slot) slot.textContent = message || "";
    return !message;
  }
  function bindEnquiry(form) {
    if (!form) return;
    const summary = form.parentElement.querySelector(".summary");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = {
        checkin: form.checkin.value,
        checkout: form.checkout.value,
        guests: form.guests.value.trim(),
        rooms: form.rooms.value.trim(),
        name: form.guest.value.trim(),
        mobile: form.mobile.value.trim(),
        email: form.email.value.trim(),
        requests: form.requests.value.trim()
      };
      let ok = true;
      ok = fieldError(form.checkin, data.checkin ? "" : "Choose a check-in date.") && ok;
      ok = fieldError(form.checkout, data.checkout ? "" : "Choose a check-out date.") && ok;
      if (data.checkin && data.checkout && data.checkout <= data.checkin) {
        ok = fieldError(form.checkout, "Check-out must be after check-in.") && false;
      }
      const guests = Number(data.guests);
      const rooms = Number(data.rooms);
      ok = fieldError(form.guests, guests >= 1 && guests <= 24 ? "" : "Enter 1 to 24 guests.") && ok;
      ok = fieldError(form.rooms, rooms >= 1 && rooms <= 16 ? "" : "Enter 1 to 16 rooms.") && ok;
      ok = fieldError(form.guest, data.name.length >= 2 ? "" : "Enter the guest name.") && ok;
      ok = fieldError(form.mobile, /^(\+91[\s-]?)?[6-9]\d{9}$/.test(data.mobile.replace(/\s/g, "")) ? "" : "Enter a valid mobile number.") && ok;
      ok = fieldError(form.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? "" : "Enter a valid email address.") && ok;
      if (!ok) return;
      const rows = [
        ["Check-in", data.checkin],
        ["Check-out", data.checkout],
        ["Guests", data.guests],
        ["Rooms", data.rooms],
        ["Name", data.name],
        ["Mobile", data.mobile],
        ["Email", data.email],
        ["Requests", data.requests || "None"]
      ];
      const dl = summary.querySelector("dl");
      dl.innerHTML = "";
      rows.forEach(function (row) {
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = row[0];
        dd.textContent = row[1];
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      form.hidden = true;
      summary.classList.add("is-on");
      summary.querySelector("h3").focus();
    });
    const back = summary.querySelector("[data-edit]");
    if (back) back.addEventListener("click", function () {
      summary.classList.remove("is-on");
      form.hidden = false;
      form.guest.focus();
    });
    const go = summary.querySelector("[data-book]");
    if (go) go.href = BOOK;
  }
  document.querySelectorAll("form.enquiry-form").forEach(bindEnquiry);

  document.querySelectorAll("form.contact-form").forEach(function (form) {
    const summary = form.parentElement.querySelector(".summary");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = {
        name: form.guest.value.trim(),
        mobile: form.mobile.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
      };
      let ok = true;
      ok = fieldError(form.guest, data.name.length >= 2 ? "" : "Enter your name.") && ok;
      ok = fieldError(form.mobile, /^(\+91[\s-]?)?[6-9]\d{9}$/.test(data.mobile.replace(/\s/g, "")) ? "" : "Enter a valid mobile number.") && ok;
      ok = fieldError(form.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? "" : "Enter a valid email address.") && ok;
      ok = fieldError(form.message, data.message.length >= 8 ? "" : "Write a short message.") && ok;
      if (!ok) return;
      const dl = summary.querySelector("dl");
      dl.innerHTML = "";
      [["Name", data.name], ["Mobile", data.mobile], ["Email", data.email], ["Message", data.message]].forEach(function (row) {
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = row[0];
        dd.textContent = row[1];
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      const mail = summary.querySelector("[data-mail]");
      const subject = encodeURIComponent("Enquiry for Govindam Royal Stay");
      const body = encodeURIComponent("Name: " + data.name + "\nMobile: " + data.mobile + "\nEmail: " + data.email + "\n\n" + data.message);
      mail.href = "mailto:govindamroyalstay@gmail.com?subject=" + subject + "&body=" + body;
      form.hidden = true;
      summary.classList.add("is-on");
      summary.querySelector("h3").focus();
    });
    summary.querySelector("[data-edit]").addEventListener("click", function () {
      summary.classList.remove("is-on");
      form.hidden = false;
    });
  });

  const today = new Date();
  const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  document.querySelectorAll("input[type=date]").forEach(function (input) {
    if (!input.min) input.min = iso;
  });
  document.querySelectorAll("form.enquiry-form").forEach(function (form) {
    const nights = form.closest(".ticket") && form.closest(".ticket").querySelector(".ticket-nights");
    function nextIso(value) {
      const parts = value.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 1);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function syncNights() {
      if (form.checkin.value) {
        form.checkout.min = nextIso(form.checkin.value);
        if (form.checkout.value && form.checkout.value <= form.checkin.value) form.checkout.value = form.checkout.min;
      }
      if (!nights) return;
      if (!form.checkin.value || !form.checkout.value) { nights.textContent = "Pick your dates"; return; }
      const stay = Math.round((new Date(form.checkout.value) - new Date(form.checkin.value)) / 86400000);
      nights.textContent = stay > 0 ? stay + (stay === 1 ? " night in Jaipur" : " nights in Jaipur") : "Check-out comes after check-in";
    }
    form.checkin.addEventListener("change", syncNights);
    form.checkout.addEventListener("change", syncNights);
  });
  const staybar = document.querySelector("#staybar");
  if (staybar) {
    const inn = staybar.checkin;
    const out = staybar.checkout;
    const rooms = staybar.rooms;
    const guests = staybar.guests;
    const nightsEl = document.getElementById("h-nights");
    const inBtn = document.getElementById("h-checkin-btn");
    const outBtn = document.getElementById("h-checkout-btn");
    const inLabel = document.getElementById("h-checkin-label");
    const outLabel = document.getElementById("h-checkout-label");
    const cal = document.getElementById("stay-cal");
    const calLabel = cal.querySelector("[data-cal=label]");
    const calGrid = cal.querySelector("[data-cal=grid]");
    const calHint = cal.querySelector("[data-cal=hint]");
    const calPrev = cal.querySelector("[data-cal=prev]");
    const calNext = cal.querySelector("[data-cal=next]");
    const occLabel = document.getElementById("occ-label");
    const occBtn = staybar.querySelector(".staybar-occ-btn");
    const occPanel = document.getElementById("occ-panel");
    const error = staybar.querySelector(".staybar-error");
    const ticket = document.querySelector(".enquiry-form");
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    let checkIn = startOfDay(new Date());
    let checkOut = addDays(checkIn, 1);
    let view = new Date(checkIn.getFullYear(), checkIn.getMonth(), 1);
    let mode = "";
    let hoverTime = 0;
    function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    function pretty(d) { return d.getDate() + " " + shortMonths[d.getMonth()] + ", " + d.getFullYear(); }
    function nightCount(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }
    function previewEnd() {
      if (mode === "out" && hoverTime > checkIn.getTime()) return new Date(hoverTime);
      return checkOut;
    }
    function syncOcc() {
      const roomCount = Number(rooms.value || 1);
      const guestCount = Number(guests.value || 1);
      occLabel.textContent = roomCount + (roomCount === 1 ? " Room, " : " Rooms, ") + guestCount + (guestCount === 1 ? " Guest" : " Guest(s)");
    }
    function commit() {
      inn.value = iso(checkIn);
      out.value = iso(checkOut);
      inLabel.textContent = pretty(checkIn);
      outLabel.textContent = pretty(checkOut);
      const stay = nightCount(checkIn, previewEnd());
      nightsEl.textContent = String(stay);
      nightsEl.setAttribute("aria-label", stay + (stay === 1 ? " night" : " nights"));
      error.textContent = "";
      syncOcc();
      if (ticket) {
        ticket.checkin.value = inn.value;
        ticket.checkout.value = out.value;
        ticket.rooms.value = rooms.value;
        ticket.guests.value = guests.value;
        ticket.checkin.dispatchEvent(new Event("change"));
      }
    }
    function paintDays() {
      const start = checkIn.getTime();
      const end = previewEnd().getTime();
      calGrid.querySelectorAll(".cal-day").forEach(function (btn) {
        const t = Number(btn.dataset.t);
        btn.classList.toggle("is-in", t === start);
        btn.classList.toggle("is-out", t === end);
        btn.classList.toggle("is-range", t > start && t < end);
        btn.setAttribute("aria-pressed", t === start || t === end ? "true" : "false");
      });
      const endDate = new Date(end);
      const stay = nightCount(checkIn, endDate);
      nightsEl.textContent = String(stay);
      nightsEl.setAttribute("aria-label", stay + (stay === 1 ? " night" : " nights"));
      outLabel.textContent = pretty(mode === "out" && hoverTime > checkIn.getTime() ? endDate : checkOut);
    }
    function renderMonth() {
      const today = startOfDay(new Date());
      calLabel.textContent = monthNames[view.getMonth()] + " " + view.getFullYear();
      calPrev.disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
      calHint.textContent = mode === "out" ? "Select a check-out date" : "Select a check-in date";
      calGrid.replaceChildren();
      const year = view.getFullYear();
      const month = view.getMonth();
      const pad = new Date(year, month, 1).getDay();
      const count = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < pad; i++) calGrid.appendChild(document.createElement("span"));
      for (let day = 1; day <= count; day++) {
        const date = new Date(year, month, day);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cal-day";
        btn.textContent = String(day);
        btn.dataset.t = String(date.getTime());
        btn.disabled = date < today;
        if (date.getTime() === today.getTime()) btn.classList.add("is-today");
        btn.setAttribute("aria-label", pretty(date));
        calGrid.appendChild(btn);
      }
      paintDays();
      placeCal();
    }
    function placeCal() {
      const anchor = (mode === "out" ? outBtn : inBtn).getBoundingClientRect();
      const host = staybar.getBoundingClientRect();
      const width = cal.offsetWidth || 332;
      let left = anchor.left - host.left;
      const maxLeft = Math.max(0, host.width - width - 8);
      if (left > maxLeft) left = maxLeft;
      if (left < 8) left = 8;
      cal.style.left = left + "px";
    }
    function setMode(next) {
      mode = next;
      inBtn.classList.toggle("is-on", next === "in");
      outBtn.classList.toggle("is-on", next === "out");
      inBtn.setAttribute("aria-expanded", next === "in" ? "true" : "false");
      outBtn.setAttribute("aria-expanded", next === "out" ? "true" : "false");
    }
    function closeCal() {
      if (cal.hidden) return;
      cal.hidden = true;
      hoverTime = 0;
      setMode("");
      commit();
    }
    function openCal(next) {
      occPanel.hidden = true;
      occBtn.setAttribute("aria-expanded", "false");
      if (!cal.hidden && mode === next) { closeCal(); return; }
      hoverTime = 0;
      setMode(next);
      const focus = next === "out" ? checkOut : checkIn;
      view = new Date(focus.getFullYear(), focus.getMonth(), 1);
      cal.hidden = false;
      renderMonth();
      const current = calGrid.querySelector(next === "out" ? ".is-out" : ".is-in");
      if (current) current.focus();
    }
    function shiftMonth(step) {
      const today = startOfDay(new Date());
      const next = new Date(view.getFullYear(), view.getMonth() + step, 1);
      if (next.getFullYear() < today.getFullYear() || (next.getFullYear() === today.getFullYear() && next.getMonth() < today.getMonth())) return;
      view = next;
      renderMonth();
    }
    calPrev.addEventListener("click", function () { shiftMonth(-1); });
    calNext.addEventListener("click", function () { shiftMonth(1); });
    calGrid.addEventListener("click", function (event) {
      const btn = event.target.closest(".cal-day");
      if (!btn || btn.disabled) return;
      event.stopPropagation();
      const date = new Date(Number(btn.dataset.t));
      if (mode === "out" && date > checkIn) {
        checkOut = date;
        hoverTime = 0;
        commit();
        closeCal();
        return;
      }
      checkIn = date;
      if (!(checkOut > checkIn)) checkOut = addDays(checkIn, 1);
      hoverTime = 0;
      setMode("out");
      commit();
      renderMonth();
    });
    calGrid.addEventListener("mouseover", function (event) {
      const btn = event.target.closest(".cal-day");
      if (!btn || mode !== "out" || btn.disabled) return;
      const t = Number(btn.dataset.t);
      if (t === hoverTime) return;
      hoverTime = t;
      paintDays();
    });
    calGrid.addEventListener("mouseleave", function () {
      if (!hoverTime) return;
      hoverTime = 0;
      paintDays();
    });
    cal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        const back = mode === "out" ? outBtn : inBtn;
        closeCal();
        back.focus();
        return;
      }
      const days = Array.prototype.slice.call(calGrid.querySelectorAll(".cal-day:not(:disabled)"));
      const index = days.indexOf(document.activeElement);
      if (index < 0) return;
      let next = index;
      if (event.key === "ArrowRight") next = index + 1;
      else if (event.key === "ArrowLeft") next = index - 1;
      else if (event.key === "ArrowDown") next = index + 7;
      else if (event.key === "ArrowUp") next = index - 7;
      else return;
      if (!days[next]) return;
      event.preventDefault();
      days[next].focus();
    });
    inBtn.addEventListener("click", function () { openCal("in"); });
    outBtn.addEventListener("click", function () { openCal("out"); });
    commit();
    rooms.addEventListener("input", commit);
    guests.addEventListener("input", commit);
    occBtn.addEventListener("click", function () {
      closeCal();
      const open = occPanel.hidden;
      occPanel.hidden = !open;
      occBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (event) {
      if (staybar.contains(event.target)) return;
      occPanel.hidden = true;
      occBtn.setAttribute("aria-expanded", "false");
      closeCal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !cal.hidden) closeCal();
    });
    window.addEventListener("resize", function () { if (!cal.hidden) placeCal(); });
    staybar.addEventListener("submit", function (event) {
      event.preventDefault();
      closeCal();
      const stay = nightCount(checkIn, checkOut);
      if (stay < 1) { error.textContent = "Check-out must be after check-in."; return; }
      error.textContent = "";
      window.location.href = "https://govindamroyalstay.pripgo.com/";
    });
  }
  document.querySelectorAll(".step button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const input = btn.parentElement.querySelector("input");
      const next = Math.min(Number(input.max || 99), Math.max(Number(input.min || 0), Number(input.value || 0) + Number(btn.dataset.dir)));
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    const buttons = wrap.querySelectorAll("[role=tab]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          const on = b === btn;
          b.setAttribute("aria-selected", on ? "true" : "false");
          document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
        });
      });
    });
  });

  const jaipur = document.querySelector(".jaipur-stage");
  if (jaipur) {
    const shots = jaipur.querySelectorAll(".mosaic-main img");
    const cap = jaipur.querySelector(".mosaic-main figcaption");
    const places = jaipur.querySelectorAll(".places [data-img]");
    const current = jaipur.querySelector(".mosaic-main img.is-show");
    let showing = current ? current.getAttribute("src") : "";
    let token = 0;
    function showPlace(btn) {
      const src = btn.getAttribute("data-img");
      if (!src || src === showing || shots.length < 2) return;
      showing = src;
      const id = ++token;
      const incoming = shots[0].classList.contains("is-show") ? shots[1] : shots[0];
      const outgoing = incoming === shots[0] ? shots[1] : shots[0];
      function reveal() {
        if (id !== token) return;
        incoming.alt = btn.getAttribute("data-alt") || "";
        incoming.classList.add("is-show");
        outgoing.classList.remove("is-show");
        if (cap) cap.textContent = btn.getAttribute("data-cap") || "";
        places.forEach(function (item) {
          const on = item === btn;
          item.parentElement.classList.toggle("is-on", on);
          item.setAttribute("aria-current", on ? "true" : "false");
        });
      }
      if (incoming.getAttribute("src") !== src) incoming.src = src;
      if (incoming.complete && incoming.naturalWidth) reveal();
      else incoming.addEventListener("load", reveal, { once: true });
    }
    places.forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { showPlace(btn); });
      btn.addEventListener("focus", function () { showPlace(btn); });
      btn.addEventListener("click", function () { showPlace(btn); });
      btn.setAttribute("aria-current", btn.parentElement.classList.contains("is-on") ? "true" : "false");
    });
  }

  const floatBook = document.querySelector("a.float-book");
  const staybarWatch = document.querySelector("#staybar");
  if (floatBook && staybarWatch && "IntersectionObserver" in window) {
    const watch = new IntersectionObserver(function (entries) {
      floatBook.classList.toggle("is-hidden", entries[0].isIntersecting);
    }, { threshold: 0.2 });
    watch.observe(staybarWatch);
  }

  window.GRS = { reduce: reduce, book: BOOK, nav: nav };
})();
