/**
 * 4N7H4R4X Custom Cursor
 * Lightweight dot + ring. Works in both light and dark mode.
 */
(function () {
  'use strict';

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var mx = -100, my = -100;
  var rx = -100, ry = -100;
  var hovering = false;

  var dot = document.createElement('div');
  dot.style.cssText =
    'position:fixed;top:0;left:0;width:5px;height:5px;background:#e63946;' +
    'border-radius:50%;pointer-events:none;z-index:99999;' +
    'transform:translate(-50%,-50%);will-change:transform;' +
    'transition:width .15s,height .15s,background .15s;';

  var ring = document.createElement('div');
  ring.style.cssText =
    'position:fixed;top:0;left:0;width:32px;height:32px;' +
    'border:1px solid rgba(230,57,70,0.35);border-radius:50%;' +
    'pointer-events:none;z-index:99998;' +
    'transform:translate(-50%,-50%);will-change:transform;' +
    'transition:width .2s,height .2s,border-color .2s,opacity .2s;opacity:.6;';

  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add('custom-cursor');

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  document.addEventListener('mousedown', function () {
    dot.style.width = '3px';
    dot.style.height = '3px';
    ring.style.width = '26px';
    ring.style.height = '26px';
  });
  document.addEventListener('mouseup', function () {
    dot.style.width = '5px';
    dot.style.height = '5px';
    ring.style.width = hovering ? '44px' : '32px';
    ring.style.height = hovering ? '44px' : '32px';
  });

  document.addEventListener('mouseover', function (e) {
    var t = e.target;
    if (t.closest && t.closest('a,button,.btn,.nav-link,.post-tag,.tag,.page-link,input[type="submit"]')) {
      if (!hovering) {
        hovering = true;
        ring.style.width = '44px';
        ring.style.height = '44px';
        ring.style.borderColor = 'rgba(230,57,70,0.6)';
        ring.style.opacity = '1';
        // In light mode use dark dot, in dark mode use white
        var isDark = document.documentElement.getAttribute('data-mode') === 'dark' ||
          (!document.documentElement.getAttribute('data-mode') &&
           window.matchMedia('(prefers-color-scheme: dark)').matches);
        dot.style.background = isDark ? '#ffffff' : '#0a0a0a';
      }
    }
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    var t = e.target;
    if (t.closest && t.closest('a,button,.btn,.nav-link,.post-tag,.tag,.page-link,input[type="submit"]')) {
      hovering = false;
      ring.style.width = '32px';
      ring.style.height = '32px';
      ring.style.borderColor = 'rgba(230,57,70,0.35)';
      ring.style.opacity = '.6';
      dot.style.background = '#e63946';
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity = '1';
    ring.style.opacity = hovering ? '1' : '.6';
  });

  (function loop() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    requestAnimationFrame(loop);
  })();
})();
