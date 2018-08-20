/*! atomic v4.1.0 | (c) 2018 Chris Ferdinandi | MIT License | https://github.com/cferdinandi/atomic */
!(function(t,e){"function"==typeof define&&define.amd?define([],(function(){return e(t)})):"object"==typeof exports?module.exports=e(t):window.atomic=e(t)})("undefined"!=typeof global?global:"undefined"!=typeof window?window:this,(function(t){"use strict";var e,n={method:"GET",username:null,password:null,data:{},headers:{"Content-type":"application/x-www-form-urlencoded"},responseType:"text",timeout:null,withCredentials:!1},o=function(){return!!t.XMLHttpRequest&&!!t.JSON&&"undefined"!=typeof Promise&&-1!==Promise.toString().indexOf("[native code]")},r=function(){for(var t={},e=0;e<arguments.length;e++){var n=arguments[e];!(function(e){for(var n in e)e.hasOwnProperty(n)&&("[object Object]"===Object.prototype.toString.call(e[n])?t[n]=r(t[n],e[n]):t[n]=e[n])})(n)}return t},s=function(t){var n;if("text"!==e.responseType&&""!==e.responseType)return{data:t.response,xhr:t};try{n=JSON.parse(t.responseText)}catch(e){n=t.responseText}return{data:n,xhr:t}},i=function(t){if("string"==typeof t||"[object FormData]"===Object.prototype.toString.call(t))return t;if(/application\/json/i.test(e.headers["Content-type"])||"[object Array]"===Object.prototype.toString.call(t))return JSON.stringify(t);var n=[];for(var o in t)t.hasOwnProperty(o)&&n.push(encodeURIComponent(o)+"="+encodeURIComponent(t[o]));return n.join("&")},a=function(t){var n=new XMLHttpRequest,o=new Promise(function(o,r){n.onload=function(){n.status>=200&&n.status<300?o(s(n)):r({status:n.status,statusText:n.statusText})},n.open(e.method,t,!0,e.username,e.password),n.responseType=e.responseType;for(var a in e.headers)e.headers.hasOwnProperty(a)&&n.setRequestHeader(a,e.headers[a]);e.timeout&&(n.timeout=e.timeout,n.ontimeout=function(t){r({status:408,statusText:"Request timeout"})}),e.withCredentials&&(n.withCredentials=!0),n.send(i(e.data))});return o.cancel=function(){n.abort()},o};return function(t,s){if(!o())throw"Atomic: This browser does not support the methods used in this plugin.";return e=r(n,s||{}),a(t)}}));