
// Phase 3 progressive enhancement layer.
// Zero-config mode remains fully local. Production services are activated by /api endpoints.
window.TQ3 = { apiBase: "/api", pro: false };

const coachAnswers = [
  {keys:["limit","market"], text:"A market order prioritizes execution, while a limit order gives you price control but may never fill. In the simulator, try both and compare the trade-off rather than assuming one is always better."},
  {keys:["divers"], text:"Diversification means spreading exposure so one position does not determine the whole portfolio's outcome. It can reduce concentration risk, but it cannot eliminate losses."},
  {keys:["risk"], text:"Risk management starts before a trade: decide the thesis, invalidation point, position size, and how the position fits the rest of the portfolio. The goal is a repeatable process, not certainty."},
  {keys:["candle","chart"], text:"A candlestick summarizes open, high, low and close for a time interval. It describes past price movement; it does not guarantee what happens next."},
  {keys:["quiz"], text:"Quick quiz: You want to buy only if the price is $50 or lower. Which order type gives you that price control? Answer: a buy limit order, though it may not execute."}
];
function coachPrompt(t){document.getElementById("coachInput").value=t;askCoach()}
async function askCoach(){
  const input=document.getElementById("coachInput"), text=(input.value||"").trim();
  if(!text)return;
  addCoachMsg("user","You",text); input.value="";
  let answer="";
  try{
    const r=await fetch("/api/coach",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:text})});
    if(r.ok){const j=await r.json(); answer=j.answer||""}
  }catch(e){}
  if(!answer){
    const lower=text.toLowerCase();
    answer=(coachAnswers.find(a=>a.keys.some(k=>lower.includes(k)))||{}).text ||
      "For this prototype I can explain market basics, order types, diversification, risk management and charts. Production AI responses activate when the server-side AI endpoint is configured.";
  }
  addCoachMsg("bot","Quest Coach",answer);
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
        document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
        const el=document.getElementById(name+"View"); if(el)el.classList.add("active");
        window.scrollTo({top:0,behavior:"smooth"}); return;
      }
      return original(name);
    }
  }
});
