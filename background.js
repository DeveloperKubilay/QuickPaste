chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    try {
      chrome.tabs.create({
         url: chrome.runtime.getURL('thanks.html')
      });
    } catch {}
  }
});