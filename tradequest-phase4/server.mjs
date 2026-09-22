
import express from "express";
import Stripe from "stripe";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const app=express();
app.disable("x-powered-by");

const stripe=process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const openai=process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
const supabaseAdmin=(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)
 ? createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com");
  next();
});

// Stripe requires raw request body for signature verification.
app.post("/api/stripe-webhook", express.raw({type:"application/json"}), async(req,res)=>{
  if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET||!supabaseAdmin) return res.sendStatus(503);
  let event;
  try{
    event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],process.env.STRIPE_WEBHOOK_SECRET);
  }catch(e){ return res.status(400).send("Invalid signature"); }
  if(["checkout.session.completed","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
    // In production, map Stripe customer -> authenticated user via session metadata.
    // The starter intentionally does not guess an identity mapping.
  }
  res.json({received:true});
});

app.use(express.json({limit:"20kb"}));
app.use(express.static(".",{extensions:["html"]}));

app.get("/api/config",(req,res)=>res.json({
  supabaseUrl:process.env.SUPABASE_URL||"",
  supabaseAnonKey:process.env.SUPABASE_ANON_KEY||"",
  production:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)
}));

app.post("/api/coach",async(req,res)=>{
  if(!openai)return res.status(503).json({error:"AI not configured"});
  const message=String(req.body?.message||"").trim().slice(0,1500);
  if(!message)return res.status(400).json({error:"Message required"});
  try{
    const response=await openai.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      instructions:"You are TradeQuest Coach, an educational trading tutor. Explain financial-market concepts clearly. Do not provide personalized investment recommendations, tell the user what security to buy or sell, promise returns, or imply simulated results predict real results. When useful, teach risk management and distinguish education from financial advice.",
      input:message
    });
    res.json({answer:response.output_text});
  }catch(e){res.status(500).json({error:"Coach unavailable"});}
});

app.post("/api/create-checkout",async(req,res)=>{
  if(!stripe||!process.env.STRIPE_PRICE_ID)return res.status(503).json({error:"Billing not configured"});
  const origin=process.env.PUBLIC_ORIGIN||`${req.protocol}://${req.get("host")}`;
  try{
    const session=await stripe.checkout.sessions.create({
      mode:"subscription",
      line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],
      success_url:`${origin}/?checkout=success`,
      cancel_url:`${origin}/?checkout=cancel`,
      allow_promotion_codes:true
    });
    res.json({url:session.url});
  }catch(e){res.status(500).json({error:"Checkout unavailable"});}
});

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  database:Boolean(process.env.SUPABASE_URL),
  billing:Boolean(stripe),
  ai:Boolean(openai),
  marketData:Boolean(process.env.MARKET_DATA_API_KEY)
}));

app.get("*",(req,res,next)=>{
  if(req.path.startsWith("/api/"))return next();
  if(req.accepts("html"))return res.sendFile("index.html",{root:process.cwd()});
  next();
});

const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`TradeQuest Phase 4 listening on ${port}`));
