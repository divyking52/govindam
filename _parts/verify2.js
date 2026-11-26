const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = "D:\\divyanssh\\govindam\\_parts";
const port = 9488;
const proc = spawn(chrome, ["--headless=new","--disable-gpu","--no-first-run",`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(outDir,"v2")}`,"about:blank"], {stdio:"ignore"});
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
  await send("Runtime.enable", {}, sid);
  await send("Page.enable", {}, sid);
  const ev = (expression) => send("Runtime.evaluate", {expression, returnByValue:true}, sid).then(r => r.result.result.value);
  async function go(url){ await send("Page.navigate", {url}, sid); await wait(1600); }
  async function shot(name){ const res = await send("Page.captureScreenshot", {format:"png"}, sid); fs.writeFileSync(path.join(outDir, name), Buffer.from(res.result.data,"base64")); }
  await send("Emulation.setDeviceMetricsOverride", {width:1440,height:900,deviceScaleFactor:1,mobile:false}, sid);
  await go("http://127.0.0.1:8931/gallery.html");
  console.log("gallery", await ev(`JSON.stringify({n:document.querySelectorAll('.ring figure').length, t:document.querySelector('.ring figure').style.transform, vis:document.querySelectorAll('.ring img').length})`));
  await shot("v-gallery2.png");
  await go("http://127.0.0.1:8931/index.html");
  await ev("document.querySelector('#rooms').scrollIntoView()");
  await wait(900);
  console.log("orbit", await ev(`JSON.stringify({title:document.querySelector('.orbit-title').textContent, img:document.querySelector('.orbit-card img').alt, x:document.querySelector('.orbit-card').style.transform.slice(0,80)})`));
  await shot("v-orbit2.png");
  await go("http://127.0.0.1:8931/contact.html");
  console.log("summary-display", await ev(`(function(){const f=document.querySelector('form.enquiry-form'); f.checkin.value='2026-12-02'; f.checkout.value='2026-12-04'; f.guests.value='2'; f.rooms.value='1'; f.guest.value='Asha Mehta'; f.mobile.value='9829057118'; f.email.value='asha@example.com'; f.requestSubmit(); return getComputedStyle(f).display + '|' + getComputedStyle(f.parentElement.querySelector('.summary')).display;})()`));
  await shot("v-summary2.png");
  await go("http://127.0.0.1:8931/about.html");
  await shot("v-about.png");
  ws.close(); proc.kill();
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });
