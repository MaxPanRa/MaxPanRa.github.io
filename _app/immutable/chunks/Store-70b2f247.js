import{w as e}from"./index-f8e6abfe.js";const r="/",i=e(!1),g=e("menuxr"),m=e(r),a=e(""),n=e({});a.subscribe(t=>{t.length>0&&(console.log("-------- TYPE CHANGED!",t),window.localStorage.setItem("typeStorage",t))});n.subscribe(t=>{Object.keys(t).length>0&&(console.log("-------- ITEM CHANGED!",t),window.localStorage.setItem("itemStorage",JSON.stringify(t)))});const w=t=>{var o;let s="";return(o=window.localStorage.getItem(t))!=null?o:s};export{i as I,w as g,m as h,n as i,g as p,a as t,r as w};