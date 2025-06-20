chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    try {
      chrome.tabs.create({
         url: 'https://developerkubilay.github.io/QuickPaste/installed/thanks.html'
      });
    } catch {}
  }
});