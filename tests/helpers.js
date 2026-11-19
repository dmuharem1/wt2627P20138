(function () {
  'use strict';

  function dajEvidenciju() {
    if (typeof window.Evidencija === 'function') return window.Evidencija;
    try {
      if (typeof Evidencija === 'function') return Evidencija; // eslint-disable-line
    } catch (_) {}
    try {
      if (window.module && window.module.exports) {
        if (typeof window.module.exports === 'function') return window.module.exports;
        if (typeof window.module.exports.Evidencija === 'function') return window.module.exports.Evidencija;
      }
    } catch (_) {}
    throw new Error('Evidencija nije definirana globalno. Koristi factory obrazac:\n' +
      'let Evidencija = function (tabelaRef, opcije) { ... return { ... } };');
  }

  function napraviTabelu(redovi) {
    let sandbox = document.getElementById('__test_sandbox');
    if (!sandbox) {
      sandbox = document.createElement('div');
      sandbox.id = '__test_sandbox';
      sandbox.style.display = 'none';
      document.body.appendChild(sandbox);
    }
    const wrap = document.createElement('div');
    const headers = ['Energent', 'Kolicina', 'Datum', 'Incident'];
    wrap.innerHTML = `
      <table>
        <caption>Test</caption>
        <thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
        <tbody>${redovi.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')}</tbody>
      </table>`;
    sandbox.appendChild(wrap);
    return {
      tabela: wrap.querySelector('table'),
      ocisti() { wrap.remove(); }
    };
  }

  function ucitajIframe(src, { width = 1280, height = 800 } = {}) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `width:${width}px;height:${height}px;border:0;position:absolute;left:-9999px;top:0;`;
      iframe.onerror = () => { iframe.remove(); reject(new Error('Neuspjelo učitavanje: ' + src)); };
      iframe.onload = () => {
        setTimeout(() => resolve({
          iframe,
          window: iframe.contentWindow,
          document: iframe.contentDocument,
          ocisti() { iframe.remove(); }
        }), 150);
      };
      iframe.src = src;
      document.body.appendChild(iframe);
    });
  }

  function datumUGodini(mjesec, dan) {
    return new Date(new Date().getFullYear(), mjesec, dan);
  }

  function strDatumUGodini(mjesec, dan) {
    const y = new Date().getFullYear();
    return `${y}-${String(mjesec + 1).padStart(2, '0')}-${String(dan).padStart(2, '0')}`;
  }

  window.TestHelpers = { dajEvidenciju, napraviTabelu, ucitajIframe, datumUGodini, strDatumUGodini };
})();