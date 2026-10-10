/* Piezas compartidas por el portal y el admin: iconos, gráficas, pestañas, cajón lateral. */
(function (g) {
  'use strict';
  var S = g.LF.shared, e = S.esc;
  var P = {
    home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.700 2 6.500 5.500M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.800c1.800.700 3 2.400 3.500 5.200"/>',
    inbox: '<path d="M3 13h5l1.500 3h5L16 13h5"/><path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5l2-8Z"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    tool: '<path d="M14.500 6.500a4 4 0 0 0 5 5L10 21a2.100 2.100 0 0 1-3-3l9.500-9.500Z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>',
    out: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="m6 6 12 12M18 6 6 18"/>', up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    wa: '<path d="M20 12a8 8 0 0 1-11.900 7L4 20l1.100-4A8 8 0 1 1 20 12Z"/><path d="M9 8.500c0 3.500 3 6.500 6.500 6.500l1-1.600-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 8.500Z"/>',
    eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', phone: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>', history: '<path d="M3 12a9 9 0 1 0 3-6.700L3 8M3 3v5h5M12 7v5l3 2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.500" cy="8.500" r="1"/>'
  };
  function ic(n, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.tag) + '</svg>'; }

  var COL = ['#FF3B5C', '#6C4DFF', '#3DDBB0', '#FFC93C', '#FF8FB1'];

  /* ---- gráficas SVG ---- */
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function shortDate(d) { if (!d) return ''; var p = String(d).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : d; }
  function line(rows, series, opts) {
    opts = opts || {};
    var W = 640, H = opts.h || 220, pl = 38, pr = 10, pt = 10, pb = 24, n = rows.length;
    if (n < 2) return '<div class="empty"><strong>Aún no hay datos</strong>Cuando se carguen resultados diarios verás aquí la gráfica.</div>';
    var max = niceMax(Math.max.apply(null, [0].concat(series.map(function (s) { return Math.max.apply(null, rows.map(function (r) { return +r[s.key] || 0; })); }))));
    var x = function (i) { return pl + i * (W - pl - pr) / (n - 1); }, y = function (v) { return pt + (1 - v / max) * (H - pt - pb); };
    var grid = '';
    for (var k = 0; k <= 4; k++) { var gv = max * k / 4, gy = y(gv); grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="rgba(23,17,46,.08)"/><text x="' + (pl - 6) + '" y="' + (gy + 3) + '" text-anchor="end">' + (gv >= 1000 ? Math.round(gv / 100) / 10 + 'k' : Math.round(gv)) + '</text>'; }
    var xl = [0, Math.floor((n - 1) / 2), n - 1].map(function (i) { return '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + e(shortDate(rows[i].date)) + '</text>'; }).join('');
    var paths = series.map(function (s, si) {
      var d = rows.map(function (r, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(+r[s.key] || 0).toFixed(1); }).join(' ');
      var fill = si === 0 ? '<path d="' + d + ' L' + x(n - 1) + ' ' + (H - pb) + ' L' + x(0) + ' ' + (H - pb) + ' Z" fill="' + s.color + '" opacity=".12"/>' : '';
      return fill + '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
    }).join('');
    var meta = { rows: rows.map(function (r) { var o = { date: r.date }; series.forEach(function (s) { o[s.key] = +r[s.key] || 0; }); return o; }), series: series, W: W, H: H, pl: pl, pr: pr };
    return '<div class="chart-box" data-chart="' + e(JSON.stringify(meta)) + '"><div class="legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + e(s.label) + '</span>'; }).join('') + '</div>' +
      '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(opts.label || 'Gráfica') + '">' + grid + xl + paths + '<line class="cur" y1="' + pt + '" y2="' + (H - pb) + '" stroke="rgba(23,17,46,.35)" stroke-dasharray="3 3" style="display:none"/></svg><div class="tip"></div></div>';
  }
  function bindCharts(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-chart]'), function (box) {
      if (box._b) return; box._b = 1;
      var m = JSON.parse(box.dataset.chart), svg = box.querySelector('svg'), tip = box.querySelector('.tip'), cur = box.querySelector('.cur');
      function mv(ev) {
        var r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * m.W, n = m.rows.length;
        var i = Math.max(0, Math.min(n - 1, Math.round((px - m.pl) / (m.W - m.pl - m.pr) * (n - 1)))), row = m.rows[i];
        var xx = m.pl + i * (m.W - m.pl - m.pr) / (n - 1);
        cur.setAttribute('x1', xx); cur.setAttribute('x2', xx); cur.style.display = '';
        tip.innerHTML = '<b>' + e(shortDate(row.date)) + '</b> ' + m.series.map(function (s) { return e(s.label) + ' ' + S.num(row[s.key]); }).join(' · ');
        tip.style.left = Math.max(60, Math.min(r.width - 60, xx / m.W * r.width)) + 'px'; tip.style.top = '30px'; tip.style.opacity = 1;
      }
      svg.addEventListener('pointermove', mv); svg.addEventListener('pointerdown', mv);
      svg.addEventListener('pointerleave', function () { tip.style.opacity = 0; cur.style.display = 'none'; });
    });
  }
  function bars(vals, labels, color) {
    var W = 420, H = 120, n = vals.length, max = Math.max.apply(null, vals.concat([1])), bw = (W - 8) / n;
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + (H + 18) + '" role="img" aria-label="Barras">' + vals.map(function (v, i) {
      var h = v / max * (H - 8); return '<rect x="' + (4 + i * bw + 2) + '" y="' + (H - h) + '" width="' + (bw - 4) + '" height="' + Math.max(h, 2) + '" rx="4" fill="' + (color || '#6C4DFF') + '"><title>' + e(labels[i]) + ': ' + v + '</title></rect>';
    }).join('') + '<text x="4" y="' + (H + 14) + '">' + e(shortDate(labels[0])) + '</text><text x="' + (W - 4) + '" y="' + (H + 14) + '" text-anchor="end">' + e(shortDate(labels[n - 1])) + '</text></svg>';
  }
  function donut(parts) {
    var tot = parts.reduce(function (a, p) { return a + p.v; }, 0), R = 42, C = 2 * Math.PI * R, off = 0;
    if (!tot) return '<div class="empty">Sin datos</div>';
    var arcs = parts.map(function (p, i) { var len = p.v / tot * C, s = '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="' + COL[i % 5] + '" stroke-width="16" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 60 60)"/>'; off += len; return s; }).join('');
    return '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 120 120" width="130" height="130" role="img" aria-label="Distribución">' + arcs + '</svg><div class="list" style="gap:6px">' + parts.map(function (p, i) { return '<div class="hint"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + COL[i % 5] + ';margin-right:8px"></i>' + e(p.l) + ' · <b>' + S.num(p.v) + '</b></div>'; }).join('') + '</div></div>';
  }

  var TAGS = { activa: 'ok', activo: 'ok', pagado: 'ok', publicado: 'ok', aprobado: 'ok', resuelto: 'ok', ganado: 'ok', pausada: 'warn', pausado: 'warn', pendiente: 'warn', 'por aprobar': 'warn', onboarding: 'info', nuevo: 'info', abierto: 'info', 'en proceso': 'warn', 'cambios solicitados': 'bad', cancelado: 'bad', perdido: 'bad', finalizada: 'bad' };
  function tag(s) { return '<span class="tag ' + (TAGS[s] || '') + '">' + e(s) + '</span>'; }
  function stat(label, val, small, color) { return '<div class="stat" style="--k:' + (color || 'var(--accent)') + '"><span>' + e(label) + '</span><strong>' + e(val) + '</strong>' + (small ? '<small>' + small + '</small>' : '') + '</div>'; }
  function delta(cur, prev, invert) {
    if (!prev) return ''; var d = (cur - prev) / prev * 100, good = invert ? d <= 0 : d >= 0;
    return '<span class="' + (good ? 'up' : 'down') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(d)) + '% vs. periodo anterior</span>';
  }
  function csvDownload(name, text) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function copy(text) { return (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { g.LF.ui.toast('Copiado'); }, function () { g.LF.ui.toast('No se pudo copiar'); }); }

  /* cajón lateral */
  function Drawer() {
    var scrim = document.createElement('div'), dr = document.createElement('aside'), lastFocus = null;
    scrim.className = 'scrim'; dr.className = 'drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-hidden', 'true');
    document.body.appendChild(scrim); document.body.appendChild(dr);
    var api = {
      el: dr, onClose: null,
      open: function (html) { lastFocus = document.activeElement; dr.innerHTML = html; dr.setAttribute('aria-hidden', 'false'); scrim.classList.add('on'); dr.classList.add('on'); document.body.style.overflow = 'hidden'; var f = dr.querySelector('[autofocus],input,select,textarea,button'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60); },
      close: function () { dr.classList.remove('on'); scrim.classList.remove('on'); dr.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); if (api.onClose) api.onClose(); },
      isOpen: function () { return dr.classList.contains('on'); }
    };
    scrim.addEventListener('click', function () { if (api.requestClose) api.requestClose(); else api.close(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && api.isOpen() && !document.querySelector('dialog[open]')) { if (api.requestClose) api.requestClose(); else api.close(); } });
    return api;
  }

  function field(label, name, val, o) {
    o = o || {}; var t = o.type || 'text', v = e(val == null ? '' : val), a = ' name="' + name + '"' + (o.req ? ' required' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.ph ? ' placeholder="' + e(o.ph) + '"' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.attrs || '');
    var inner = t === 'textarea' ? '<textarea' + a + ' rows="' + (o.rows || 3) + '">' + v + '</textarea>'
      : t === 'select' ? '<select' + a + '>' + o.options.map(function (op) { var ov = Array.isArray(op) ? op[0] : op, ol = Array.isArray(op) ? op[1] : op; return '<option value="' + e(ov) + '"' + (String(ov) === String(val) ? ' selected' : '') + '>' + e(ol) + '</option>'; }).join('') + '</select>'
      : '<input type="' + t + '"' + (t === 'number' ? ' inputmode="decimal" step="any"' : '') + a + ' value="' + v + '">';
    return '<label class="fld' + (o.cls ? ' ' + o.cls : '') + '"><span>' + e(label) + (o.opt ? ' <em>(opcional)</em>' : '') + '</span>' + inner + '</label>';
  }

  g.LF.kit = { ic: ic, line: line, bars: bars, donut: donut, bindCharts: bindCharts, tag: tag, stat: stat, delta: delta, csvDownload: csvDownload, copy: copy, Drawer: Drawer, field: field, shortDate: shortDate, COL: COL };
})(window);
