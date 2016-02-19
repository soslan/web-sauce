requestedHostnames = {};
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

thisTab(function(tab){
  console.log("got tab");
  chrome.runtime.sendMessage({
    command: 'get_bulk_reports',
    tabId: tab.id,
  }, function(response){
    console.log(response);
    for (var i in response.data){
      applyBLReport(response.data[i]);
    }
  });
});

function applyBLReport(report){
  if(requestedHostnames[report.hostname] == null){
    requestedHostnames[report.hostname] = report;
    var elem = element({
      parent: "#requests",
      class: "report",
    });
    var status = element({
      tag: 'span',
      parent: elem,
      class: 'status-'+report.status,
    });
    var hostname = span({
      class: 'hostname',
      content: report.hostname,
      parent: elem,
    });
  }
}

chrome.runtime.onMessage.addListener(function(message){
  if (message.command === 'report_bl'){
    thisTab(function(tab){
      if(message.tabId === tab.id){
        applyBLReport(message);
      }
    });
  }
});

function thisTab(callback){
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs){
    callback(tabs[0]);
  });
}
