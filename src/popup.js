function thisTab(callback){
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs){
    callback(tabs[0]);
  });
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

thisTab(function(tab){
  var url = new URL(tab.url);
  var hostname = url.hostname;

  var patterns = getPatternsForHostname(hostname);
  patterns.forEach(function(patt, i){
    var cssKey = 'CSS_#'+patt;
    var jsKey = 'js_#'+patt;
    var entryElem = element({
      tag: "div",
      class: "entry",
      parent: "#recipes",
      attributes: {patt: patt},
      action: function(e){
        chrome.tabs.create({
          url: 'editor.html#' + e.currentTarget.getAttribute('patt')
        });
      }
    });
    var patternElem = span({
      parent: entryElem,
      class: 'entry-name',
      content: patt,
    });
    var cssInd = span({
      parent: entryElem,
      content: 'CSS',
      class: 'css-label',
    });
    var jsInd = span({
      parent: entryElem,
      content: 'JS',
      class: 'js-label',
    });
    chrome.storage.sync.get(cssKey, function(data){
      if(data[cssKey] != null){
        cssInd.classList.add('on');
      }
    });
    chrome.storage.sync.get(jsKey, function(data){
      if(data[jsKey] != null){
        jsInd.classList.add('on');
      }
    });
  });
});
