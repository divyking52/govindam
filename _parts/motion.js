(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.registerPlugin(ScrollTrigger);
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (!reduce && fine && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  if (reduce) return;

  const mm = gsap.matchMedia();
  const progress = document.querySelector(".progress");
  if (progress) {
    gsap.to(progress, {
      scaleX: 1, ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
    });
  }

  const hero = document.querySelector(".hero");
  if (hero) {
    const portal = hero.querySelector(".portal");
    const photo = hero.querySelector(".hero-photo");
    const scrim = hero.querySelector(".hero-scrim");
    const copy = hero.querySelector(".hero-copy");
    const lines = hero.querySelectorAll("h1 span");
    const arches = hero.querySelectorAll(".arch path");
    const frame = hero.querySelector(".hero-frame");
    const dust = hero.querySelector(".dust");
    const nav = document.querySelector(".nav");
    let dustBoost = 1;
    initDust(dust, function () { return dustBoost; });
    hero.querySelectorAll(".frame-line").forEach(function (path) {
      if (!path.getTotalLength) return;
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    });
    gsap.to(".frame-line", { strokeDashoffset: 0, duration: 2.6, stagger: 0.08, ease: "power2.inOut" });
    gsap.to(".finial", { y: -7, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.18 });
    const cover = function () {
      const w = portal.offsetWidth || 1;
      const h = portal.offsetHeight || 1;
      return Math.max(window.innerWidth / w, window.innerHeight / h) * 1.12;
    };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: function () { return window.innerWidth < 800 ? "+=75%" : "+=140%"; },
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          dustBoost = 1 + self.progress * 5;
          const onPhoto = self.progress > 0.42 && self.progress < 0.98;
          hero.classList.toggle("is-lit", self.progress > 0.42);
          if (!nav) return;
          nav.classList.toggle("is-light", onPhoto);
          nav.classList.toggle("is-solid", self.progress >= 0.98);
        }
      }
    });
    tl.to(portal, { scale: cover, borderRadius: 0, ease: "none", duration: 1 }, 0)
      .to(photo, { scale: 1, ease: "none", duration: 1 }, 0)
      .to(frame, { opacity: 0, ease: "none", duration: 0.45 }, 0.15)
      .to(dust, { opacity: 0, ease: "none", duration: 0.4 }, 0.2)
      .to(arches, { opacity: 0, scale: 1.35, stagger: 0.04, ease: "none", duration: 0.55 }, 0)
      .to(scrim, { opacity: 1, ease: "none", duration: 0.45 }, 0.32)
      .to(lines[0], { xPercent: -4, y: -8, ease: "none", duration: 1 }, 0.2)
      .to(lines[1], { xPercent: 7, y: 18, ease: "none", duration: 1 }, 0.2);

    mm.add("(min-width: 981px)", function () {
      const shots = gsap.utils.toArray(".remember .shots figure");
      if (shots.length) {
        gsap.to(shots, {
          x: 0, y: 0, rotation: 0, ease: "none",
          scrollTrigger: {
            trigger: ".remember",
            start: "top top",
            end: "+=90%",
            pin: true,
            scrub: 0.8
          }
        });
        gsap.from(".remember-copy p", {
          y: 28, opacity: 0, stagger: 0.12, ease: "power2.out",
          scrollTrigger: { trigger: ".remember", start: "top 70%", toggleActions: "play none none reverse" }
        });
      }

      const cards = gsap.utils.toArray(".orbit-card");
      const stage = document.querySelector(".orbit-stage");
      const liveTitle = document.querySelector(".orbit-title");
      const liveMeta = document.querySelector(".orbit-meta");
      const liveDesc = document.querySelector(".orbit-desc");
      const liveCount = document.querySelector(".orbit-count");
      const liveMore = document.querySelector(".orbit-more");
      let orbitCleanup = function () {};
      if (cards.length && stage) {
        let shown = 0;
        const fade = 0.52;
        const paint = function (i) {
          const card = cards[i];
          liveTitle.textContent = card.dataset.name;
          liveMeta.textContent = card.dataset.meta;
          liveDesc.textContent = card.dataset.desc;
          liveCount.textContent = String(i + 1).padStart(2, "0") + " / 0" + cards.length;
          liveMore.href = card.dataset.href;
        };
        const indexItems = gsap.utils.toArray(".room-index li");
        const markIndex = function (i) {
          indexItems.forEach(function (item, n) {
            item.classList.toggle("is-on", n === i);
            const button = item.querySelector("button");
            if (button) button.setAttribute("aria-current", n === i ? "true" : "false");
          });
        };
        const showRoom = function (i) {
          i = Math.max(0, Math.min(cards.length - 1, i));
          if (i === shown) return;
          shown = i;
          cards.forEach(function (card, n) {
            if (n === i) {
              gsap.set(card, { zIndex: 2 });
              gsap.to(card, { opacity: 1, duration: fade, ease: "power2.out", overwrite: "auto" });
            } else {
              gsap.set(card, { zIndex: 1 });
              if (Number(gsap.getProperty(card, "opacity")) > 0.01) {
                gsap.to(card, { opacity: 0, duration: fade, ease: "power2.out", overwrite: "auto" });
              }
            }
          });
          markIndex(i);
          paint(i);
        };
        paint(0);
        markIndex(0);
        ScrollTrigger.create({
          trigger: ".orbit",
          start: "top top",
          end: "+=220%",
          pin: true,
          scrub: 0.6,
          onUpdate: function (self) {
            const n = cards.length;
            showRoom(Math.min(n - 1, Math.floor(self.progress * n)));
          }
        });
        orbitCleanup = function () {
          cards.forEach(function (card) {
            gsap.killTweensOf(card);
            card.style.removeProperty("opacity");
            card.style.removeProperty("z-index");
          });
        };
      }

      const track = document.querySelector(".comfort-track");
      if (track) {
        const tween = gsap.to(track, {
          x: function () { return -(track.scrollWidth - window.innerWidth); },
          ease: "none",
          scrollTrigger: {
            trigger: ".comfort",
            start: "top top",
            end: function () { return "+=" + (track.scrollWidth - window.innerWidth); },
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true
          }
        });
        gsap.to(".comfort-arch", {
          x: -180, y: 40, rotation: 8, ease: "none",
          scrollTrigger: {
            containerAnimation: tween,
            trigger: ".comfort-track",
            start: "left left",
            end: "right right",
            scrub: true
          }
        });
      }

      const tiles = gsap.utils.toArray(".arrange figure");
      if (tiles.length) {
        gsap.to(tiles, {
          x: 0, y: 0, rotation: 0, ease: "none",
          scrollTrigger: {
            trigger: ".gallery-home",
            start: "top 70%",
            end: "center center",
            scrub: 0.7
          }
        });
      }

      gsap.from(".jaipur-mosaic figure", {
        y: 36, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: ".jaipur", start: "top 72%", toggleActions: "play none none reverse" }
      });

      return orbitCleanup;
    });
  }

  mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", function () {
    gsap.utils.toArray(".stay-hero").forEach(function (el) {
      const img = el.querySelector("img");
      if (!img) return;
      gsap.fromTo(img, { scale: 1.16 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "+=65%", pin: true, scrub: 0.6 }
      });
    });
    gsap.utils.toArray(".story-block img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8, scale: 1.08 }, {
        yPercent: 8, scale: 1, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  });

  mm.add("(min-width: 981px)", function () {
    const ring = document.querySelector(".ring");
    if (!ring) return;
    const figs = gsap.utils.toArray(".ring figure");
    const n = figs.length;
    const place = function () {
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.26;
      figs.forEach(function (fig, i) {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        gsap.set(fig, { x: Math.cos(ang) * radius, y: Math.sin(ang) * radius * 0.46 + 28 });
      });
    };
    place();
    gsap.timeline({
      scrollTrigger: { trigger: ".ring-wrap", start: "top top", end: "+=150%", pin: true, scrub: 0.8 }
    }).to(ring, { rotationY: 160, rotation: 50, ease: "none" }, 0);
  });

  const pageHero = document.querySelector(".page-hero img");
  if (pageHero) {
    gsap.fromTo(pageHero, { scale: 1.12 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: ".page-hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  function particleDissolve(img, canvas, getFrame, setFrame) {
    if (!img || !canvas || !img.naturalWidth) return;
    const stage = canvas.parentElement;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    cancelAnimationFrame(getFrame());
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sample = document.createElement("canvas");
    const sw = Math.max(1, Math.floor(width / 2));
    const sh = Math.max(1, Math.floor(height / 2));
    sample.width = sw;
    sample.height = sh;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    const cover = Math.max(sw / img.naturalWidth, sh / img.naturalHeight);
    const dw = img.naturalWidth * cover;
    const dh = img.naturalHeight * cover;
    sctx.drawImage(img, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
    let pixels;
    try { pixels = sctx.getImageData(0, 0, sw, sh).data; }
    catch (err) { return; }
    const gap = 6;
    const parts = [];
    for (let y = 0; y < sh; y += gap) {
      for (let x = 0; x < sw; x += gap) {
        const i = (y * sw + x) * 4;
        if (pixels[i + 3] < 30) continue;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.35 + Math.random() * 2.2;
        parts.push({
          x: x * (width / sw),
          y: y * (height / sh),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.4,
          r: pixels[i],
          g: pixels[i + 1],
          b: pixels[i + 2],
          size: (width / sw) * gap * (0.7 + Math.random() * 0.5),
          life: 1,
          decay: 0.011 + Math.random() * 0.018
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      for (let n = 0; n < parts.length; n++) {
        const p = parts[n];
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.028;
        p.vx *= 0.99;
        p.life -= p.decay;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
        const s = Math.max(1, p.size * (0.3 + p.life * 0.7));
        ctx.fillRect(p.x, p.y, s, s);
      }
      ctx.globalAlpha = 1;
      if (alive) setFrame(requestAnimationFrame(frame));
      else ctx.clearRect(0, 0, width, height);
    }
    ctx.drawImage(sample, 0, 0, width, height);
    setFrame(requestAnimationFrame(frame));
  }

  function initDust(canvas, boost) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    const count = mobile ? 46 : 130;
    const parts = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    function spawn(p, far) {
      p.x = Math.random() * 2 - 1;
      p.y = Math.random() * 2 - 1;
      p.z = far ? Math.random() * 0.85 + 0.15 : 1;
      p.vz = 0.0016 + Math.random() * 0.0024;
      p.size = 0.7 + Math.random() * 1.5;
      p.wine = Math.random() > 0.78;
    }
    for (let i = 0; i < count; i++) {
      const p = {};
      spawn(p, true);
      parts.push(p);
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function tick() {
      if (!running) return;
      const speed = boost ? boost() : 1;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.z -= p.vz * speed;
        if (p.z < 0.08) spawn(p, false);
        const persp = 0.9 / p.z;
        const x = w * 0.5 + p.x * w * 0.46 * persp;
        const y = h * 0.46 + p.y * h * 0.4 * persp;
        if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;
        const radius = Math.max(0.8, p.size * persp * 1.15);
        const alpha = Math.min(0.75, (1 - p.z) * 0.72);
        ctx.beginPath();
        ctx.fillStyle = p.wine ? "rgba(110, 36, 48, " + alpha + ")" : "rgba(154, 117, 64, " + alpha + ")";
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (p.z < 0.35) {
          ctx.beginPath();
          ctx.fillStyle = "rgba(255, 248, 236, " + Math.min(0.85, alpha + 0.2) + ")";
          ctx.arc(x - radius * 0.25, y - radius * 0.25, Math.max(0.4, radius * 0.35), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener("resize", resize);
    const watch = new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
      if (running) tick();
      else cancelAnimationFrame(raf);
    });
    watch.observe(canvas.parentElement || canvas);
  }
})();
