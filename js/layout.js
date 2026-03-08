(function () {
  const CACHE_PREFIX = 'layout:';
  const SERVICE_WORKER_PATH = 'sw.js';

  function readCache(filePath) {
    try {
      return sessionStorage.getItem(CACHE_PREFIX + filePath);
    } catch (error) {
      return null;
    }
  }

  function writeCache(filePath, html) {
    try {
      sessionStorage.setItem(CACHE_PREFIX + filePath, html);
    } catch (error) {
      // Ignore storage errors (private mode / quota).
    }
  }

  function refreshFromNetwork(target, filePath, cachedHtml) {
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load ' + filePath + ': ' + response.status);
        }
        return response.text();
      })
      .then(html => {
        if (!html) return;

        writeCache(filePath, html);
        if (html !== cachedHtml) {
          target.innerHTML = html;
          markActiveNav();
          setFooterYear();
          configureMobileLeadBar();
          document.dispatchEvent(new CustomEvent('layout:ready'));
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  async function inject(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const cachedHtml = readCache(filePath);
    if (cachedHtml) {
      target.innerHTML = cachedHtml;
      refreshFromNetwork(target, filePath, cachedHtml);
      return;
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Failed to load ' + filePath + ': ' + response.status);
      }
      const html = await response.text();
      target.innerHTML = html;
      writeCache(filePath, html);
    } catch (error) {
      console.error(error);
    }
  }

  function markActiveNav() {
    const page = (document.body.dataset.page || '').toLowerCase();
    const keyMap = {
      home: 'home',
      about: 'about',
      service: 'service',
      agro: 'agro',
      garments: 'garments',
      blog: 'blog',
      contact: 'contact'
    };
    const navKey = keyMap[page];
    if (!navKey) return;

    const activeLink = document.querySelector('#site-header [data-nav="' + navKey + '"]');
    if (activeLink) {
      activeLink.classList.add('nav-active');
    }

    if (page === 'agro' || page === 'garments') {
      const parentProducts = document.querySelector('#site-header [data-nav="products"]');
      if (parentProducts) {
        parentProducts.classList.add('nav-active');
      }
    }
  }

  function setFooterYear() {
    const yearEl = document.getElementById('footerYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }
  }

  function configureMobileLeadBar() {
    const quoteBtn = document.querySelector('.mobile-lead-bar .lead-bar-quote');
    if (!quoteBtn) return;

    const page = (document.body.dataset.page || '').toLowerCase();
    if (page === 'home') {
      quoteBtn.setAttribute('href', '#contact');
    } else {
      quoteBtn.setAttribute('href', 'contact.html');
    }
  }

  async function initLayout() {
    registerServiceWorker();

    await Promise.all([
      inject('site-header', 'components/header.html'),
      inject('site-footer', 'components/footer.html')
    ]);

    markActiveNav();
    setFooterYear();
    configureMobileLeadBar();

    document.dispatchEvent(new CustomEvent('layout:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
  } else {
    initLayout();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch(function (error) {
        console.error('Service worker registration failed:', error);
      });
    });
  }
})();
