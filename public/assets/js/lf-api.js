/* Capa de datos: usa /api (Cloudflare) y, si no existe, el modo demo en localStorage. */
(function (g) {
  'use strict';
  var mode = null, health = null, ready = null;

  function detect() {
    if (ready) return ready;
    ready = new Promise(function (resolve) {
      if (location.protocol === 'file:') { mode = 'demo'; return resolve(); }
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
      fetch('/api/health', { cache: 'no-store', signal: ctl && ctl.signal, credentials: 'same-origin' })
        .then(function (r) { return r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : Promise.reject(); })
        .then(function (j) { if (j && j.ok) { mode = 'live'; health = j; } else mode = 'demo'; })
        .catch(function () { mode = 'demo'; })
        .then(function () { clearTimeout(to); resolve(); });
    });
    return ready;
  }

  function live(method, path, body) {
    var opts = { method: method, credentials: 'same-origin', headers: { 'x-lf': '1' } };
    if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch('/api' + path, opts).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      return (/json/.test(ct) ? r.json() : r.text()).then(function (data) { return { status: r.status, ok: r.ok, data: data }; });
    }).catch(function () { return { status: 0, ok: false, data: { ok: false, error: 'network' } }; });
  }

  function request(method, path, body) {
    return detect().then(function () { return mode === 'live' ? live(method, path, body) : g.LF.demo.handle(method, path, body); });
  }

  var MSG = {
    network: 'No pudimos conectar. Revisa tu internet e inténtalo de nuevo.', rate_limited: 'Demasiados intentos. Espera unos minutos.', bad_credentials: 'Correo o contraseña incorrectos.',
    email_taken: 'Ese correo ya tiene cuenta. Prueba entrar.', weak_password: 'La contraseña debe tener al menos 8 caracteres.', bad_email: 'Escribe un correo válido.', missing_name: 'Escribe tu nombre.',
    bad_whatsapp: 'Revisa tu WhatsApp (10 dígitos).', consent_required: 'Marca la casilla para poder contactarte.', missing_fields: 'Faltan datos por llenar.', captcha: 'No pudimos verificar que eres persona. Intenta de nuevo.',
    no_session: 'Tu sesión terminó. Entra de nuevo.', forbidden: 'No tienes permiso para esto.', code_not_found: 'Ese código no existe o ya se usó.', payment_provider_error: 'El proveedor de pagos no respondió. Intenta de nuevo o escríbenos.',
    server_error: 'Algo falló de nuestro lado. Intenta de nuevo.', csrf: 'Recarga la página e inténtalo otra vez.', already_setup: 'El administrador ya está configurado.', bad_token: 'Token incorrecto.', too_large: 'Los datos son demasiado grandes.'
  };
  function errText(res) { var k = res && res.data && res.data.error; return MSG[k] || (k ? 'No se pudo completar (' + k + ').' : MSG.server_error); }

  g.LF = g.LF || {};
  g.LF.api = {
    ready: detect, request: request, errText: errText,
    get: function (p) { return request('GET', p); }, post: function (p, b) { return request('POST', p, b || {}); },
    put: function (p, b) { return request('PUT', p, b || {}); }, patch: function (p, b) { return request('PATCH', p, b || {}); }, del: function (p) { return request('DELETE', p); },
    mode: function () { return mode; }, health: function () { return health; }
  };
})(window);
