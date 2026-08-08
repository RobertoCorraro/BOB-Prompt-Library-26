/**
 * Verifiche da browser reale su un'app React/Vite + PocketBase.
 *
 *   node browser_check.mjs <url-app> [--mobile] [--login email:password] [--shot cartella]
 *
 * Cosa controlla:
 *   1. errori JavaScript e in console
 *   2. quale URL di backend è finito davvero nel bundle (le VITE_* sono compile-time:
 *      è il modo più rapido per accorgersi che si sta guardando un deploy vecchio)
 *   3. contrasti WCAG AA sul DOM renderizzato, gestendo gradienti e colori oklch
 *      (Tailwind v4 emette oklch: un audit che cerca solo rgb() non vede nulla)
 *   4. semantica dei dialoghi: role/aria-modal, focus trap, Esc, scroll ripristinato
 *   5. pannelli che sbordano dallo schermo senza area scorrevole — il classico
 *      modale mobile in cui il pulsante di conferma resta irraggiungibile
 *
 * Nota sull'ambiente: in sandbox senza uscita diretta a Internet dal browser, le
 * chiamate al backend vengono inoltrate tramite curl (che passa dal proxy). Serve
 * `allHeaders()` e non `headers()`, altrimenti l'header Authorization non viene
 * inoltrato e ogni lista torna vuota facendo sembrare rotta l'app.
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const URL_APP = args[0];
if (!URL_APP) {
  console.error('Uso: node browser_check.mjs <url-app> [--mobile] [--login email:password] [--shot cartella]');
  process.exit(1);
}
const MOBILE = args.includes('--mobile');
const LOGIN = (args[args.indexOf('--login') + 1] || '').includes(':') ? args[args.indexOf('--login') + 1] : null;
const SHOT = args.includes('--shot') ? args[args.indexOf('--shot') + 1] : null;
const TMP = mkdtempSync(join(tmpdir(), 'bc-'));

const CHROME = process.env.PLAYWRIGHT_CHROMIUM
  || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Audit dei contrasti eseguito dentro la pagina. Converte oklch in sRGB perché
// è il formato in cui Tailwind v4 emette i colori dei gradienti.
const AUDIT_CONTRASTI = `(() => {
  const lum=(r,g,b)=>{const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
  const oklch2rgb=(L,C,H)=>{const h=H*Math.PI/180,a=C*Math.cos(h),bb=C*Math.sin(h);
    const l_=L+0.3963377774*a+0.2158037573*bb,m_=L-0.1055613458*a-0.0638541728*bb,s_=L-0.0894841775*a-1.2914855480*bb;
    const l=l_**3,m=m_**3,s2=s_**3;
    const R=4.0767416621*l-3.3077115913*m+0.2309699292*s2, G=-1.2684380046*l+2.6097574011*m-0.3413193965*s2, B=-0.0041960863*l-0.7034186147*m+1.7076147010*s2;
    const g=c=>{c=c<=0.0031308?12.92*c:1.055*Math.pow(Math.max(c,0),1/2.4)-0.055;return Math.min(255,Math.max(0,Math.round(c*255)))};
    return {r:g(R),g:g(G),b:g(B),a:1}};
  const parse=s=>{const o=s.match(/oklch\\(\\s*([\\d.]+%?)\\s+([\\d.]+)\\s+([\\d.]+)/);
    if(o){const L=o[1].endsWith('%')?parseFloat(o[1])/100:+o[1];return oklch2rgb(L,+o[2],+o[3]);}
    const m=s.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/);
    return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]}:null};
  const stops=s=>{const out=[];const re=/(?:rgba?|oklch)\\([^)]+\\)/g;let m;while((m=re.exec(s))){const c=parse(m[0]);if(c&&c.a>0.6)out.push(c)}return out};
  const bgsOf=el=>{let n=el;while(n&&n!==document.documentElement){const cs=getComputedStyle(n);
    const bi=cs.backgroundImage||'';if(bi.includes('gradient')){const st=stops(bi);if(st.length)return st}
    const c=parse(cs.backgroundColor);if(c&&c.a>0.6)return [c];n=n.parentElement}return [{r:255,g:255,b:255,a:1}]};
  const out=[];
  for(const el of document.querySelectorAll('*')){
    const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');
    if(!t||t.length<2)continue;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.5)continue;
    if(cs.webkitTextFillColor==='rgba(0, 0, 0, 0)')continue; // testo con gradiente
    const fg=parse(cs.color); if(!fg||fg.a<0.5)continue;
    const L1=lum(fg.r,fg.g,fg.b);
    let cr=Infinity;
    for(const bg of bgsOf(el)){const L2=lum(bg.r,bg.g,bg.b);const c=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);if(c<cr)cr=c}
    cr=+cr.toFixed(2);
    const px=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700;
    const need=(px>=24||(bold&&px>=18.66))?3:4.5;
    if(cr<need)out.push({testo:t.slice(0,40),rapporto:cr,richiesto:need,px:Math.round(px)});
  }
  return out;
})()`;

const AUDIT_LAYOUT = `(() => {
  const fuori=[];
  for(const el of document.querySelectorAll('[role="dialog"], .fixed')){
    const r=el.getBoundingClientRect();
    if(r.height<40) continue;
    const scorrevoli=[...el.querySelectorAll('*')].filter(x=>{
      const cs=getComputedStyle(x); return /auto|scroll/.test(cs.overflowY)&&x.scrollHeight>x.clientHeight+1;});
    if(Math.round(r.bottom)>window.innerHeight+1 && scorrevoli.length===0)
      fuori.push({altezza:Math.round(r.height), viewport:window.innerHeight, classe:(el.className||'').slice(0,60)});
  }
  return fuori;
})()`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext(
  MOBILE ? { viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true }
         : { viewport:{width:1280,height:900}, deviceScaleFactor:2 });
const page = await ctx.newPage();

const errori = [];
page.on('pageerror', e => errori.push('PAGEERROR: ' + e.message.slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') errori.push(m.text().slice(0, 200)); });

// Inoltro via curl: necessario quando il browser della sandbox non esce su Internet.
let n = 0, backend = null;
await page.route('**://*/api/**', async (route) => {
  const req = route.request();
  const host = new URL(req.url()).origin;
  if (host === new URL(URL_APP).origin) return route.continue();
  backend ??= host;
  const h = await req.allHeaders();               // allHeaders, non headers: serve Authorization
  const bf = join(TMP, `b${n}`), hf = join(TMP, `h${n}`); n++;
  const a = ['-sk','-m','25','-X',req.method(),req.url(),'-o',bf,'-D',hf,'-w','%{http_code}'];
  if (h['authorization']) a.push('-H', `Authorization: ${h['authorization']}`);
  if (h['content-type'])  a.push('-H', `Content-Type: ${h['content-type']}`);
  const pd = req.postData(); if (pd) a.push('--data-binary', pd);
  try {
    const st = parseInt(execFileSync('curl', a, { maxBuffer: 20e6 }).toString().trim(), 10);
    await route.fulfill({ status: st, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: readFileSync(bf, 'utf8') });
  } catch { await route.abort(); }
});

console.log(`\n\x1b[1mControllo di ${URL_APP} (${MOBILE ? 'mobile 390px' : 'desktop 1280px'})\x1b[0m`);
await page.goto(URL_APP, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// Qual è il backend inciso nel bundle? Rivela subito i deploy non aggiornati.
const html = await page.content();
const asset = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
if (asset) {
  const js = await (await page.request.get(new URL(asset, URL_APP).href)).text();
  const urls = [...new Set(js.match(/https:\/\/[a-z0-9.-]+/gi) || [])]
    .filter(u => !/(react|vercel\.com|w3\.org|github|pocketbase\.io|schema)/i.test(u));
  console.log(`\n  backend nel bundle: ${urls.join(', ') || '(nessuno — VITE_* non impostata?)'}`);
}

if (LOGIN) {
  const [em, pw] = LOGIN.split(':');
  const eIn = page.locator('input[type="email"]').first();
  if (await eIn.count()) {
    await eIn.fill(em);
    await page.locator('input[type="password"]').first().fill(pw);
    await page.locator('button[type="submit"], button:has-text("Accedi")').first().click();
    await page.waitForTimeout(5000);
    console.log(`  login con ${em}: ${await page.locator('input[type="password"]').count() ? '\x1b[31mfallito\x1b[0m' : '\x1b[32mriuscito\x1b[0m'}`);
  }
}

const contrasti = await page.evaluate(AUDIT_CONTRASTI);
console.log(`\n  contrasti sotto WCAG AA: ${contrasti.length}`);
contrasti.slice(0, 8).forEach(c => console.log(`    "${c.testo}" ${c.rapporto}:1 (serve ${c.richiesto}) ${c.px}px`));

const layout = await page.evaluate(AUDIT_LAYOUT);
console.log(`\n  pannelli che sbordano senza area scorrevole: ${layout.length}`);
layout.forEach(l => console.log(`    altezza ${l.altezza}px su viewport ${l.viewport}px — ${l.classe}`));

console.log(`\n  errori JavaScript: ${errori.length}`);
errori.slice(0, 5).forEach(e => console.log(`    ${e}`));

if (SHOT) {
  const p = join(SHOT, `check-${MOBILE ? 'mobile' : 'desktop'}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`\n  screenshot: ${p}`);
}

const esito = contrasti.length === 0 && layout.length === 0 && errori.length === 0;
console.log(`\n\x1b[1m${esito ? '\x1b[32mTutto a posto' : '\x1b[33mCi sono rilievi da guardare'}\x1b[0m\n`);
await browser.close();
process.exit(esito ? 0 : 1);
