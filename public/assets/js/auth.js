/* Entrar / crear cuenta / configurar administrador */
(function (g) {
  'use strict';
  var api = g.LF.api, ui = g.LF.ui, S = g.LF.shared, e = S.esc;
  var view = document.getElementById('view'), q = new URLSearchParams(location.search), mode = q.get('mode') === 'register' ? 'register' : 'login', getToken = function () { return ''; };

  function nextUrl(user) {
    var n = q.get('next');
    if (n && /^\/[^\/\\]/.test(n)) return n;
    return user && user.role === 'admin' ? '/admin.html' : '/dashboard.html';
  }
  function F(label, name, type, ac, extra) { return '<label class="fld"><span>' + label + '</span><input name="' + name + '" type="' + type + '" autocomplete="' + ac + '" required ' + (extra || '') + '></label>'; }

  function render() {
    var h = api.health() || {}, demo = api.mode() === 'demo';
    var tabs = '<div class="seg" role="tablist"><button type="button" role="tab" data-m="login" aria-selected="' + (mode === 'login') + '">Entrar</button><button type="button" role="tab" data-m="register" aria-selected="' + (mode === 'register') + '">Crear cuenta</button></div>';
    var body;
    if (mode === 'setup') {
      body = '<h1>Configurar administrador</h1><p class="muted">Solo funciona una vez, con el token que definiste en Cloudflare (ADMIN_SETUP_TOKEN).</p><form id="f" novalidate>' + F('Token de configuración', 'token', 'password', 'off') + F('Tu nombre', 'name', 'text', 'name') + F('Correo', 'email', 'email', 'username') + F('Contraseña (mínimo 10)', 'password', 'password', 'new-password', 'minlength="10"') + '<p class="form-msg" id="msg"></p><button class="btn btn-primary block" type="submit"><span>Crear administrador</span></button></form><button class="link-btn" type="button" data-m="login">Volver</button>';
    } else if (mode === 'register') {
      body = '<h1>Crea tu cuenta</h1><p class="muted">Con tu cuenta contratas un paquete y ves tus resultados en tu panel.</p><form id="f" novalidate>' + F('Tu nombre', 'name', 'text', 'name', 'maxlength="80"') + '<label class="fld"><span>Tu negocio <em>(opcional)</em></span><input name="business" autocomplete="organization" maxlength="100"></label>' + F('Correo', 'email', 'email', 'username') + F('Contraseña (mínimo 8)', 'password', 'password', 'new-password', 'minlength="8"') + '<p class="form-msg" id="msg"></p><button class="btn btn-primary block" type="submit"><span>Crear cuenta</span></button></form><p class="hint">Al crear tu cuenta aceptas el <a href="/aviso-de-privacidad.html">aviso de privacidad</a> y los <a href="/terminos.html">términos</a>.</p>';
    } else {
      body = '<h1>Qué bueno verte</h1><p class="muted">Entra para ver tus campañas y resultados.</p><form id="f" novalidate>' + F('Correo', 'email', 'email', 'username') + F('Contraseña', 'password', 'password', 'current-password') + '<p class="form-msg" id="msg"></p><button class="btn btn-primary block" type="submit"><span>Entrar</span></button></form>' + (h.needsSetup ? '<button class="link-btn" type="button" data-m="setup">Primera vez: configurar administrador</button>' : '');
    }
    view.innerHTML = (mode === 'setup' ? '' : tabs) + body + (demo ? '<p class="alert">Modo demo: la primera cuenta que crees será administradora y los datos viven solo en este navegador.</p>' : '');
    var f = document.getElementById('f'); getToken = ui.captcha(f);
    f.addEventListener('submit', submit);
  }

  function submit(ev) {
    ev.preventDefault();
    var f = ev.target, msg = document.getElementById('msg'), btn = f.querySelector('[type=submit]'), d = {};
    new FormData(f).forEach(function (v, k) { d[k] = v; });
    msg.className = 'form-msg';
    if (!f.checkValidity()) { msg.className = 'form-msg err'; msg.textContent = 'Revisa los campos: ' + (f.querySelector(':invalid').closest('label').querySelector('span').textContent); f.querySelector(':invalid').focus(); return; }
    d.turnstile = getToken(); btn.disabled = true;
    var path = mode === 'setup' ? '/auth/setup-admin' : mode === 'register' ? '/auth/register' : '/auth/login';
    api.post(path, d).then(function (r) {
      btn.disabled = false;
      if (r.ok) { ui.track && ui.track(mode === 'register' ? 'sign_up' : 'login'); location.href = nextUrl(r.data.user || { role: 'admin' }); return; }
      msg.className = 'form-msg err'; msg.textContent = api.errText(r); ui.captchaReset(f);
    });
  }

  view.addEventListener('click', function (ev) { var b = ev.target.closest('[data-m]'); if (b) { mode = b.dataset.m; render(); var i = view.querySelector('input'); if (i) i.focus(); } });
  api.ready().then(function () { return api.get('/me'); }).then(function (r) {
    if (r.data && r.data.user && mode !== 'setup') { location.replace(nextUrl(r.data.user)); return; }
    ui.demoBanner(); render();
  });
})(window);
