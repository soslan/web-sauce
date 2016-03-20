function WSTab(args){
  var self = this;
  var storageKey = String(args.storageKey);
  this.storageKey = storageKey;
  var wind = new StandardWindow({
    color: args.color || "orange",
  });
  this.asterisk = span('*');
  this.asterisk.e.style.display = 'none';
  wind.title = args.title || "Untitled";
  wind.toolbar.left.append(new Button({
    className: ( args.color2 ? args.color2 : 'orange' ) + ' quiet',
    caption: 'Save',
    action: function(){
      self.save();
    },
  }));
  wind.on('keydown', function(e){
    if(e.keyCode === 83 && e.ctrlKey){
      self.save();
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
      self.savedValue = String(data[storageKey]);
    }
    else{
      cm.setValue('');
      self.savedValue = '';
    }
    cm.on('change', function(e){
      if(self.savedValue !== cm.getValue()){
        wind.tabViewHandle.e.style.fontWeight = 900;
        self.asterisk.e.style.display = null;
      }
      else{
        self.main.tabViewHandle.e.style.fontWeight = null;
        self.asterisk.e.style.display = 'none';
      }
    });
    cm.refresh();
  });

  this.main = wind;
  this.cm = cm;
  if(args.tabs instanceof Element){
    args.tabs.append(wind);
    wind.tabViewHandle.append(this.asterisk);
  }
}

WSTab.prototype.save = function(){
  var self = this;
  var value = this.cm.getValue();
  var obj = {};
  obj[this.storageKey] = value;
  this.savedValue = value;
  chrome.storage.sync.set(obj, function(){
    self.main.tabViewHandle.e.style.fontWeight = null;
    self.asterisk.e.style.display = 'none';
  });
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
