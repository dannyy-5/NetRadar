const registry = []; let scanState = "IDLE", scanTimeout = null, sweepRPM = 15, delaySpeed = 60, subnet = "192.168.1", pointer = 1;
const mCanvas = document.getElementById('matrixBg'), mCtx = mCanvas.getContext('2d');
const rCanvas = document.getElementById('radarCanvas'), rCtx = rCanvas.getContext('2d');
const wCanvas = document.getElementById('webCanvas'), wCtx = wCanvas.getContext('2d');
let rAngle = 0; const mChars = "01🫧🧼⚪🪩".split(""), mDrops = []; const fSize = 12;

function initBg() { mCanvas.width = window.innerWidth; mCanvas.height = window.innerHeight; const cols = Math.floor(mCanvas.width / fSize); for (let x = 0; x < cols; x++) mDrops[x] = Math.random() * -50; }
function drawBg() { mCtx.fillStyle = 'rgba(6,13,10,0.08)'; mCtx.fillRect(0,0,mCanvas.width,mCanvas.height); mCtx.fillStyle = 'rgba(255,255,255,0.06)'; mCtx.font = fSize + 'px monospace'; for (let i = 0; i < mDrops.length; i++) { mCtx.fillText(mChars[Math.floor(Math.random()*mChars.length)], i*fSize, mDrops[i]*fSize); if (mDrops[i]*fSize > mCanvas.height && Math.random() > 0.98) mDrops[i] = 0; mDrops[i]++; } }
initBg(); setInterval(drawBg, 40);

function resize() { initBg(); if (!rCanvas || !wCanvas) return; rCanvas.width = rCanvas.parentElement.clientWidth - 24; rCanvas.height = rCanvas.parentElement.clientHeight - 45; wCanvas.width = wCanvas.parentElement.clientWidth - 24; wCanvas.height = wCanvas.parentElement.clientHeight - 45; }
window.addEventListener('resize', resize); setTimeout(resize, 150);

setInterval(() => {
    document.getElementById('globalClock').innerText = `SYS_TIME: ${new Date().toLocaleTimeString()}`;
    if (scanState === "RUNNING") {
        const ms = document.getElementById('memStream');
        if (ms) {
            const h = '0123456789ABCDEF'; let l = `REG_0x${h[Math.floor(Math.random()*16)]}${h[Math.floor(Math.random()*16)]} `;
            for(let i=0; i<5; i++) l += h[Math.floor(Math.random()*16)] + h[Math.floor(Math.random()*16)] + " ";
            ms.innerText += `\n${l}`; ms.scrollTop = ms.scrollHeight; if(ms.innerText.length > 500) ms.innerText = ms.innerText.substring(120);
        }
    }
    registry.forEach(n => { if (n.int > 0.0) { n.int -= 0.025; if (n.int < 0) n.int = 0; } });
}, 250);

function logK(m) { const k = document.getElementById('kernelOutput'); const t = new Date().toLocaleTimeString(); k.innerText += `\n[${t}] ${m}`; k.scrollTop = k.scrollHeight; }
function updateUI(s) { scanState = s; document.getElementById('statusTxt').innerText = s; const id = s==="IDLE", rn = s==="RUNNING", ps = s==="PAUSED"; document.getElementById('netIn').disabled = !id; document.getElementById('rpmIn').disabled = !id; document.getElementById('delayIn').disabled = !id; document.getElementById('startB').disabled = rn; document.getElementById('pauseB').disabled = !rn; document.getElementById('endB').disabled = id; const t = document.getElementById('statusTxt'); if(rn) t.style.color = "#ff3366"; else if(ps) t.style.color = "#ffbb00"; else t.style.color = "#00ffaa"; }

