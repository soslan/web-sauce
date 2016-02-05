var testStyle = "body {background: azure!important;}";
var setStyle = "document.body.style.background = 'lime!important'; console.log('WEBSAUCE', document.body)";
var hostnames = [];
chrome.pageAction.onClicked.addListener(function(tab) {
  url = 'editor.html#' + new URL(tab.url).hostname;
  chrome.tabs.create({ url: url });
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
  if( info.url ) {
    var protocol = new URL(tab.url).protocol;
    if( protocol === "http:" || protocol === "https:" ){
      chrome.pageAction.show(tabId);
    }
    else{
      chrome.pageAction.hide(tabId);
    }
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
  if( info.url || info.status === "loading"){
    var url = new URL(tab.url)
    if( url.protocol !== "http:" && url.protocol !== "https:" ){
      return;
    }
    var hostname = url.hostname;
    console.log(hostname, "UPDATED");
    if(true || hostnames.indexOf(hostname) !== -1){
      var cssKey = "CSS_#"+hostname;
      var jsKey = "js_#"+hostname;
      chrome.storage.local.get(cssKey, function(data){
        console.log(cssKey, data);
        if(data[cssKey]){
          chrome.tabs.insertCSS(tabId, {
            code: String(data[cssKey]),
            runAt: "document_start",
          });
        }
      });
      chrome.storage.local.get(jsKey, function(data){
        console.log(jsKey, data);
        if(data[jsKey]){
          chrome.tabs.executeScript(tabId, {
            code: String(data[jsKey]),
            runAt: "document_start",
          });
        }
      });
    }
  }
});
