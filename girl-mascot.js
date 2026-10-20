(() => {
  'use strict';

  const mascot = document.querySelector('[data-girl-mascot]');
  if (!mascot) return;

  const frames = [...mascot.querySelectorAll('[data-frame]')];
  const prefersLess = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = mascot.querySelector('.girl-mascot__heart-layer');

  let running = !prefersLess.matches;
  let frameTimer = null;
  let heartTimer = null;
  let index = 0;

  const script = [
    ['normal', 2300],
    ['blink', 180],
    ['normal', 1800],
    ['sway', 1030],
    ['normal', 1600],
    ['blink', 160],
    ['normal', 1400]
  ];

  function show(name) {
    frames.forEach((img) => {
      img.classList.toggle('is-visible', img.dataset.frame === name);
    });
  }

  function advance() {
    if (!running || document.hidden) return;

    const [name, duration] = script[index];
    show(name);

    index = (index + 1) % script.length;
    frameTimer = setTimeout(advance, duration);
  }

  function heart(count = 1) {
    if (!running || document.hidden) return;

    for (let j = 0; j < count; j += 1) {
      const span = document.createElement('span');
      span.className = 'girl-mascot__heart';
      span.textContent = Math.random() > 0.3 ? '♥' : '♡';
      span.style.left = `${18 + Math.random() * 64}%`;
      span.style.bottom = `${14 + Math.random() * 34}%`;
      span.style.setProperty('--size', `${14 + Math.random() * 14}px`);
      span.style.setProperty('--duration', `${2.2 + Math.random() * 1.2}s`);
      span.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
      span.style.setProperty('--color', ['#f49abc', '#d9a1ed', '#ffb3b3'][j % 3]);

      layer.appendChild(span);
      span.addEventListener('animationend', () => span.remove(), { once: true });
    }
  }

  function sync() {
    clearTimeout(frameTimer);
    clearInterval(heartTimer);

    const active = running && !document.hidden;
    mascot.classList.toggle('is-paused', !active);

    if (active) {
      index = 0;
      advance();
      heartTimer = setInterval(() => heart(1), 1800);
    } else {
      show('normal');
      layer.replaceChildren();
    }
  }

  mascot.addEventListener('pointerdown', () => heart(6));
  document.addEventListener('visibilitychange', sync);

  if (prefersLess.addEventListener) {
    prefersLess.addEventListener('change', (event) => {
      running = !event.matches;
      sync();
    });
  }

  sync();
})();
