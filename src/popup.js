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
    var sectors = url.hostname.split(".");
    for (var i=0; i<sectors.length; i++){
      console.log(i+1, sectors, sectors.slice(i+1));
      var patt = [].concat.call("*", sectors.slice(i+1)).join(".");
      element({
        tag: "div",
        class: "recipe",
        parent: "#recipes",
        content: patt,
        attributes: {patt: patt},
        action: function(e){
          chrome.tabs.create({
            url: 'editor.html#' + e.currentTarget.getAttribute('patt')
          });
        }
      });
    }
  }
});
