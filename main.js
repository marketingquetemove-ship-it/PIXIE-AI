// main.js: scripts for index page (navbar and UI helpers)

const navbar = document.getElementById('navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('ativo', window.scrollY > 50);
  });
}

export function toggleMenu() {
  const menu = document.querySelector('.menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

// Keep toggleMenu available on window for inline onclick handlers in HTML
window.toggleMenu = toggleMenu;
