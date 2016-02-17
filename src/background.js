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
    var patterns = getPatternsForHostname(hostname);
    console.log("PATTERNS", patterns);
    for(var i in patterns){
      applyRecipe(patterns[i], tabId);
    }
  }
});

chrome.webRequest.onBeforeRequest.addListener(function(details){
  if(details.tabId != -1){
    //console.log(details.url);
    var blackList = [];
    var hostname = tabHostnames[details.tabId];
    if(hostname == null){
      return;
    }
    patterns = getPatternsForHostname(hostname);
    for (var i in patterns){
      var pattern = patterns[i];
      var blKey = "bl_#"+pattern;
      if( blCache[blKey] != null ){
        try{
          var tempList = JSON.parse(blCache[blKey]);
          if(tempList instanceof Array){
            blackList = blackList.concat(tempList);
          }
        }
        catch(e){
          console.log("ERROR PARSING", blCache[blKey], e);
          continue;
        }
      }
    }
    console.log(hostname, blackList);
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
  }
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

function getPatternsForHostname(hostname){
  var out = [hostname];
  var sectors = hostname.split('.');
  for (var i=0; i<sectors.length; i++){
    var patt = [].concat.call("*", sectors.slice(i+1)).join(".");
    out.push(patt);
  }
  return out;
}

function applyRecipe(pattern, tabId){
  console.log("APPLYING", pattern);
  var cssKey = "CSS_#"+pattern;
  var jsKey = "js_#"+pattern;
  var blKey = "bl_#"+pattern;
  chrome.storage.sync.get(blKey, function(data){
    if(data[blKey]){
      blCache[blKey] = data[blKey];
    }
  });
  chrome.storage.sync.get(cssKey, function(data){
    console.log("GETTING CSS", pattern, cssKey);
    if(data[cssKey]){
      console.log("GOT CSS", pattern);
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

function handlePageAction(tab){
  var protocol = new URL(tab.url).protocol;
  if( protocol === "http:" || protocol === "https:" ){
    chrome.pageAction.show(tab.id);
  }
  else{
    chrome.pageAction.hide(tab.id);
  }
}