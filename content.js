// Cegah reksekusi script ganda pada tab yang sama
if (window.__YTFOCUS_INJECTED__) {
  // Script sudah aktif di tab ini
} else {
  window.__YTFOCUS_INJECTED__ = true;

  const STYLE_ID = 'ytfocus-styles';
  let currentSettings = { hideComments: true, blurRecommendations: true };

  // Menyuntikkan aturan CSS yang dioptimalkan untuk performa tinggi & GPU acceleration.
  const injectCSS = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* GPU ACCELERATED BLUR FOR COMMENTS & RECOMMENDATIONS */
      html.ytf-blur-comments ytd-comments,
      html.ytf-blur-comments #comments,
      html.ytf-blur-recs ytd-watch-next-secondary-results-renderer,
      html.ytf-blur-recs ytd-item-section-renderer[page-subtype="watch-next"],
      html.ytf-blur-recs .ytp-endscreen-content,
      html.ytf-blur-recs .ytp-ce-video {
        filter: blur(12px) opacity(0.7) !important;
        pointer-events: none !important;
        user-select: none !important;
        will-change: filter, opacity;
        transform: translateZ(0); /* Promosi elemen ke layer GPU independen agar scroll ultra smooth */
        transition: filter 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  // Menerapkan class ke tag <html> berdasarkan setting
  const applySettings = (settings) => {
    currentSettings = settings;
    const htmlTag = document.documentElement;

    if (settings.hideComments) {
      htmlTag.classList.add('ytf-blur-comments');
    } else {
      htmlTag.classList.remove('ytf-blur-comments');
    }

    if (settings.blurRecommendations) {
      htmlTag.classList.add('ytf-blur-recs');
    } else {
      htmlTag.classList.remove('ytf-blur-recs');
    }
  };

  // Inisialisasi awal saat halaman dimuat
  const init = () => {
    injectCSS();
    chrome.storage.local.get({
      hideComments: true,
      blurRecommendations: true
    }, (result) => {
      applySettings(result);
    });
  };

  // Dengarkan perubahan dari storage secara otomatis (instan di semua tab YouTube)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.hideComments !== undefined) {
        currentSettings.hideComments = changes.hideComments.newValue;
      }
      if (changes.blurRecommendations !== undefined) {
        currentSettings.blurRecommendations = changes.blurRecommendations.newValue;
      }
      applySettings(currentSettings);
    }
  });

  // Dengarkan pesan dari Popup (misal PING untuk verifikasi injection)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'YTFOCUS_UPDATE') {
      applySettings(message.settings);
      if (sendResponse) sendResponse({ status: 'ok' });
    } else if (message.type === 'PING') {
      if (sendResponse) sendResponse({ status: 'pong' });
    }
    return true;
  });

  init();

  // Menangani YouTube SPA (Single Page Application) Routing.
  // Hanya mengecek perubahan atribut class pada tag <html> (0% beban CPU saat scroll/nonton video)
  const observer = new MutationObserver(() => {
    if (!document.getElementById(STYLE_ID)) {
      injectCSS();
    }

    const htmlTag = document.documentElement;
    if (currentSettings.hideComments && !htmlTag.classList.contains('ytf-blur-comments')) {
      htmlTag.classList.add('ytf-blur-comments');
    }
    if (currentSettings.blurRecommendations && !htmlTag.classList.contains('ytf-blur-recs')) {
      htmlTag.classList.add('ytf-blur-recs');
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}