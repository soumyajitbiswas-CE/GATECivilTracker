import"./hoisted.DCd5WgQ9.js";function m(){const e=document.getElementById("btn-copy-email"),t=document.getElementById("copy-email-text"),c=document.getElementById("contact-form"),o=document.getElementById("form-feedback"),n="soumyajitbiswas.ce@gmail.com";e&&t&&(e.onclick=()=>{navigator.clipboard.writeText(n).then(()=>{t.textContent="Copied to Clipboard! ✓",e.classList.add("bg-primary-accent/30","text-white"),setTimeout(()=>{t.textContent="Copy Email Address",e.classList.remove("bg-primary-accent/30","text-white")},2500)}).catch(()=>{window.location.href=`mailto:${n}`})}),c&&(c.onsubmit=s=>{s.preventDefault();const a=document.getElementById("sender-name")?.value||"GATE CE Aspirant",i=document.getElementById("msg-category")?.value||"Feedback",d=document.getElementById("sender-message")?.value||"",r=encodeURIComponent(`[GATE Civil Tracker] ${i} from ${a}`),l=encodeURIComponent(`Hi Soumyajit,

Name: ${a}
Topic: ${i}

Message:
${d}

---
Sent from GATE Civil Tracker Web App`);o&&(o.classList.remove("hidden"),o.classList.add("flex")),setTimeout(()=>{window.location.href=`mailto:${n}?subject=${r}&body=${l}`},300)})}m();document.addEventListener("astro:page-load",m);
