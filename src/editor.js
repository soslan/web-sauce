function WSTab(args){
  var storageKey = String(args.storageKey);
  var wind = new StandardWindow({
    color: args.color || "orange",
  });
  wind.title = args.title || "Untitled";
  wind.toolbar.left.append(new Button({
    className: ( args.color2 ? args.color2 : 'orange' ) + ' quiet',
    caption: 'Save',
    action: function(){
      var value = cm.getValue();
      var obj = {};
      obj[storageKey] = value;
      chrome.storage.sync.set(obj);
    },
  }));
  wind.on('keydown', function(e){
    if(e.keyCode === 83 && e.ctrlKey){
      var value = cm.getValue();
      var obj = {};
      obj[storageKey] = value;
      chrome.storage.sync.set(obj);
      e.stopPropagation();
      e.preventDefault();
    }
  });
  var cm = CodeMirror(wind.body.e, {
    mode: args.mode || '',
    indentWithTabs: false,
    tabSize: 2,
    lineNumbers: true,
    autoRefresh:true,
    theme: 'neat',
  });
  cm.getWrapperElement().classList.add('full-element');
  wind.on('activated', function(){
    cm.refresh();
  });

  chrome.storage.sync.get(storageKey, function(data){
    if(data[storageKey] !== undefined){
      cm.setValue(String(data[storageKey]));
    }
    cm.refresh();
  });

  this.main = wind;
  this.cm = cm;
  if(args.tabs instanceof Element){
    args.tabs.append(wind);
  }
}

var main = new StandardWindow({
  color: "white",
});
main.addClass('full-window');

var tabs = new TabView();
main.append(tabs);

var hostname = window.location.hash;
var cssKey = "CSS_"+hostname;
var jsKey = "js_"+hostname;

title = span(hostname.slice(1));
title.e.style.fontSize = "25px";
main.toolbar.append(title);

var cssTab = new WSTab({
  color: "blue",
  color2: "white",
  title: "CSS",
  tabs: tabs,
  mode: "css",
  storageKey: 'CSS_'+hostname,
});

var jsTab = new WSTab({
  color: "yellow",
  color2: "black",
  title: "JavaScript",
  tabs: tabs,
  mode: "javascript",
  storageKey: "js_"+hostname,
});

document.body.appendChild(main.e);
