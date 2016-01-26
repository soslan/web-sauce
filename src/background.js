var testStyle = "body {background: azure!important;}";
var setStyle = "document.body.style.background = 'lime!important'; console.log('WEBSAUCE', document.body)";
var hostnames = [];
chrome.browserAction.onClicked.addListener(function(tab) {
  // chrome.tabs.insertCSS({
  //   code: testStyle,
  //   runAt: "document_start",
  // });
  url = 'editor.html#' + new URL(tab.url).hostname;
  chrome.tabs.create({ url: url });
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
  console.log(tab, info);
  if( info.url || info.status === "loading"){
    var hostname = new URL(tab.url).hostname;
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