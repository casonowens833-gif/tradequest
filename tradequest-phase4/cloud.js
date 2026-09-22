
let tqSupabase=null;
async function initCloud(){
  try{
    const r=await fetch("/api/config"); if(!r.ok)return;
    const c=await r.json(); if(!c.supabaseUrl||!c.supabaseAnonKey)return;
    const {createClient}=window.supabase;
    tqSupabase=createClient(c.supabaseUrl,c.supabaseAnonKey);
    document.documentElement.dataset.cloud="connected";
  }catch(e){}
}
async function cloudSignUp(email,password,displayName){
  if(!tqSupabase)throw new Error("Cloud authentication is not configured.");
  const {data,error}=await tqSupabase.auth.signUp({email,password,options:{data:{display_name:displayName}}});
  if(error)throw error; return data;
}
async function cloudSignIn(email,password){
  if(!tqSupabase)throw new Error("Cloud authentication is not configured.");
  const {data,error}=await tqSupabase.auth.signInWithPassword({email,password});
  if(error)throw error; return data;
}
async function cloudSignOut(){ if(tqSupabase)await tqSupabase.auth.signOut(); }
async function cloudResetPassword(email){
  if(!tqSupabase)throw new Error("Cloud authentication is not configured.");
  const {error}=await tqSupabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
  if(error)throw error;
}
document.addEventListener("DOMContentLoaded",initCloud);
