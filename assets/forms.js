/*
 * jadeforevanston.com form submission
 *
 * Posts brand-styled forms to the Apps Script web app. Progressive enhancement:
 * if JS is off or the endpoint is unreachable, the form falls back to a mailto:
 * so a volunteer signup is never silently lost.
 *
 * Apps Script web apps don't return CORS headers on POST, so we send
 * Content-Type: text/plain (a "simple request", no preflight) and read the
 * response normally. Do NOT switch to application/json; it triggers a preflight
 * OPTIONS that Apps Script does not answer, and every submission will fail.
 */
(function () {
  'use strict';

  // Set this after deploying Code.gs. See forms-backend/DEPLOY.md.
  var ENDPOINT = window.JFE_FORM_ENDPOINT || '';

  function serialize(form) {
    var out = { form: form.dataset.form };
    var checks = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'checkbox') {
        if (el.checked) (checks[el.name] = checks[el.name] || []).push(el.value);
      } else if (el.type !== 'submit') {
        out[el.name] = el.value;
      }
    });
    Object.keys(checks).forEach(function (k) { out[k] = checks[k]; });
    return out;
  }

  function setStatus(form, msg, kind) {
    var el = form.querySelector('.form-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-status';
      form.appendChild(el);
    }
    el.textContent = msg;
    el.dataset.kind = kind || '';
    el.setAttribute('role', 'status');
  }

  function mailtoFallback(form, data) {
    var subject = encodeURIComponent('Website form: ' + data.form);
    var body = encodeURIComponent(
      Object.keys(data).map(function (k) {
        return k + ': ' + (Array.isArray(data[k]) ? data[k].join(', ') : data[k]);
      }).join('\n')
    );
    window.location.href =
      'mailto:info@jadeforevanston.com?subject=' + subject + '&body=' + body;
  }

  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (!form.matches('form.campaign[data-form]')) return;
    ev.preventDefault();

    var data = serialize(form);
    var btn = form.querySelector('button[type=submit]');

    if (!ENDPOINT) {
      setStatus(form, 'Form endpoint not configured yet; opening your email client instead.', 'warn');
      mailtoFallback(form, data);
      return;
    }

    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
    setStatus(form, '', '');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'failed');
        form.reset();
        setStatus(form,
          form.dataset.form === 'volunteer'
            ? 'Thank you. Someone from the campaign will be in touch this week.'
            : 'You’re on the list. Watch your inbox.',
          'ok');
      })
      .catch(function () {
        setStatus(form, 'Something went wrong. Opening your email client so this isn’t lost…', 'warn');
        setTimeout(function () { mailtoFallback(form, data); }, 1200);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Submit'; }
      });
  });
})();
