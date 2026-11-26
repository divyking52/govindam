const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "D:\\divyanssh\\govindam\\_parts";
const port = 9477;
const userData = path.join(outDir, "verify-profile");
const base = "http://127.0.0.1:8931/";

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userData}`,
  "about:blank"
], { stdio: "ignore" });

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  let version;
  for (let i = 0; i < 40; i++) {
    try { version = JSON.parse(await get(`http://127.0.0.1:${port}/json/version`)); break; }
    catch (e) { await wait(200); }
  }
  if (!version) throw new Error("no chrome");
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else events.push(msg);
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    const payload = { id: msgId, method, params };
    if (sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
  });
  const target = await send("Target.createTarget", { url: "about:blank" });
  const attached = await send("Target.attachToTarget", { targetId: target.result.targetId, flatten: true });
  const sid = attached.result.sessionId;
  await send("Runtime.enable", {}, sid);
  await send("Page.enable", {}, sid);
  const errors = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (!msg.method || msg.sessionId !== sid) return;
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      errors.push((d.exception && d.exception.description) || d.text);
    }
  });
  async function evalJs(expression) {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sid);
    if (res.result.exceptionDetails) throw new Error(JSON.stringify(res.result.exceptionDetails));
    return res.result.result.value;
  }
  async function go(url) {
    await send("Page.navigate", { url }, sid);
    await wait(1400);
  }
  async function shot(name) {
    const res = await send("Page.captureScreenshot", { format: "png" }, sid);
    fs.writeFileSync(path.join(outDir, name), Buffer.from(res.result.data, "base64"));
  }

  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
  await go(base + "index.html");
  console.log("title", await evalJs("document.title"));
  console.log("overflow", await evalJs("({w:document.documentElement.scrollWidth,c:document.documentElement.clientWidth,float:getComputedStyle(document.querySelector('.float-book')).display})"));
  await shot("v-home.png");
  await evalJs("window.scrollTo(0, 1400)");
  await wait(600);
  await shot("v-story.png");
  await evalJs("document.querySelector('#rooms').scrollIntoView()");
  await wait(800);
  await shot("v-rooms-orbit.png");

  await go(base + "contact.html");
  const formResult = await evalJs(`(function(){
    const f = document.querySelector('form.enquiry-form');
    f.checkin.value = '2026-12-02';
    f.checkout.value = '2026-12-05';
    f.guests.value = '2';
    f.rooms.value = '1';
    f.guest.value = 'Asha Mehta';
    f.mobile.value = '9829057118';
    f.email.value = 'asha@example.com';
    f.requests.value = 'Quiet room';
    f.requestSubmit();
    const summary = f.parentElement.querySelector('.summary');
    return { hidden: f.hidden, on: summary.classList.contains('is-on'), text: summary.innerText.slice(0, 400), book: summary.querySelector('[data-book]').href };
  })()`);
  console.log("form", JSON.stringify(formResult));
  await shot("v-contact-summary.png");

  const bad = await evalJs(`(function(){
    const f = document.querySelector('form.contact-form');
    document.querySelector('#tab-note').click();
    f.guest.value = 'A';
    f.mobile.value = '123';
    f.email.value = 'nope';
    f.message.value = 'hi';
    f.requestSubmit();
    return Array.from(f.querySelectorAll('.err')).map(e => e.textContent);
  })()`);
  console.log("errors-shown", JSON.stringify(bad));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sid);
  await go(base + "index.html");
  console.log("mobile", await evalJs("({title:document.title,float:getComputedStyle(document.querySelector('.float-book')).display,nav:getComputedStyle(document.querySelector('.nav-links')).display,toggle:getComputedStyle(document.querySelector('.nav-toggle')).display})"));
  await shot("v-mobile.png");
  await go(base + "gallery.html");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
  await wait(500);
  await shot("v-gallery.png");
  console.log("JS exceptions", errors.length);
  errors.forEach((e) => console.log(e));
  ws.close();
  proc.kill();
}

run().catch((err) => { console.error(err); proc.kill(); process.exit(1); });
