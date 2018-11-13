
let container=function(){let stock=[];let cachePrefix='none';let setCachePrefix=function(prefix){cachePrefix=prefix;return this;};let getCachePrefix=function(){return cachePrefix;};let set=function(name,object,singleton,cache){if(typeof name!=='string'){throw new Error('var name must be of type string');}
if(typeof singleton!=='boolean'){throw new Error('var singleton "'+singleton+'" of service "'+name+'" must be of type boolean');}
if(cache){window.localStorage.setItem(getCachePrefix()+'.'+name,JSON.stringify(object));}
stock[name]={name:name,object:object,singleton:singleton,instance:null};return this;};let memory={};let get=function(name){let service=(undefined!==stock[name])?stock[name]:null;if(null===service){if(memory[getCachePrefix()+'.'+name]){return memory[getCachePrefix()+'.'+name];}
let cached=window.localStorage.getItem(getCachePrefix()+'.'+name);if(cached){cached=JSON.parse(cached);memory[getCachePrefix()+'.'+name]=cached;return cached;}
return null;}
if(service.instance===null){let instance=(typeof service.object==='function')?this.resolve(service.object):service.object;if(service.singleton){service.instance=instance;}
return instance;}
return service.instance;};let resolve=function(target){if(!target){return function(){};}
let self=this;let FN_ARGS=/^function\s*[^\(]*\(\s*([^\)]*)\)/m;let text=target.toString()||'';let args=text.match(FN_ARGS)[1].split(',');return target.apply(target,args.map(function(value){return self.get(value.trim());}));};let path=function(path,value){path=path.split('.');let object=this.get(path.shift());while(path.length>1){if(undefined==object){return null;}
object=object[path.shift()];}
if(undefined!=value){return object[path.shift()]=value;}
if(undefined==object){return null;}
let shift=path.shift();if(undefined==shift){return object;}
return object[shift];};let container={set:set,get:get,resolve:resolve,path:path,setCachePrefix:setCachePrefix,getCachePrefix:getCachePrefix};set('container',container,true);return container;}();container.set('http',function(document){var globalParams=[],globalHeaders=[];var addParam=function(url,param,value){param=encodeURIComponent(param);var a=document.createElement('a');param+=(value?"="+encodeURIComponent(value):"");a.href=url;a.search+=(a.search?"&":"")+param;return a.href;};var request=function(method,url,headers,payload,progress){var i;if(-1==['GET','POST','PUT','DELETE','TRACE','HEAD','OPTIONS','CONNECT','PATCH'].indexOf(method)){throw new Error('var method must contain a valid HTTP method name');}
if(typeof url!=='string'){throw new Error('var url must be of type string');}
if(typeof headers!=='object'){throw new Error('var headers must be of type object');}
if(typeof url!=='string'){throw new Error('var url must be of type string');}
for(i=0;i<globalParams.length;i++){url=addParam(url,globalParams[i].key,globalParams[i].value);}
return new Promise(function(resolve,reject){var xmlhttp=new XMLHttpRequest();xmlhttp.open(method,url,true);xmlhttp.setRequestHeader('Ajax','1');for(i=0;i<globalHeaders.length;i++){xmlhttp.setRequestHeader(globalHeaders[i].key,globalHeaders[i].value);}
for(var key in headers){if(headers.hasOwnProperty(key)){xmlhttp.setRequestHeader(key,headers[key]);}}
xmlhttp.onload=function(){if(4==xmlhttp.readyState&&200==xmlhttp.status){resolve(xmlhttp.response);}
else{document.dispatchEvent(new CustomEvent('http-'+method.toLowerCase()+'-'+xmlhttp.status));reject(new Error(xmlhttp.statusText));}};if(progress){xmlhttp.addEventListener('progress',progress);xmlhttp.upload.addEventListener('progress',progress,false);}
xmlhttp.onerror=function(){reject(new Error("Network Error"));};xmlhttp.send(payload);})};return{'get':function(url){return request('GET',url,{},'')},'post':function(url,headers,payload){return request('POST',url,headers,payload)},'put':function(url,headers,payload){return request('PUT',url,headers,payload)},'delete':function(url){return request('DELETE',url,{},'')},'addGlobalParam':function(key,value){globalParams.push({key:key,value:value});},'addGlobalHeader':function(key,value){globalHeaders.push({key:key,value:value});}}},true);container.set('cookie',function(document){function get(name){var value="; "+document.cookie,parts=value.split("; "+name+"=");if(parts.length===2){return parts.pop().split(";").shift();}}
function set(name,value,days){var date=new Date();date.setTime(date.getTime()+(days*24*60*60*1000));var expires=(0<days)?'expires='+date.toUTCString():'expires=0';document.cookie=name+"="+value+";"+expires+";path=/";}
return{'get':get,'set':set}},true);Object.path=function(object,path,value){path=path.split('.');while(path.length>1){if(undefined===object){return null;}
object=object[path.shift()];}
if(undefined!==value){return object[path.shift()]=value;}
if(undefined===object){return null;}
return object[path.shift()];};if(!Array.prototype.includes){Array.prototype.includes=function(searchElement){'use strict';if(this==null){throw new TypeError('Array.prototype.includes called on null or undefined');}
var O=Object(this);var len=parseInt(O.length,10)||0;if(len===0){return false;}
var n=parseInt(arguments[1],10)||0;var k;if(n>=0){k=n;}else{k=len+n;if(k<0){k=0;}}
var currentElement;while(k<len){currentElement=O[k];if(searchElement===currentElement||(searchElement!==searchElement&&currentElement!==currentElement)){return true;}
k++;}
return false;};}
container.set('view',function(http,container){var stock={};var execute=function(view,node,container){container.set('element',node,true);container.resolve(view.controller);if(true!==view.repeat){node.removeAttribute(view.selector);}};return{stock:stock,add:function(object){if(typeof object!=='object'){throw new Error('var object must be of type object');}
var defaults={'selector':'','controller':function(){},'template':'','repeat':false,'protected':false};for(var prop in defaults){if(!defaults.hasOwnProperty(prop)){continue;}
if(prop in object){continue;}
object[prop]=defaults[prop];}
if(!object.selector){throw new Error('View component is missing a selector attribute');}
stock[object.selector]=object;return this;},render:function(element){var self=this;var list=(element)?element.childNodes:[];if(element.$lsSkip===true){list=[];}
for(var i=0;i<list.length;i++){var node=list[i];if(1!==node.nodeType){continue;}
if(node.attributes&&node.attributes.length){for(var x=0;x<node.attributes.length;x++){var length=node.attributes.length;var attr=node.attributes[x];if(!stock[attr.nodeName]){continue;}
var comp=stock[attr.nodeName];if(typeof comp.template==="function"){comp.template=container.resolve(comp.template);}
if(!comp.template){(function(comp,node,container){execute(comp,node,container);})(comp,node,container);if(length!==node.attributes.length){x--;}
continue;}
node.classList.remove('load-end');node.classList.add('load-start');node.$lsSkip=true;http.get(comp.template).then(function(node,comp){return function(data){node.$lsSkip=false;node.innerHTML=data;node.classList.remove('load-start');node.classList.add('load-end');(function(comp,node,container){execute(comp,node,container);})(comp,node,container);self.render(node);}}(node,comp),function(error){throw new Error('Failed to load comp template: '+error.message);});}}
if(true!==node.$lsSkip){this.render(node);}}
element.dispatchEvent(new window.Event('rendered',{bubbles:false}));}}},true);container.set('form',function(){function cast(value,to){switch(to){case'int':case'integer':value=parseInt(value);break;case'string':value=value.toString();break;case'json':value=(value)?JSON.parse(value):[];break;case'array':value=(value.constructor===Array)?value:[value];break;case'array-empty':value=[];break;case'bool':case'boolean':value=(value==='false')?false:value;value=!!value;break;}
return value;}
function getDatasetProperty(dataset,propName){var data=JSON.parse(JSON.stringify(dataset));return data[propName]||undefined;}
function toJson(element,json){json=json||{};var name=element.getAttribute('name');var type=element.getAttribute('type');var castTo=element.getAttribute('data-cast-to');var ref=json;if(name&&'FORM'!==element.tagName){if('FIELDSET'===element.tagName){if(castTo==='object'){if(json[name]===undefined){json[name]={};}
ref=json[name];}
else{if(!Array.isArray(json[name])){json[name]=[];}
json[name].push({});ref=json[name][json[name].length-1];}}
else if(undefined!==element.value){if('SELECT'===element.tagName&&element.children>0){json[name]=element.children[element.selectedIndex].value;}
else if('radio'===type){if(element.checked){json[name]=element.value;}}
else if('checkbox'===type){if(!Array.isArray(json[name])){json[name]=[];}
if(element.checked){json[name].push(element.value);}}
else if(undefined!==element.value){if((json[name]!==undefined)&&(!Array.isArray(json[name]))){json[name]=[json[name]];}
if(Array.isArray(json[name])){json[name].push(element.value);}
else{json[name]=element.value;}}
json[name]=cast(json[name],castTo);}}
for(var i=0;i<element.children.length;i++){if(Array.isArray(ref)){ref.push({});toJson(element.children[i],ref[ref.length]);}
else{toJson(element.children[i],ref);}}
return json;}
return{'toJson':toJson}},true);container.set('state',function(window){var states=[];var current=null;var previous=null;var getPrevious=function(){return previous;};var setPrevious=function(value){previous=value;return this;};var getCurrent=function(){return current;};var setCurrent=function(value){current=value;return this;};var getParam=function(key,def){if(key in state.params){return state.params[key];}
return def;};var getParams=function(){return state.params;};var setParam=function(key,value){state.params[key]=value;return this;};var reset=function(){state.params=getJsonFromUrl(window.location.search);};var getURL=function(){return window.location.href;};var add=function(path,view){if(typeof path!=='string'){throw new Error('var path must be of type string');}
if(typeof view!=='object'){throw new Error('var view must be of type object');}
states[states.length++]={path:path,view:view};return this;};var match=function(location){var url=location.pathname;states.sort(function(a,b){return b.path.length-a.path.length;});states.sort(function(a,b){var n=b.path.split('/').length-a.path.split('/').length;if(n!==0){return n;}
return b.path.length-a.path.length;});for(var i=0;i<states.length;i++){var value=states[i],match=new RegExp("^"+value.path.replace(/:[^\s/]+/g,'([\\w-]+)')+"$");var found=url.match(match);if(found){previous=current;current=value;return value;}}
return null};var change=function(URL){window.history.pushState({},'',URL);window.dispatchEvent(new PopStateEvent('popstate',{}));};var reload=function(){change(window.location.href);};var getJsonFromUrl=function(URL){var query;if(URL){var pos=location.href.indexOf('?');if(pos==-1)return[];query=location.href.substr(pos+1);}else{query=location.search.substr(1);}
var result={};query.split('&').forEach(function(part){if(!part){return;}
part=part.split('+').join(' ');var eq=part.indexOf('=');var key=eq>-1?part.substr(0,eq):part;var val=eq>-1?decodeURIComponent(part.substr(eq+1)):'';var from=key.indexOf('[');if(from==-1){result[decodeURIComponent(key)]=val;}
else{var to=key.indexOf(']');var index=decodeURIComponent(key.substring(from+1,to));key=decodeURIComponent(key.substring(0,from));if(!result[key]){result[key]=[];}
if(!index){result[key].push(val);}
else{result[key][index]=val;}}});return result;};var state={setParam:setParam,getParam:getParam,getParams:getParams,reset:reset,change:change,reload:reload,getURL:getURL,add:add,match:match,getCurrent:getCurrent,setCurrent:setCurrent,getPrevious:getPrevious,setPrevious:setPrevious,params:getJsonFromUrl(window.location.search)};return state;},true);container.set('expression',function(container,filter){var reg=/(\{{.*?\}})/gi;return{parse:function(string,def){def=def||'';return string.replace(reg,function(match)
{var reference=match.substring(2,match.length-2).replace('[\'','.').replace('\']','').trim();reference=reference.split('|');var path=(reference[0]||'');var filterName=(reference[1]||'');var result=container.path(path);result=(null===result||undefined===result)?def:result;result=(typeof result==='object')?JSON.stringify(result):result;if(filterName){result=filter.apply(result,filterName,{});}
return result;});}}},true);container.set('filter',function(){var filters={};var add=function(name,callback){filters[name]=callback;return this;};var apply=function(value,name,options){return filters[name](value,options);};add('uppercase',function(value,options){return value.toUpperCase();});add('lowercase',function(value,options){return value.toLowerCase();});return{add:add,apply:apply}},true);container.set('window',window,true).set('document',window.document,true).set('element',window.document,true);var app=function(version){return{run:function(window){try{container.get('http').addGlobalParam('version',version);this.view.render(window.document);}
catch(error){var handler=container.resolve(this.error);handler(error);}},error:function(){return function(error){console.error('error',error.message,error.stack,error.toString());}},container:container,view:this.container.get('view')}};container.get('view').add({selector:'data-ls-init',template:false,repeat:true,controller:function(element,window,document,view,state){var firstFromServer=(element.getAttribute('data-first-from-server')==='true');var scope={selector:'data-ls-scope',template:false,repeat:true,controller:function(){},state:true},init=function(route){window.scrollTo(0,0);if(window.document.body.scrollTo){window.document.body.scrollTo(0,0);}
state.reset();scope.protected=(undefined!==route.view.protected)?route.view.protected:false;if(scope.protected&&(null===state.getPrevious())){throw new Error('CSRF protection');}
scope.template=(undefined!==route.view.template)?route.view.template:null;scope.controller=(undefined!==route.view.controller)?route.view.controller:function(){};scope.state=(undefined!==route.view.state)?route.view.state:true;document.dispatchEvent(new CustomEvent('state-change'));if(firstFromServer&&null===state.getPrevious()){scope.template='';}
else if(null!==state.getPrevious()){scope.nested=false;view.render(element);}
document.dispatchEvent(new CustomEvent('state-changed'));},findParent=function(tagName,el){if((el.nodeName||el.tagName).toLowerCase()===tagName.toLowerCase()){return el;}
while(el=el.parentNode){if((el.nodeName||el.tagName).toLowerCase()===tagName.toLowerCase()){return el;}}
return null;};view.add(scope);document.addEventListener('click',function(event){var target=findParent('a',event.target);if(!target){return false;}
if(!target.href){return false;}
if((event.metaKey)){return false;}
if((target.hasAttribute('target'))&&('_blank'===target.getAttribute('target'))){return false;}
if(target.hostname!==window.location.hostname){return false;}
var route=state.match(target);if(null===route){return false;}
event.preventDefault();if(window.location===target.href){return false;}
route.view.state=(undefined===route.view.state)?true:route.view.state;if(true===route.view.state){if(state.getPrevious()&&state.getPrevious().view&&(state.getPrevious().view.scope!==route.view.scope)){window.location.href=target.href;return false;}
window.history.pushState({},'Unknown',target.href);}
init(route);return true;});window.addEventListener('popstate',function(){var route=state.match(window.location);if(state.getPrevious()&&state.getPrevious().view&&(state.getPrevious().view.scope!==route.view.scope)){window.location.reload();return false;}
init(route);});init(state.match(window.location));}});container.get('view').add({selector:'data-ls-alt',template:false,repeat:true,controller:function(element,expression){element.alt=expression.parse(element.dataset['lsAlt']);}});container.get('view').add({selector:'data-ls-class',template:false,repeat:true,controller:function(element,expression){element.className=expression.parse(element.dataset['lsClass']);}});container.get('view').add({selector:'data-ls-echo',template:false,repeat:true,controller:function(element,expression,filter){var def=expression.parse(element.getAttribute('data-default')||'');var filterName=element.getAttribute('data-filter')||'';var filterOptions=JSON.parse(element.getAttribute('data-filter-options')||'{}');var result=expression.parse(element.dataset['lsEcho']);result=result||def;if(filterName){result=filter.apply(result,filterName,filterOptions);}
if(element.tagName==='INPUT'||element.tagName==='OPTION'||element.tagName==='SELECT'||element.tagName==='BUTTON'||element.tagName==='TEXTAREA'){var type=element.getAttribute('type');if('radio'===type){if(result.toString()===def){element.setAttribute('checked','checked');}
else{element.removeAttribute('checked');}}
if('checkbox'===type){if(def.includes(result.toString())){element.setAttribute('checked','checked');}
else{element.removeAttribute('checked');}}
if(element.value!==result){element.value=result;}
element.dispatchEvent(new window.Event('change'));}
else{if(element.innerText!==result){element.innerHTML=result;}}}});container.get('view').add({selector:'data-ls-eval',template:false,controller:function(element,expression){var statement=expression.parse(element.dataset['lsEval']);eval(statement);}});container.get('view').add({selector:'data-ls-for',repeat:true,controller:function(element,expression){var value=expression.parse(element.dataset['lsFor']);if(value!==element.htmlFor&&value!==''){element.htmlFor=value;}}});container.get('view').add({selector:'data-ls-hide',template:false,repeat:true,controller:function(element,expression){if((eval(expression.parse(element.dataset['lsHide'])))){element.style.display='inherit';}
else{element.style.display='none';}}});container.get('view').add({selector:'data-ls-href',template:false,repeat:true,controller:function(element,expression){element.href=expression.parse(element.dataset['lsHref']);}});container.get('view').add({selector:'data-ls-id',repeat:true,controller:function(element,expression){var id=expression.parse(element.dataset['lsId']);if(id!==element.id&&id!==''){element.id=id;}}});container.get('view').add({selector:'data-ls-if',template:false,repeat:true,controller:function(element,expression){var result=!!(eval(expression.parse(element.dataset['lsIf'],'undefined')));element.$lsSkip=!result;if(!result){element.style.visibility='hidden';element.style.display='none';}
else{element.style.removeProperty('display');element.style.removeProperty('visibility');}}});container.get('view').add({selector:'data-ls-loop',template:false,repeat:true,nested:false,controller:function(element,view,container,window){var array=container.path(element.dataset['lsLoop']);array=(!array)?[]:array;element.template=(element.template)?element.template:(element.children.length===1)?element.children[0].innerHTML:'';if(!element.clone){element.clone=(element.children.length===1)?element.children[0]:window.document.createElement('li');}
element.innerHTML='';if(array instanceof Array&&typeof array!=='object'){throw new Error('Reference value must be array or object. '+(typeof array)+' given');}
var children=[];element.$lsSkip=true;element.style.visibility=(0===array.length)?'hidden':'visible';for(var prop in array){if(!array.hasOwnProperty(prop)){continue}
children[prop]=children[prop]||element.clone.cloneNode(true);children[prop]=element.clone.cloneNode(true);children[prop].innerHTML=element.template;element.appendChild(children[prop]);(function(index){var context=element.dataset['lsLoop']+'.'+index;container.set(element.dataset['lsAs'],container.path(context),true);view.render(children[prop]);})(prop);children[prop].addEventListener("template-loaded",(function(prop){var callback=function(event){(function(index){container.set(element.dataset['lsAs'],container.path(element.dataset['lsLoop']+'.'+index),true);view.render(event.target);})(prop);children[prop].removeEventListener("template-loaded",callback,false);};return callback;})(prop),false);}}});container.get('view').add({selector:'data-ls-options',repeat:true,controller:function(element,document,expression){var options=expression.parse(element.dataset['lsOptions']||'{}');var key=element.dataset['key']||null;var label=element.dataset['label']||null;var pattern=element.dataset['pattern']||'{{value}}';var placeholder=expression.parse(element.dataset['placeholder']||'');var value=(element.selectedIndex>-1)?element.options[element.selectedIndex].value:null;element.innerHTML='';if(placeholder){var child=document.createElement('option');child.value='';child.innerText=placeholder;element.appendChild(child);}
try{options=JSON.parse(options);}
catch(error){options=[];}
element.disabled=true;if(Array.isArray(options)){options.map(function(obj){var child=document.createElement('option');child.value=(key)?pattern.replace('{{value}}',obj[key]):JSON.stringify(obj);child.innerText=(label)?obj[label]:JSON.stringify(obj);child.selected=(child.value===value);element.appendChild(child);element.disabled=false;});return;}
if(typeof options==='object'){Object.keys(options).map(function(x,y){var child=document.createElement('option');child.value=(key)?pattern.replace('{{value}}',options[x]):x;child.innerText=(label)?options[label]:options[x];child.selected=(child.value===value);element.appendChild(child);element.disabled=false;});}}});container.get('view').add({selector:'data-ls-print',template:false,repeat:true,controller:function(element,expression,filter){var def=element.getAttribute('data-default')||'';var filterName=element.getAttribute('data-filter')||'';var filterOptions=JSON.parse(element.getAttribute('data-filter-options')||'{}');var result=expression.parse('{{'+element.dataset['lsPrint']+'}}');result=result||def;if(filterName){result=filter.apply(result,filterName,filterOptions);}
if(element.tagName==='INPUT'||element.tagName==='SELECT'||element.tagName==='BUTTON'||element.tagName==='TEXTAREA'){var type=element.getAttribute('type');if(('radio'===type)||('checkbox'===type)){if(result.toString()===element.value||result.indexOf(element.value)>-1){element.setAttribute('checked','checked');}
else{element.removeAttribute('checked');}}
else{if(element.value!==result){element.value=result;}
element.dispatchEvent(new window.Event('change'));}}
else{if(element.innerText!==result){element.innerText=result;}}}});container.get('view').add({selector:'data-ls-rerender',template:false,repeat:true,controller:function(element,view,http,expression,document,container){var events=element.dataset['lsRerender']||'';var scope=element.dataset['scope']||'';scope=(scope)?container.get(scope):document;events=events.trim().split(',');for(var i=0;i<events.length;i++){if(''===events[i]){continue;}
scope.addEventListener(events[i],function(){view.render(element);})}}});container.get('view').add({selector:'data-ls-selected',template:false,repeat:true,controller:function(element,expression){var result=!!(eval(expression.parse(element.dataset['lsSelected'])));element.$lsSkip=!result;if(!result){element.classList.remove('selected');}
else{element.classList.add('selected');}}});container.get('view').add({selector:'data-ls-src',template:false,repeat:true,controller:function(element,expression){element.addEventListener('error',function(){element.style.opacity='0';});element.addEventListener('load',function(){element.style.opacity='1';});var src=expression.parse(element.dataset['lsSrc']);if(src!==element.src&&src!==''){element.src=src;}}});container.get('view').add({selector:'data-ls-style',template:false,repeat:true,controller:function(element,expression){element.style.cssText=expression.parse(element.dataset['lsStyle']);}});container.get('view').add({selector:'data-ls-template',template:false,repeat:true,controller:function(element,view,http,expression,document){var template=expression.parse(element.dataset['lsTemplate']);var type=element.dataset['type']||'url';element.innerHTML='';var parse=function(data,element){element.innerHTML=data;view.render(element);element.dispatchEvent(new CustomEvent('template-loaded',{bubbles:true,cancelable:false}));};if('script'===type){var inlineTemplate=document.getElementById(template);if(inlineTemplate&&inlineTemplate.innerHTML){parse(inlineTemplate.innerHTML,element);}
else{element.innerHTML='<span style="color: red">Missing template "'+template+'"</span>';}
return;}
http.get(template).then(function(element){return function(data){parse(data,element);}}(element),function(){throw new Error('Failed loading template');});}});container.get('view').add({selector:'data-ls-title',template:false,repeat:true,controller:function(element,expression){element.title=expression.parse(element.dataset['lsTitle']);}});container.get('view').add({selector:'data-ls-trigger',repeat:true,controller:function(element,expression){var trigger=expression.parse(element.dataset['lsTrigger']);element.addEventListener('click',function(){window.document.dispatchEvent(new CustomEvent(trigger,{bubbles:false,cancelable:true}));});}});