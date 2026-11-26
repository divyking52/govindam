const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "D:\\divyanssh\\govindam\\_parts";
const port = 9507;
const proc = spawn(chrome, ["--headless=new","--disable-gpu","--no-first-run",`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(outDir,"arch-cdp")}`,"about:blank"], {stdio:"ignore"});
const get = (url) => new Promise((resolve, reject) => http.get(url, (res) => { let d=""; res.on("data", c => d+=c); res.on("end", () => resolve(d)); }).on("error", reject));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  let version;
  for (let i=0;i<40;i++){ try { version = JSON.parse(await get(`http://127.0.0.1:${port}/json/version`)); break;} catch(e){ await wait(200);} }
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let id=0; const pending=new Map();
  ws.addEventListener("message", (ev) => { const msg=JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id);} });
  const send = (method, params={}, sessionId) => new Promise((resolve) => { const msgId=++id; pending.set(msgId, resolve); const payload={id:msgId, method, params}; if(sessionId) payload.sessionId=sessionId; ws.send(JSON.stringify(payload)); });
  const target = await send("Target.createTarget", {url:"about:blank"});
  const attached = await send("Target.attachToTarget", {targetId: target.result.targetId, flatten:true});
  const sid = attached.result.sessionId;
  await send("Page.enable", {}, sid);
  await send("Runtime.enable", {}, sid);
  const ev = (expression) => send("Runtime.evaluate", {expression, returnByValue:true, awaitPromise:true}, sid).then(r => {
    const res = r.result && r.result.result;
    return res && res.value !== undefined ? res.value : JSON.stringify(r.result);
  });
  async function shot(name){ const res = await send("Page.captureScreenshot", {format:"png"}, sid); fs.writeFileSync(path.join(outDir, name), Buffer.from(res.result.data,"base64")); }
  await send("Emulation.setDeviceMetricsOverride", {width:1440,height:900,deviceScaleFactor:1,mobile:false}, sid);
  await send("Page.navigate", {url:"http://127.0.0.1:8944/index.html"}, sid);
  await wait(1200);
  console.log(await ev(`(function(){
    document.querySelectorAll('.frame-line,.arch path').forEach(p => { p.style.strokeDashoffset = '0'; });
    const lines = [...document.querySelectorAll('.hero-frame .frame-line')].map(p => Math.round(p.getTotalLength()));
    const photo = [...document.querySelectorAll('.arch path')].map(p => Math.round(p.getTotalLength()));
    return {lines, photo};
  })()`));
  await wait(200);
  await shot("arch-hero.png");
  ws.close(); proc.kill();
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
