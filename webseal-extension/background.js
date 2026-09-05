/**
 * Sentinel WebSeal Background Service Worker
 * Relays extension lifecycle state and diagnostic logging.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Sentinel WebSeal] Extension installed and active.");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && (tab.url.includes("localhost") || tab.url.includes("127.0.0.1"))) {
    console.log("[Sentinel WebSeal] Monitored page loaded:", tab.url);
  }
});
