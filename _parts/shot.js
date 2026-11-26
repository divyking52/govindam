const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = path.join("D:\\divyanssh\\govindam\\_parts");
const port = 9333;
const userData = path.join(outDir, "chrome-profile");

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userData}`,
  "--window-size=1440,900"
], { stdio: "ignore" });

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const raw = await get(`http://127.0.0.1:${port}/json/version`);
      return JSON.parse(raw);
    } catch (e) {
      await wait(250);
    }
  }
  throw new Error("chrome did not start");
}

async function openTab(url) {
  const raw = await get(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`);
  return JSON.parse(raw);
}

async function run() {
  const version = await connect();
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve) => browserWs.addEventListener("open", resolve));
  let id = 0;
  const pending = new Map();
  browserWs.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  function send(method, params = {}, sessionId) {
    const msgId = ++id;
    return new Promise((resolve) => {
      pending.set(msgId, resolve);
      const payload = { id: msgId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      browserWs.send(JSON.stringify(payload));
    });
  }
  const target = await send("Target.createTarget", { url: "about:blank" });
  const session = await send("Target.attachToTarget", { targetId: target.result.targetId, flatten: true });
  const sessionId = session.result.sessionId;
  const errors = [];
  browserWs.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.sessionId !== sessionId || !msg.method) return;
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description || ""));
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      errors.push(msg.params.args.map((a) => a.value || a.description).join(" "));
    }
  });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Log.enable", {}, sessionId);

  async function shoot(name, url, width, height, scrollY) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 800 }, sessionId);
    await send("Page.navigate", { url }, sessionId);
    await wait(1800);
    if (scrollY) {
      await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${scrollY})` }, sessionId);
      await wait(700);
    }
    const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    const file = path.join(outDir, name);
    fs.writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    console.log("saved", name, "errors", errors.length);
  }

  await shoot("home-desktop.png", "http://127.0.0.1:8765/index.html", 1440, 900, 0);
  await shoot("home-mid.png", "http://127.0.0.1:8765/index.html", 1440, 900, 1600);
  await shoot("home-mobile.png", "http://127.0.0.1:8765/index.html", 390, 844, 0);
  await shoot("rooms.png", "http://127.0.0.1:8765/rooms.html", 1440, 900, 0);
  await shoot("gallery.png", "http://127.0.0.1:8765/gallery.html", 1440, 900, 0);
  await shoot("about.png", "http://127.0.0.1:8765/about.html", 1440, 900, 0);
  await shoot("contact.png", "http://127.0.0.1:8765/contact.html", 1440, 900, 0);
  console.log("ERROR LIST");
  errors.forEach((e) => console.log(e));
  browserWs.close();
  proc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  proc.kill();
  process.exit(1);
});
