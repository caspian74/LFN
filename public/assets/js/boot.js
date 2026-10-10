/* Se ejecuta en <head>: marca JS activo y guarda UTM de la primera visita. */
(function () {
  var d = document.documentElement; d.classList.add('js');
  try {
    var q = new URLSearchParams(location.search), keep = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'], u = {}, any = false;
    keep.forEach(function (k) { if (q.get(k)) { u[k] = q.get(k).slice(0, 120); any = true; } });
    if (any) sessionStorage.setItem('lf_utm', JSON.stringify(u));
    if (!sessionStorage.getItem('lf_landing')) sessionStorage.setItem('lf_landing', location.pathname.slice(0, 120));
  } catch (e) { /* almacenamiento bloqueado */ }
})();
