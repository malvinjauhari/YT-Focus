document.addEventListener('DOMContentLoaded', () => {
  const toggleComments = document.getElementById('toggle-comments');
  const toggleRecs = document.getElementById('toggle-recs');

  // Pastikan content script sudah aktif di tab YouTube saat popup dibuka
  const ensureContentScriptInjected = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id && activeTab.url && activeTab.url.includes("youtube.com")) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'PING' }).catch(() => {
          // Jika content script belum berjalan (misal tab dibuka sebelum ekstensi di-load/diinstall),
          // suntikkan content.js secara otomatis tanpa perlu refresh!
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
          }).catch(() => {});
        });
      }
    });
  };

  ensureContentScriptInjected();

  // 1. Baca State dari Storage
  chrome.storage.local.get({
    hideComments: true,
    blurRecommendations: true
  }, (result) => {
    toggleComments.checked = result.hideComments;
    toggleRecs.checked = result.blurRecommendations;
  });

  // 2. Handler untuk perubahan setting
  const handleSettingChange = () => {
    const newSettings = {
      hideComments: toggleComments.checked,
      blurRecommendations: toggleRecs.checked
    };

    // Simpan ke storage (otomatis mentrigger chrome.storage.onChanged di content.js untuk instant update)
    chrome.storage.local.set(newSettings);

    // Kirim pesan backup ke activeTab jika diperlukan
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'YTFOCUS_UPDATE',
          settings: newSettings
        }).catch(() => {});
      }
    });
  };

  toggleComments.addEventListener('change', handleSettingChange);
  toggleRecs.addEventListener('change', handleSettingChange);
});