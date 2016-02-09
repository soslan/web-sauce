var main = new StandardWindow({
  color: "white",
});
main.addClass('full-window');

var tabs = new TabView();
main.append(tabs);

var hostname = window.location.hash;
var cssKey = "CSS_"+hostname;
var jsKey = "js_"+hostname;
var wind = new StandardWindow({
  toolbarStyle: 'blue',
});
wind.title = "CSS";

title = span(hostname.slice(1));
title.e.style.fontSize = "25px";
main.toolbar.append(title);

var cm = CodeMirror(wind.body.e, {
  mode: 'css',
  indentWithTabs: false,
  tabSize: 2,
  lineNumbers: true,
  autoRefresh:true,
  theme: 'neat',
});
cm.getWrapperElement().classList.add('full-element');

chrome.storage.local.get(cssKey, function(data){
  if(data[cssKey]!== undefined){
    cm.setValue(String(data[cssKey]));
  }
  cm.refresh();
});

wind.toolbar.left.append(new Button({
  className: 'white quiet',
  caption: 'Save',
  action: function(){
    var value = cm.getValue();
    var obj = {};
    obj[cssKey] = value;
    chrome.storage.local.set(obj);
  },
}));

tabs.append(wind);

jsWind = new StandardWindow({
  color: "yellow"
});
jsWind.title = "JavaScript";
jsWind.toolbar.left.append(new Button({
  className: 'black quiet',
  caption: 'Save',
  action: function(){
    var value = jsCm.getValue();
    var obj = {};
    obj[jsKey] = value;
    chrome.storage.local.set(obj);
  },
}));
var jsCm = CodeMirror(jsWind.body.e, {
  mode: 'javascript',
  indentWithTabs: false,
  tabSize: 2,
  lineNumbers: true,
  autoRefresh:true,
  theme: 'neat',
});
jsCm.getWrapperElement().classList.add('full-element');
jsWind.on('activated', function(){
  jsCm.refresh();
});

chrome.storage.local.get(jsKey, function(data){
  if(data[jsKey] !== undefined){
    jsCm.setValue(String(data[jsKey]));
  }
  jsCm.refresh();
});


tabs.append(jsWind);

document.body.appendChild(main.e);