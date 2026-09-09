"use strict";(()=>{var _="sn_widget_cache";function J(){try{let t=localStorage.getItem(_);return t?JSON.parse(t):null}catch{return null}}function K(t){try{let n={data:t,timestamp:Date.now()};localStorage.setItem(_,JSON.stringify(n))}catch{}}async function N(t,n){let e=J();if(e&&Date.now()-e.timestamp<3e5&&e)return e.data;try{let r=await fetch(`${t}/api/widget/${n}`,{method:"GET",headers:{"Content-Type":"application/json"}});if(!r.ok)return e?.data??null;let a=await r.json();return K(a),a}catch{return e?.data??null}}function R(t){let n=Date.now(),e=new Date(t).getTime(),i=n-e,r=Math.floor(i/6e4),a=Math.floor(r/60);if(r<1)return"az \xF6nce";if(r<60)return`${r} dakika \xF6nce`;if(a<24)return`${a} saat \xF6nce`;let c=t.split("").reduce((u,p)=>u+p.charCodeAt(0),0)%45+2;return c<60?`${c} dakika \xF6nce`:`${Math.floor(c/60)} saat \xF6nce`}function M(t,n){return t.replace(/\{\{(\w+)\}\}/g,(e,i)=>n[i]||"")}function C(){return window.innerWidth<768}function B(t){let n=[...t];for(let e=n.length-1;e>0;e--){let i=Math.floor(Math.random()*(e+1));[n[e],n[i]]=[n[i],n[e]]}return n}var L="";function U(t){L=`${t}/api/analytics`}function T(t,n,e){if(!L)return;let i=JSON.stringify({merchantId:t,notificationEntryId:e||null,eventType:n,page:window.location.pathname,device:C()?"mobile":"desktop"});navigator.sendBeacon&&navigator.sendBeacon(L,new Blob([i],{type:"text/plain"}))}function F(t,n){let e=n.background||"#ffffff",i=n.text||"#1f2937",r=n.border||"#e5e7eb";return`
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .sn-toast {
      position: fixed;
      z-index: 999999;
      max-width: 340px;
      width: calc(100vw - 32px);
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${e};
      color: ${i};
      border: 1px solid ${r};
      cursor: pointer;
      overflow: hidden;
      line-height: 1.4;
      font-size: 14px;
    }
    .sn-toast.bottom-left { bottom: 20px; left: 20px; }
    .sn-toast.bottom-right { bottom: 20px; right: 20px; }

    .sn-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      color: #9ca3af;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: color 0.15s, background 0.15s;
      z-index: 1;
    }
    .sn-close:hover { color: #374151; background: rgba(0,0,0,0.05); }

    /* --- Shared layout: image left, content right --- */
    .sn-inner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 30px 14px 14px;
    }

    .sn-img-wrap {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      overflow: hidden;
      background: #f3f4f6;
      border: 2px solid ${r};
    }
    .sn-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .sn-content {
      flex: 1;
      min-width: 0;
    }

    .sn-name {
      font-size: 13px;
      color: ${i};
      margin-bottom: 2px;
      line-height: 1.3;
    }
    .sn-name strong { font-weight: 700; }

    .sn-product {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .sn-title {
      font-size: 13px;
      color: ${i};
      margin-bottom: 6px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .sn-title strong { font-weight: 700; }

    .sn-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .sn-meta {
      font-size: 11px;
      color: #9ca3af;
    }

    .sn-cta {
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      background: #3b82f6;
      padding: 3px 10px;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* --- Modern: angular/squared design --- */
    .sn-toast.sn-modern-toast {
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    .sn-modern .sn-img-wrap {
      width: 60px;
      height: 60px;
      border-radius: 4px;
    }
    .sn-modern .sn-cta {
      border-radius: 2px;
    }

    /* --- Minimal: no image, dot indicator, sharp corners --- */
    .sn-toast.sn-minimal-toast {
      border-radius: 2px;
      box-shadow: 0 1px 8px rgba(0,0,0,0.08);
    }
    .sn-minimal-inner {
      gap: 10px;
    }
    .sn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .sn-minimal-inner .sn-content { flex: 1; }

    /* --- Teaser button --- */
    .sn-teaser {
      position: fixed;
      z-index: 999999;
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      background: ${e};
      color: ${i};
      border: 1px solid ${r};
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: box-shadow 0.15s;
      white-space: nowrap;
    }
    .sn-teaser:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .sn-teaser.bottom-left { bottom: 20px; left: 20px; }
    .sn-teaser.bottom-right { bottom: 20px; right: 20px; }
    .sn-teaser-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

    /* --- Mobile --- */
    @media (max-width: 480px) {
      .sn-toast {
        max-width: calc(100vw - 24px);
        left: 12px !important;
        right: 12px !important;
        bottom: 12px !important;
      }
    }
  `}function Y(t,n){let i=n==="bottom-left"?"-120%":"120%";return t==="slide"?`
      .sn-enter {
        transform: translateX(${i});
        opacity: 0;
      }
      .sn-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      }
      .sn-exit {
        transform: translateX(0);
        opacity: 1;
      }
      .sn-exit-active {
        transform: translateX(${i});
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.35s ease;
      }
    `:t==="fade"?`
      .sn-enter {
        opacity: 0;
        transform: translateY(16px);
      }
      .sn-enter-active {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .sn-exit {
        opacity: 1;
        transform: translateY(0);
      }
      .sn-exit-active {
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
    `:`
    .sn-enter {
      opacity: 0;
      transform: scale(0.6) translateY(20px);
    }
    .sn-enter-active {
      opacity: 1;
      transform: scale(1) translateY(0);
      transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .sn-exit {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    .sn-exit-active {
      opacity: 0;
      transform: scale(0.6) translateY(20px);
      transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.5, 0, 0.75, 0);
    }
  `}function s(t,n,e){let i=document.createElement(t);return n&&(i.className=n),e&&(i.textContent=e),i}function Q(){let t=document.createElement("button");return t.className="sn-close",t.setAttribute("aria-label","Close"),t.textContent="\xD7",t}function j(t,n){try{let i=new URL(t);if(i.protocol!=="https:"&&i.protocol!=="http:")return null}catch{return null}let e=document.createElement("img");return e.src=t,e.className=n,e.alt="",e.loading="lazy",e}function V(t,n,e,i){let r=s("div","sn-inner");if(t.productImage){let u=s("div","sn-img-wrap"),p=j(t.productImage,"sn-img");p&&u.appendChild(p),r.appendChild(u)}let a=s("div","sn-content"),l=s("div","sn-name");l.appendChild(s("strong",void 0,t.customerName)),l.appendChild(document.createTextNode(" sat\u0131n ald\u0131")),a.appendChild(l),a.appendChild(s("div","sn-product",t.productName));let c=s("div","sn-bottom");return c.appendChild(s("span","sn-meta",e)),i&&c.appendChild(s("span","sn-cta","\xDCr\xFCn\xFC G\xF6r")),a.appendChild(c),r.appendChild(a),r}function Z(t,n,e,i){let r=s("div","sn-inner sn-modern");if(t.productImage){let u=s("div","sn-img-wrap"),p=j(t.productImage,"sn-img");p&&u.appendChild(p),r.appendChild(u)}let a=s("div","sn-content"),l=s("div","sn-name");l.appendChild(s("strong",void 0,t.customerName)),l.appendChild(document.createTextNode(" sat\u0131n ald\u0131")),a.appendChild(l),a.appendChild(s("div","sn-product",t.productName));let c=s("div","sn-bottom");return c.appendChild(s("span","sn-meta",e)),i&&c.appendChild(s("span","sn-cta","\xDCr\xFCn\xFC G\xF6r")),a.appendChild(c),r.appendChild(a),r}function tt(t,n){let e=s("div","sn-inner sn-minimal-inner"),i=s("span","sn-dot");e.appendChild(i);let r=s("div","sn-content"),a=s("div","sn-title");return a.appendChild(s("strong",void 0,t.customerName)),a.appendChild(document.createTextNode(` ${t.productName} sat\u0131n ald\u0131`)),r.appendChild(a),r.appendChild(s("div","sn-meta",n)),e.appendChild(r),e}function O(t,n,e,i){let r={element:null,cancelled:!1},a={name:n.customerName,product:n.productName,location:n.location,time:R(n.purchaseDate)},l=M(e.messageTemplate,a),c=M(e.timeTemplate,a),u=!!n.productHref,p=e.theme==="modern"?"sn-modern-toast":e.theme==="minimal"?"sn-minimal-toast":"",m=s("div",`sn-toast ${e.position} ${p} sn-enter`.trim()),g;e.theme==="modern"?g=Z(n,l,c,u):e.theme==="minimal"?g=tt(n,c):g=V(n,l,c,u),m.appendChild(g);let y=Q();return y.addEventListener("click",x=>{x.stopPropagation(),r.cancelled=!0,W(m)}),m.appendChild(y),m.addEventListener("click",()=>{if(T(i,"click",n.id),n.productHref)try{let x=new URL(n.productHref,window.location.href);(x.protocol==="https:"||x.protocol==="http:")&&window.open(x.toString(),"_self")}catch{}}),t.appendChild(m),r.element=m,requestAnimationFrame(()=>{requestAnimationFrame(()=>{m.classList.remove("sn-enter"),m.classList.add("sn-enter-active")})}),r}function W(t){return new Promise(n=>{t.classList.remove("sn-enter-active"),t.classList.add("sn-exit"),requestAnimationFrame(()=>{requestAnimationFrame(()=>{t.classList.remove("sn-exit"),t.classList.add("sn-exit-active")})}),setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t),n()},500)})}function H(t,n,e){let i=document.createElement("button");i.className=`sn-teaser ${n.position}`;let r=document.createElement("span");r.className="sn-teaser-dot",i.appendChild(r);let a=document.createTextNode(n.teaserText);return i.appendChild(a),i.addEventListener("click",()=>{i.parentNode&&i.parentNode.removeChild(i),e()}),t.appendChild(i),i}(function(){if(window.__sn_widget_loaded)return;window.__sn_widget_loaded=!0;let t=document.currentScript;if(!t)return;let n=new URL(t.src),e=n.searchParams.get("mid");if(!e)return;let i=n.origin;U(i);function r(d){return new Promise(o=>setTimeout(o,d))}function a(d){let o=d.url;if(!o)return!1;let h=window.location.pathname,f=window.location.href;switch(d.matchType){case"exact":return f===o||h===o;case"startsWith":return f.startsWith(o)||h.startsWith(o);case"contains":return f.includes(o)||h.includes(o);default:return!1}}function l(d){let o=d.pageTargeting;return o.mode==="all"||!o.rules||o.rules.length===0?!0:o.mode==="excluded"?!o.rules.some(a):o.rules.some(a)}function c(d){let o=d.filter(f=>f.isPrioritized),h=d.filter(f=>!f.isPrioritized);return[...o,...B(h)]}async function u(){let d=await N(i,e);if(!d)return;let{settings:o,notifications:h}=d;if(!o.isActive||!o.showOnMobile&&C()||!l(o)||h.length===0)return;let f=document.createElement("div");f.id="sn-widget-host",f.style.cssText="position:fixed;z-index:999999;pointer-events:none;top:0;left:0;width:0;height:0;",document.body.appendChild(f);let w=f.attachShadow({mode:"closed"}),$=document.createElement("style");$.textContent=F(o.theme,o.customColors)+Y(o.animation,o.position),w.appendChild($);let A=document.createElement("style");A.textContent=".sn-toast, .sn-teaser { pointer-events: auto; }",w.appendChild(A);let D=c(h),b=null;async function E(){b&&b.parentNode&&(b.parentNode.removeChild(b),b=null);let I=Math.min(D.length,o.maxPerPage);await r(o.firstDelay);for(let v=0;v<I;v++){let P=D[v],k=O(w,P,o,e);T(e,"impression",P.id),await new Promise(S=>{let X=setTimeout(()=>{k.cancelled?S():W(k.element).then(S)},o.displayDuration),G=setInterval(()=>{k.cancelled&&(clearTimeout(X),clearInterval(G),S())},100)}),v<I-1&&await r(o.delayBetween)}o.showTeaser&&o.teaserBehavior!=="never"&&(b=H(w,o,E))}o.showTeaser&&o.teaserBehavior==="always"&&(b=H(w,o,E)),E()}let p="",m=null;function g(){let d=window.location.href;d!==p&&(p=d,m&&N(i,e).then(o=>{o&&m&&(m.style.display=l(o.settings)?"":"none")}))}let y=history.pushState,x=history.replaceState;history.pushState=function(...d){y.apply(this,d),setTimeout(g,50)},history.replaceState=function(...d){x.apply(this,d),setTimeout(g,50)},window.addEventListener("popstate",()=>setTimeout(g,50));let q=u;async function z(){await q(),m=document.getElementById("sn-widget-host"),p=window.location.href}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z()})();})();
