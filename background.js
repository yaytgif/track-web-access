chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const domain = url.origin; // Get the domain part
    const faviconUrl = `${domain}/favicon.ico`;

    // Regular expression for known search engine domains
    const searchEngineRegex =
      /^(https:\/\/(?:www\.)?(google|bing|yahoo|baidu|duckduckgo|yandex)\.com)/;

    // Regular expression for internal Chrome URLs
    const chromeInternalRegex = /^chrome:\/\//;

    // Regular expression to check for local network addresses
    const localNetworkRegex =
      /^(https?:\/\/(?:localhost|127\.0\.0.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}))/;

    // Regular expression to filter out the Chrome Web Store URL and any variations
    const unwantedUrlRegex = /^https:\/\/chromewebstore\.google\.com\/?/;

    // Check if the URL matches the unwanted pattern
    if (unwantedUrlRegex.test(tab.url)) {
      return; // Exit if the tab URL matches the unwanted pattern
    }

    // Check if the URL is a search engine, internal Chrome URL, or local network address
    if (
      searchEngineRegex.test(domain) ||
      chromeInternalRegex.test(tab.url) ||
      localNetworkRegex.test(tab.url)
    ) {
      return; // Exit if it's a search engine, internal URL, or local address
    }

    // Read visit records
    chrome.storage.local.get('visitData', (data) => {
      const visitData = data.visitData || {};
      const today = new Date().toISOString().split('T')[0]; // Gets the current date in YYYY-MM-DD format

      if (!visitData[today]) {
        visitData[today] = {};
      }

      if (!visitData[today][domain]) {
        visitData[today][domain] = { count: 0, favicon: faviconUrl };
      }

      visitData[today][domain].count += 1;

      // Save updated visit data
      chrome.storage.local.set({ visitData }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving visit data:', chrome.runtime.lastError);
        }
      });
    });
  }
});
