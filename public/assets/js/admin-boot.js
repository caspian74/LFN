/* Arranque del admin: verifica sesión y rol antes de mostrar nada */
(function (g) {
  'use strict';
  var api = g.LF.api, ui = g.LF.ui, A = g.LF.admin, S = g.LF.shared;
  function gate(title, text, link, linkText) {
    document.getElementById('root').innerHTML = '<div class="center-page"><div class="auth-card"><h1>' + title + '</h1><p class="muted">' + text + '</p><a class="btn btn-primary" href="' + link + '"><span>' + linkText + '</span></a></div></div>';
  }
  api.ready().then(function () { ui.demoBanner(); return api.get('/me'); }).then(function (r) {
    var u = r.data && r.data.user;
    if (!u) { location.replace('/auth.html?next=' + encodeURIComponent('/admin.html')); return; }
    if (u.role !== 'admin') return gate('Solo para administradores', 'Tu cuenta no tiene permisos de administrador.', '/dashboard.html', 'Ir a mi panel');
    A.st.user = u;
    return api.get('/content').then(function (c) {
      A.st.content = S.resolveContent(c.data && c.data.content);
      A.shell();
      var h = location.hash.slice(1); A.st.view = A.views[h] ? h : 'resumen'; A.render();
      window.addEventListener('hashchange', function () { var n = location.hash.slice(1); if (A.views[n] && n !== A.st.view) A.go(n); });
    });
  });
})(window);
