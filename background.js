chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
      chrome.tabs.create({
         url: 'https://developerkubilay.github.io/QuickPaste/installed/thanks.html'
      });
  }
});