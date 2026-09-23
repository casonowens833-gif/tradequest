
// Phase 3 progressive enhancement layer.
// Zero-config mode remains fully local. Production services are activated by /api endpoints.
window.TQ3 = { apiBase: "/api", pro: false };

let coachPending = false;
function coachPrompt(text){ if(coachPending)return; document.getElementById('coachInput').value=text; askCoach(); }
async function askCoach(){
  if(coachPending)return;
  const input=document.getElementById('coachInput'), text=input.value.trim();
  if(!text)return;
  if(text.length>1500){toast('Keep questions under 1,500 characters.');return;}
  const identity=cloudUser?.id;
  if(!tqSupabase || !identity || !cloudReady){openAuth();syncDialogVisibility();return;}
  coachPending=true;
  const button=document.getElementById('coachSend'); button.disabled=true;
  const status=document.getElementById('coachStatus'); status.textContent='Thinking…';
  try{
    const {data,error}=await tqSupabase.auth.getSession();
    if(error || !data.session)throw new Error('Please log in again.');
    if(cloudUser?.id!==identity)return;
    const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({message:text}),signal:AbortSignal.timeout(55000)});
    const result=await response.json();
    if(cloudUser?.id!==identity)return;
    if(!response.ok)throw new Error(result.error || 'AI Coach is unavailable.');
    if(!result.answer)throw new Error('No answer was returned. Please retry.');
    addCoachMsg('user','You',text);
    addCoachMsg('bot','AI Coach',result.answer);
    if(input.value.trim()===text)input.value='';
    status.textContent='';
  }catch(error){if(cloudUser?.id===identity)status.textContent=error.name==='TimeoutError'?'The request timed out. Try again.':error.message;}
  finally{coachPending=false;button.disabled=false;}
}
function addCoachMsg(cls,name,text){
  const box=document.getElementById("coachMessages"); if(!box)return;
  const d=document.createElement("div"); d.className="coach-msg "+cls;
  const strong=document.createElement("strong"); strong.textContent=name;
  const p=document.createElement("p"); p.textContent=text;
  d.append(strong,p); box.appendChild(d); box.scrollTop=box.scrollHeight;
}
async function startCheckout(){
  try{
    const r=await fetch("/api/create-checkout",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
    if(r.ok){const j=await r.json(); if(j.url){location.href=j.url;return}}
  }catch(e){}
  if(typeof toast==="function") toast("Pro checkout is ready for Stripe keys. No charge was made.");
  const n=document.getElementById("billingNote"); if(n)n.textContent="Connect Stripe in .env to activate real checkout.";
}
// Extend existing router without breaking local demo.
document.addEventListener("DOMContentLoaded",()=>{
  const original=window.showView;
  if(typeof original==="function"){
    window.showView=function(name){
      if(name==="coach"||name==="pro"){
        if(!cloudReady){openAuth();syncDialogVisibility();return;}
        document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
        const el=document.getElementById(name+"View"); if(el)el.classList.add("active");
        window.scrollTo({top:0,behavior:"smooth"}); return;
      }
      return original(name);
    }
  }
});

let coachAccount = null;
setInterval(()=>{
  const id=cloudUser?.id || null;
  if(id!==coachAccount){
    coachAccount=id;
    document.getElementById('coachMessages').replaceChildren();
    document.getElementById('coachInput').value='';
    document.getElementById('coachStatus').textContent='';
  }
},500);
