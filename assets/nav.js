/* Mobile nav toggle — jadeforevanston.com
   Desktop (>860px) is untouched: the button is display:none and the nav renders
   as the normal horizontal bar. Below 860px the nav collapses behind a hamburger.
   The collapse is done in CSS (no flash on load); this only handles opening.
   JS-disabled visitors get the plain expanded nav via each page's <noscript>. */
(function () {
  "use strict";
  var btn = document.getElementById("navtoggle");
  var nav = document.getElementById("mainnav");
  if (!btn || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  btn.addEventListener("click", function () {
    setOpen(btn.getAttribute("aria-expanded") !== "true");
  });

  // Tapping any link closes the panel (it's a same-page nav on anchors).
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });

  // Escape closes, and focus returns to the button.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      btn.focus();
    }
  });

  // If the window grows to desktop while open, reset state so the desktop bar
  // isn't left in an "open" class.
  window.addEventListener("resize", function () {
    if (window.innerWidth > 860) setOpen(false);
  });
})();
