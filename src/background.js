var hostnames = [];
var tabHostnames = {};
var recipeCounters = {};

chrome.browserAction.setBadgeBackgroundColor({
  color: '#000',
});

chrome.tabs.query({}, function(results){
  for(var i in results){
    var tab = results[i];
    handleBrowserAction(tab);
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab){
  if( info.status === "loading" ) {
    recipeCounters[tabId] = 0;
    handleBrowserAction(tab);
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
    for(var i in patterns){
      applyRecipe(patterns[i], tabId);
    }
  }
});

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
  var cssKey = "CSS_#"+pattern;
  var jsKey = "js_#"+pattern;

  chrome.storage.sync.get(cssKey, function(data){
    if(data[cssKey]){
      chrome.browserAction.setBadgeText({
        text: String(++recipeCounters[tabId]),
        tabId: tabId,
      });
      chrome.tabs.insertCSS(tabId, {
        code: String(data[cssKey]),
        runAt: "document_start",
        //allFrames: true,
      });
    }
  });
  chrome.storage.sync.get(jsKey, function(data){
    if(data[jsKey]){
      chrome.browserAction.setBadgeText({
        text: String(++recipeCounters[tabId]),
        tabId: tabId,
      });
      chrome.tabs.executeScript(tabId, {
        code: String(data[jsKey]),
        runAt: "document_start",
        //allFrames: true,
      });
    }
  });
}

function handleBrowserAction(tab){
  var protocol = new URL(tab.url).protocol;
  if( protocol === "http:" || protocol === "https:" ){
    chrome.browserAction.show(tab.id);
  }
  else{
    chrome.browserAction.hide(tab.id);
  }
}