function startScan() {
    if (scanState === "RUNNING") return;
    if (scanState === "IDLE") {
        subnet = document.getElementById('netIn').value.trim(); sweepRPM = parseInt(document.getElementById('rpmIn').value) || 15; delaySpeed = parseInt(document.getElementById('delayIn').value) || 60; document.getElementById('telNet').innerText = `${subnet}.0/24`; registry.length = 0; document.getElementById('profileBox').innerHTML = ""; document.getElementById('nodeCount').innerText = "0 CHANNELS"; pointer = 1; logK(`[IGNITION] Mapping crystal pipeline to target: ${subnet}.0/24`);
    } else { logK("[RESUME] Connecting sockets."); }
    updateUI("RUNNING"); loopScan();
}
function pauseScan() { if (scanState !== "RUNNING") return; clearTimeout(scanTimeout); updateUI("PAUSED"); logK("[SUSPENDED] Remapping loops paused."); }
function endScan() { clearTimeout(scanTimeout); updateUI("IDLE"); document.getElementById('hexStream').innerText = "Pipeline severed."; logK("[PURGE] Cached registers cleared."); }

function loopScan() {
    if (scanState !== "RUNNING") return; if (pointer > 254) pointer = 1;
    const hb = document.getElementById('hexStream'); if (hb) hb.innerText = `VECTOR -> ${subnet}.${pointer}\nSTATUS -> POLLED\nBUFFER -> RET_OK`;
    if (Math.random() > 0.88 && registry.length < 12) {
        const ip = `${subnet}.${pointer}`; let node = registry.find(n => n.ip === ip);
        if (!node) {
            const os = ["Linux Enterprise Core", "Embedded Linux OS", "Cisco Router IOS", "Windows Cluster Node", "Android Subsystem Mesh"];
            node = { ip: ip, mac: genMAC(), os: os[Math.floor(Math.random()*os.length)], ping: Math.floor(Math.random()*30)+1, ang: Math.random()*360, dist: 0.22+Math.random()*0.6, int: 0.0 };
            registry.push(node); addProfile(node); logK(`[ACQUIRED] Target node locked -> ${node.ip}`);
        }
        document.getElementById('nodeCount').innerText = `${registry.length} OPERATIONAL`;
    }
    pointer += Math.floor(Math.random()*6)+1; scanTimeout = setTimeout(loopScan, delaySpeed);
}
function genMAC() { const h = '0123456789ABCDEF'; let m = ''; for (let i = 0; i < 6; i++) { m += h[Math.floor(Math.random()*16)] + h[Math.floor(Math.random()*16)]; if (i < 5) m += ':'; } return m; }
function addProfile(d) { const p = document.getElementById('profileBox'); if (p.innerHTML.includes("Run sequence")) p.innerHTML = ""; const b = document.createElement('div'); b.style = "border:1px solid rgba(255,255,255,0.1); padding:5px; margin-bottom:5px; border-radius:8px; background:rgba(255,255,255,0.02); font-size:10px;"; b.innerHTML = `<div>HOST: ${d.ip}</div><div>BSSID: ${d.mac}</div><div>KERNEL: ${d.os}</div><div>DELAY: <span style="color:#ffbb00;">${d.ping} ms</span></div>`; p.appendChild(b); p.scrollTop = p.scrollHeight; }

