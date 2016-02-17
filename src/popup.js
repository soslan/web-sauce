chrome.tabs.query({
  currentWindow: true,
  active: true
}, function(tabs) {
  if (tabs && tabs[0]){
    var tab = tabs[0];
    var url = new URL(tab.url);

    var elem = element({
      tag: "div",
      class: "recipe",
      parent: "#recipes",
      content: url.hostname,
      action: function(){
        chrome.tabs.create({ url: 'editor.html#' + url.hostname });
      }
    });
  }
});
