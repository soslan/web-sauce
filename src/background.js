var hostnames = [];
chrome.pageAction.onClicked.addListener(function(tab) {
  url = 'editor.html#' + new URL(tab.url).hostname;
  chrome.tabs.create({ url: url });
});

chrome.tabs.query({}, function(results){
  for(var i in results){
    var tab = results[i];
    handlePageAction(tab);
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
  if( info.status === "loading" ) {
    handlePageAction(tab);
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
  console.log(info);
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

function handlePageAction(tab){
  var protocol = new URL(tab.url).protocol;
  if( protocol === "http:" || protocol === "https:" ){
    chrome.pageAction.show(tab.id);
  }
  else{
    chrome.pageAction.hide(tab.id);
  }
}