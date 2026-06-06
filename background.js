// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Annotate Extension installed.");
});

// Open Side Panel on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Relay enable-toolbar requests from the side panel to the active tab
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'enableToolbarOnActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse({ ok: false, error: 'No active tab found.' });
        return;
      }
      chrome.tabs.sendMessage(tabId, { action: 'enableToolbar' }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ ok: true, ...response });
      });
    });
    return true;
  }

  if (msg.action === 'deleteAnnotation') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) { sendResponse({ ok: false }); return; }
      chrome.tabs.sendMessage(tabId, { action: 'deleteAnnotation', id: msg.id }, () => {
        void chrome.runtime.lastError;
        sendResponse({ ok: true });
      });
    });
    return true;
  }
});
