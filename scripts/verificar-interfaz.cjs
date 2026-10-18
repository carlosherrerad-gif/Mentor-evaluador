// Verifica la navegación contra el servidor local, bloqueando recursos externos.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const runtime = process.env.MENTOR_NODE_MODULES;
const runtimeRequire = runtime ? createRequire(path.join(runtime, '__mentor__.cjs')) : require;
const { chromium } = runtimeRequire('playwright');

(async () => {
  const native = Boolean(process.env.MENTOR_CDP);
  const browser = native
    ? await chromium.connectOverCDP(process.env.MENTOR_CDP)
    : await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = native
      ? browser.contexts()[0].pages()[0]
      : await browser.newPage({ viewport: { width: 1280, height: 850 } });
    if (!page) throw new Error('No se encontró la ventana de Méntor');
    const errors = [];
    const external = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (!['127.0.0.1', 'tauri.localhost', 'ipc.localhost'].includes(url.hostname)) { external.push(url.href); return route.abort(); }
      return route.continue();
    });
    if (native) {
      await page.context().setOffline(true);
      await page.reload({ waitUntil: 'networkidle' });
    } else {
      await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    }
    const buttons = page.getByRole('navigation').getByRole('button');
    if (await buttons.count() !== 7) throw new Error('Se esperaban siete módulos');
    const modules = [];
    for (let i = 0; i < 7; i++) {
      await buttons.nth(i).click();
      if (await buttons.nth(i).getAttribute('aria-current') !== 'page') throw new Error('Selección incorrecta');
      const title = await page.getByRole('heading', { level: 1 }).innerText();
      if (!title) throw new Error('Falta título de módulo');
      modules.push({ module: await buttons.nth(i).innerText(), title });
    }
    await buttons.nth(0).click();
    await page.context().setOffline(true);
    await buttons.nth(3).click();
    if (await buttons.nth(3).getAttribute('aria-current') !== 'page') throw new Error('Falló navegación sin red');
    await buttons.nth(0).click();
    fs.mkdirSync(path.resolve('evidencia'), { recursive: true });
    await page.screenshot({ path: native ? 'evidencia/ventana-windows.png' : 'evidencia/interfaz-inicial.png', fullPage: true });
    if (errors.length || external.length) throw new Error(JSON.stringify({ errors, external }));
    const result = { status: 'aprobado', native, modules, errors, external, offlineNavigation: true,
      limitation: native
        ? 'WebView2 de Tauri: recarga y navegación con red emulada como desconectada. No certifica instalación en máquina limpia.'
        : 'Prueba en Edge del frontend ya cargado. No certifica arranque offline de Tauri ni instalación Windows.' };
    fs.writeFileSync(native ? 'evidencia/prueba-windows.json' : 'evidencia/prueba-interfaz.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