function animRadar() {
    if (!rCanvas) return; const cx = rCanvas.width / 2, cy = rCanvas.height / 2, maxR = Math.min(cx, cy) - 15;
    rCtx.clearRect(0, 0, rCanvas.width, rCanvas.height);
    if (maxR > 10) {
        rCtx.strokeStyle = 'rgba(255,255,255,0.05)'; rCtx.lineWidth = 1;
        for (let r = maxR/3; r <= maxR; r += maxR/3) { rCtx.beginPath(); rCtx.arc(cx,cy,r,0,2*Math.PI); rCtx.stroke(); }
        rCtx.beginPath(); rCtx.moveTo(cx-maxR,cy); rCtx.lineTo(cx+maxR,cy); rCtx.moveTo(cx,cy-maxR); rCtx.lineTo(cx,cy+maxR); rCtx.stroke();
        const rad = (rAngle * Math.PI) / 180, sx = cx + maxR * Math.cos(rad), sy = cy - maxR * Math.sin(rad);
        rCtx.strokeStyle = 'rgba(255,255,255,0.4)'; rCtx.lineWidth = 1.5; rCtx.beginPath(); rCtx.moveTo(cx,cy); rCtx.lineTo(sx,sy); rCtx.stroke();
        registry.forEach(n => {
            let d = Math.abs(rAngle - n.ang); if (d > 180) d = 360 - d;
            if (d < 5.0 && scanState === "RUNNING") n.int = 1.0;
            if (n.int > 0) {
                const nr = (n.ang * Math.PI)/180, rd = maxR * n.dist, tx = cx + rd * Math.cos(nr), ty = cy - rd * Math.sin(nr);
                rCtx.fillStyle = `rgba(255, 255, 255, ${n.int * 0.08})`; rCtx.beginPath(); rCtx.arc(tx,ty,12,0,2*Math.PI); rCtx.fill();
                rCtx.strokeStyle = `rgba(255, 255, 255, ${n.int * 0.25})`; rCtx.lineWidth = 1; rCtx.beginPath(); rCtx.arc(tx,ty,12,0,2*Math.PI); rCtx.stroke();
                rCtx.fillStyle = `rgba(255, 255, 255, ${n.int})`; rCtx.beginPath(); rCtx.arc(tx,ty,3,0,2*Math.PI); rCtx.fill();
                rCtx.fillStyle = `rgba(255, 255, 255, ${n.int * 0.8})`; rCtx.font = '9px Share Tech Mono'; rCtx.fillText(n.ip, tx + 16, ty + 3);
            }
        });
    }
    if (scanState === "RUNNING") { rAngle = (rAngle + (sweepRPM * 360)/(60*60)) % 360; }
    requestAnimationFrame(animRadar);
}

function drawWeb() {
    if (!wCanvas) return; const cx = wCanvas.width / 2, cy = wCanvas.height / 2; wCtx.clearRect(0,0,wCanvas.width,wCanvas.height); if (cx < 10) return;
    wCtx.fillStyle = 'rgba(255,255,255,0.15)'; wCtx.beginPath(); wCtx.arc(cx,cy,8,0,2*Math.PI); wCtx.fill();
    wCtx.strokeStyle = '#ffffff'; wCtx.stroke(); wCtx.fillStyle = '#ffffff'; wCtx.font = '9px Share Tech Mono'; wCtx.textAlign = 'center'; wCtx.fillText("GATEWAY", cx, cy - 14);
    const tot = registry.length;
    registry.forEach((n, i) => {
        const a = (360/Math.max(1,tot))*i, r = (a*Math.PI)/180, rd = Math.min(cx,cy)-35, nx = cx+rd*Math.cos(r), ny = cy-rd*Math.sin(r);
        wCtx.strokeStyle = 'rgba(255,255,255,0.06)'; wCtx.lineWidth = 1; wCtx.beginPath(); wCtx.moveTo(cx,cy); wCtx.lineTo(nx,ny); wCtx.stroke();
        wCtx.fillStyle = 'rgba(255, 255, 255, 0.05)'; wCtx.beginPath(); wCtx.arc(nx,ny,8,0,2*Math.PI); wCtx.fill();
        wCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; wCtx.beginPath(); wCtx.arc(nx,ny,8,0,2*Math.PI); wCtx.stroke();
        wCtx.fillStyle = '#ffffff'; wCtx.beginPath(); wCtx.arc(nx,ny,2.5,0,2*Math.PI); wCtx.fill();
        wCtx.fillStyle = 'rgba(255,255,255,0.7)'; wCtx.font = '9px Share Tech Mono'; wCtx.fillText(n.ip.split('.').pop(), nx, ny - 11);
    });
}
animRadar(); setInterval(drawWeb, 250);
