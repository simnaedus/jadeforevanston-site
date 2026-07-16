/*
 * jadeforevanston.com — campaign attribution
 *
 * Answers one question: which yard sign / QR code / post actually brings people
 * who DO something, rather than people who merely look.
 *
 * Loaded on every page (unlike forms.js, which is only on volunteer.html) because
 * donate links live on all 9 pages. It is the SINGLE owner of the campaign tag:
 * forms.js reads window.JFE_SRC() rather than re-deriving it. Two copies of this
 * logic would drift, and the failure would be silent — views keyed one way,
 * signups keyed another, and a conversion rate that is quietly wrong rather than
 * visibly broken.
 *
 * ⚠️ The precedence below MUST stay identical to geo-worker/src/worker.js:
 *        utm_source || src || qr
 * The Worker keys VIEWS by that value; this keys SIGNUPS and donate refcodes by
 * it; build_dashboard.py divides one by the other.
 *
 * Privacy: sessionStorage, not a cookie. Per-tab, never sent anywhere except with
 * a form the visitor chooses to submit, erased when the tab closes. No profile, no
 * cross-site anything. /privacy.html discloses exactly this — keep it accurate.
 */
(function () {
  'use strict';

  var SRC_KEY = 'jfe_src';

  function readSrcFromUrl() {
    try {
      var q = new URLSearchParams(window.location.search);
      return (q.get('utm_source') || q.get('src') || q.get('qr') || '').slice(0, 60);
    } catch (e) { return ''; }
  }

  function capture() {
    var s = readSrcFromUrl();
    if (!s) return;
    // First tag wins. If someone arrives from a yard sign and later clicks an
    // emailed link, the yard sign is what actually found them.
    try {
      if (!sessionStorage.getItem(SRC_KEY)) sessionStorage.setItem(SRC_KEY, s);
    } catch (e) {}
  }

  function currentSrc() {
    try { return sessionStorage.getItem(SRC_KEY) || readSrcFromUrl(); }
    catch (e) { return readSrcFromUrl(); }
  }

  capture();
  window.JFE_SRC = currentSrc;

  /*
   * ActBlue attribution.
   *
   * ActBlue has its own refcode system and its Stats page reports DOLLARS per
   * refcode. That is the system of record for money and it reconciles with D-2
   * reporting, so we pass the tag through and deliberately do NOT count donate
   * clicks ourselves — an unreconcilable shadow count is worse than none.
   *
   * https://support.actblue.com/campaigns/working-with-contribution-forms/refcodes/
   */
  function tagActBlueLinks() {
    var s = currentSrc();
    if (!s) return;
    var links = document.querySelectorAll('a[href*="secure.actblue.com"]');
    Array.prototype.forEach.call(links, function (a) {
      try {
        var u = new URL(a.href, window.location.href);
        if (u.searchParams.get('refcode')) return;   // never clobber a hand-set refcode
        u.searchParams.set('refcode', s);
        a.href = u.toString();
      } catch (e) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tagActBlueLinks);
  } else {
    tagActBlueLinks();
  }
})();
