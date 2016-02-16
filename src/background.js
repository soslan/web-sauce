var hostnames = [];
var tabHostnames = {};
var blCache = {};
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
  if( info.url || info.status === "loading"){
    var url = new URL(tab.url);
    var hostname = url.hostname;
    if( url.protocol !== "http:" && url.protocol !== "https:" ){
      return;
    }
    tabHostnames[tabId] = hostname;
    if(true || hostnames.indexOf(hostname) !== -1){
      var cssKey = "CSS_#"+hostname;
      var jsKey = "js_#"+hostname;
      var blKey = "bl_#"+hostname;
      chrome.storage.sync.get(blKey, function(data){
        if(data[blKey]){
          blCache[blKey] = data[blKey];
        }
      });
      chrome.storage.sync.get(cssKey, function(data){
        if(data[cssKey]){
          chrome.tabs.insertCSS(tabId, {
            code: String(data[cssKey]),
            runAt: "document_start",
            allFrames: true,
          });
        }
      });
      chrome.storage.sync.get(jsKey, function(data){
        if(data[jsKey]){
          chrome.tabs.executeScript(tabId, {
            code: String(data[jsKey]),
            runAt: "document_start",
            allFrames: true,
          });
        }
      });
    }
  }
});

chrome.webRequest.onBeforeRequest.addListener(function(details){
  if(details.tabId != -1){
    //console.log(details.url);
    var hostname = tabHostnames[details.tabId];
    var blKey = "bl_#"+hostname;
    if(blCache[blKey] != null){
      var blackList = JSON.parse(blCache[blKey]);
      targetUrl = new URL(details.url);
      targetSectors = targetUrl.hostname.split(".").reverse();
      for (var i in blackList){
        if(urlsMatch(blackList[i], targetSectors)){
          console.log("BLOCK", targetUrl.hostname);
          return {cancel: true};
        }
      }
      console.log("PASS", targetUrl.hostname);
      return;
      if(blackList.indexOf(targetUrl.hostname) !== -1){
        console.log("BLOCK", targetUrl.hostname);
        return {cancel: true};
      }
      else{
        console.log("PASS", targetUrl.hostname);
      }
    }
    else{
      //console.log("Web sauce doesn't have any webRequest hooks for", hostname);
    }
  }
  //console.log(details.url);
}, {
  urls: ["<all_urls>"]
}, ["blocking"]);

function urlsMatch(pattern, url){
  if(typeof pattern == "string"){
    pattern = pattern.split(".").reverse();
  }
  if(typeof url == "string"){
    url.split(".").reverse();
  }
  for (var i in pattern){
    var sector1 = pattern[i];
    var sector2 = url[i];
    if(sector1 === "*"){
      return true;
    }
    else if(sector1 === sector2){
      continue;
    }
    else{
      return false;
    }
  }
  return true;
}

function handlePageAction(tab){
  var protocol = new URL(tab.url).protocol;
  if( protocol === "http:" || protocol === "https:" ){
    chrome.pageAction.show(tab.id);
  }
  else{
    chrome.pageAction.hide(tab.id);
  }
}