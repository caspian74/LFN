import asyncio, sys, json, urllib.request
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8788'
SH='/home/claude/shots/'
errs=[]; fails=0
def check(c,m):
    global fails
    if not c: fails+=1; print('  ✗',m)
    else: print('  ✓',m)
def post(path,body,cookie=None):
    req=urllib.request.Request(BASE+'/api'+path,data=json.dumps(body).encode(),headers={'content-type':'application/json','x-lf':'1','origin':BASE})
    return urllib.request.urlopen(req)
def watch(pg,tag):
    pg.on('pageerror',lambda e: errs.append(f'[{tag}] PAGEERR {e}'))
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.text}') if m.type=='error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        # --- visitante
        ctx=await b.new_context(viewport={'width':1280,'height':800}); pg=await ctx.new_page(); watch(pg,'home')
        await pg.goto(BASE+'/?utm_source=ig&utm_campaign=test'); await pg.wait_for_timeout(600)
        check(await pg.locator('h1').inner_text()!='', 'home h1')
        await pg.fill('#lead-form [name=name]','Ana Pérez'); await pg.fill('#lead-form [name=business]','Clínica Sol'); await pg.fill('#lead-form [name=whatsapp]','664 123 4567')
        await pg.check('#lead-form [name=consent]'); await pg.click('#lead-form [type=submit]'); await pg.wait_for_selector('#lead-msg.ok',timeout=5000)
        check('recibimos' in (await pg.inner_text('#lead-msg')).lower(),'lead enviado desde formulario')
        await pg.fill('#c-ads','8000'); check(await pg.inner_text('#o-leads')=='133','calculadora recalcula (133 leads)')
        # menú móvil
        await pg.set_viewport_size({'width':390,'height':800}); await pg.click('#burger'); await pg.wait_for_timeout(450)
        check(await pg.evaluate("document.getElementById('nav').classList.contains('open')"),'menú móvil abre'); await pg.screenshot(path=SH+'menu.png')
        await pg.keyboard.press('Escape'); await pg.set_viewport_size({'width':1280,'height':800})
        # --- registro y compra
        await pg.goto(BASE+'/auth.html?mode=register'); await pg.wait_for_selector('#f')
        await pg.fill('[name=name]','Cliente Uno'); await pg.fill('[name=business]','Dental Sol'); await pg.fill('[name=email]','uno@ejemplo.com'); await pg.fill('[name=password]','clave-larga-123')
        await pg.click('#f [type=submit]'); await pg.wait_for_url('**/dashboard.html',timeout=6000); await pg.wait_for_selector('.app')
        check(True,'registro redirige a dashboard')
        for v in ['resumen','campanas','contenido','seo','pagos','soporte','cuenta']:
            await pg.click(f'.side [data-v={v}]'); await pg.wait_for_timeout(150)
            check(await pg.locator('#view h1').count()==1,f'portal vista {v}')
        await pg.click('.side [data-v=pagos]'); await pg.click('[data-buy=crecimiento]'); await pg.wait_for_selector('dialog[open]')
        check('pedido #1' in (await pg.inner_text('dialog[open]')).lower(),'compra manual muestra pedido'); await pg.screenshot(path=SH+'buy.png')
        await pg.click('dialog[open] button'); 
        await pg.click('.side [data-v=soporte]'); await pg.fill('#tkf [name=subject]','Duda'); await pg.fill('#tkf [name=body]','¿Cómo apruebo?'); await pg.click('#tkf [type=submit]'); await pg.wait_for_selector('#thread',timeout=5000)
        check(True,'ticket creado y abierto')
        # --- admin
        try: post('/auth/setup-admin',{'token':'dev-setup-token','email':'admin@ejemplo.com','name':'Admin','password':'admin-clave-larga'})
        except Exception as ex: print('setup',ex)
        a=await b.new_context(viewport={'width':1360,'height':860}); ap=await a.new_page(); watch(ap,'admin')
        await ap.goto(BASE+'/admin.html'); await ap.wait_for_url('**/auth.html**'); await ap.wait_for_selector('#f')
        await ap.fill('[name=email]','admin@ejemplo.com'); await ap.fill('[name=password]','admin-clave-larga'); await ap.click('#f [type=submit]')
        await ap.wait_for_url('**/admin.html',timeout=6000); await ap.wait_for_selector('.app'); await ap.wait_for_selector('.stat'); await ap.screenshot(path=SH+'admin-resumen.png')
        for v in ['clientes','leads','pedidos','tickets','usuarios','herramientas','ajustes','sitio','resumen']:
            await ap.click(f'.side [data-v={v}]'); await ap.wait_for_timeout(500)
            check(await ap.locator('#view h1').count()>=1,f'admin vista {v}')
            if v=='leads': await ap.screenshot(path=SH+'admin-leads.png')
            if v=='sitio': await ap.wait_for_selector('#pv'); await ap.wait_for_timeout(700); await ap.screenshot(path=SH+'admin-sitio.png')
        # pedido: marcar pagado
        await ap.click('.side [data-v=pedidos]'); await ap.wait_for_selector('[data-a=opay]'); await ap.click('[data-a=opay]'); await ap.wait_for_selector('dialog[open] .btn-primary'); await ap.click('dialog[open] .btn-primary'); await ap.wait_for_timeout(600)
        check(await ap.locator('.tbl .tag.ok').count()>=1,'pedido marcado pagado')
        # editar cliente
        await ap.click('.side [data-v=clientes]'); await ap.wait_for_selector('tr[data-open]'); await ap.click('tr[data-open]'); await ap.wait_for_selector('.drawer.on .tabs button')
        await ap.screenshot(path=SH+'admin-cliente.png')
        await ap.click('.drawer [data-t=campanas]'); await ap.click('[data-c=add][data-l=campaigns]'); await ap.fill('.sub-row [data-p="data.campaigns.0.name"]','Campaña E2E'); await ap.fill('.sub-row [data-p="data.campaigns.0.leads"]','42')
        await ap.click('.drawer [data-t=resultados]'); await ap.click('[data-c=seed]'); await ap.screenshot(path=SH+'admin-resultados.png')
        await ap.click('.drawer [data-t=contenido]'); await ap.click('[data-c=add][data-l=content]'); await ap.fill('.sub-row [data-p="data.content.0.title"]','Reel E2E'); await ap.select_option('.sub-row [data-p="data.content.0.status"]','por aprobar')
        await ap.click('[data-c=save]'); await ap.wait_for_timeout(800)
        # cliente ve los cambios (polling manual: recargar)
        await pg.goto(BASE+'/dashboard.html#campanas'); await pg.reload(); await pg.wait_for_selector('.app'); await pg.wait_for_timeout(300)
        check('Campaña E2E' in await pg.inner_text('#view'),'cliente ve campaña editada por admin')
        await pg.click('.side [data-v=contenido]'); check('Reel E2E' in await pg.inner_text('#view'),'cliente ve contenido nuevo')
        await pg.click('[data-appr]'); await pg.wait_for_timeout(700); check('aprobado' in await pg.inner_text('#view'),'cliente aprueba contenido')
        await pg.click('.side [data-v=resumen]'); await pg.wait_for_timeout(400); await pg.screenshot(path=SH+'portal-resumen.png')
        await pg.set_viewport_size({'width':390,'height':844}); await pg.wait_for_timeout(300); await pg.screenshot(path=SH+'portal-m.png')
        # editor del sitio
        await ap.click('.side [data-v=sitio]'); await ap.wait_for_selector('[data-sp="hero.title"]')
        await ap.fill('[data-sp="hero.title"]','Título editado por el admin ||E2E||'); await ap.wait_for_timeout(600)
        pv=ap.frame_locator('#pv').locator('h1'); check('Título editado' in await pv.inner_text(),'vista previa en vivo')
        await ap.click('[data-s=save]'); await ap.wait_for_timeout(800)
        v=await b.new_context(viewport={'width':1280,'height':800}); vp=await v.new_page(); watch(vp,'home2')
        await vp.goto(BASE+'/'); await vp.wait_for_timeout(1200)
        check('Título editado' in await vp.inner_text('h1'),'home refleja cambio publicado desde admin')
        # admin móvil
        await ap.set_viewport_size({'width':390,'height':844}); await ap.click('.mnav [data-v=clientes]'); await ap.wait_for_timeout(500); await ap.screenshot(path=SH+'admin-m.png')
        await b.close()
    print('\nERRORES DE CONSOLA:' if errs else '\nsin errores de consola'); print('\n'.join(errs[:20])); print(f'fallas: {fails}')
asyncio.run(main())
