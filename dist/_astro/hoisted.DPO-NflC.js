import"./hoisted.BXPUfdJc.js";function i(){const c=document.getElementById("contact-form"),t=document.getElementById("form-feedback"),e=document.getElementById("btn-copy-email"),o=document.getElementById("copy-email-text"),n="contact@gateciviltracker.com";e&&o&&(e.onclick=()=>{navigator.clipboard.writeText(n).then(()=>{o.textContent="Copied! ✓",e.classList.add("bg-primary-accent/20","text-primary-accent","border-primary-accent/30"),setTimeout(()=>{o.textContent="Copy Email",e.classList.remove("bg-primary-accent/20","text-primary-accent","border-primary-accent/30")},2500)}).catch(()=>{window.location.href=`mailto:${n}`})}),c&&(c.onsubmit=r=>{r.preventDefault();const a=document.getElementById("sender-name")?.value||"GATE CE Aspirant",m=document.getElementById("msg-category")?.value||"Feedback",d=document.getElementById("sender-message")?.value||"",s=encodeURIComponent(`[GATE Civil Tracker] ${m} from ${a}`),l=encodeURIComponent(`Hi Soumyajit,

Name: ${a}
Topic: ${m}

Message:
${d}

---
Sent from GATE Civil Tracker Web App`);t&&(t.classList.remove("hidden"),t.classList.add("flex")),setTimeout(()=>{window.location.href=`mailto:${n}?subject=${s}&body=${l}`},300)})}i();document.addEventListener("astro:page-load",i);
