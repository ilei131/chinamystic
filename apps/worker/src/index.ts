import { mysticDivinationFromSeed, standardDivination } from './divination/meihua';
import { getCookie, newCookieId, sha256Hex } from './security/hash';
import { callGemini } from './ai/gemini';
import { callOpenRouter } from './ai/openrouter';
import { handleTelegram } from './telegram/webhook';
import { getClassical } from './data/classical';

export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_SITE_URL?: string;
  OPENROUTER_APP_NAME?: string;
  SERVER_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_SUPPORT_TITLE?: string;
}

const cors=(origin:string|null)=>({
  'Access-Control-Allow-Origin':origin||'*',
  'Access-Control-Allow-Headers':'content-type',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Vary':'Origin'
});
const json=(data:any,status=200,origin:string|null=null,extra:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8',...cors(origin),...extra}});

function resultForClient(d:any){
  const c=getClassical(d.originalName);
  const moving=c.yaoci?.[d.movingLine-1];
  return {mode:d.mode,method:d.method,formula:d.formula,original:{index:d.originalIndex,name:d.originalName,upper:d.upper,lower:d.lower},movingLine:d.movingLine,changed:{index:d.changed.index,name:d.changed.name,upper:d.changed.upper,lower:d.changed.lower},body:d.body,use:d.use,analysis:d.analysis,lunar:d.lunar??null,classical:{guaci:c.guaci,tuan:c.tuan||'',xiang:c.xiang||[],movingYao:moving?.text||''}};
}

function parseInterpretation(text:string){
  try{return JSON.parse(text)}catch{
    const match=text.match(/\{[\s\S]*\}/);
    if(match){try{return JSON.parse(match[0])}catch{}}
    return {summary:'',hexagram:text,movingLine:'',changed:'',bodyUse:'',advice:'',disclaimer:'传统文化解读，仅供参考'};
  }
}

export default {
  async fetch(request:Request, env:Env):Promise<Response>{
    const url=new URL(request.url);
    if(request.method==='OPTIONS') return new Response(null,{headers:cors(request.headers.get('Origin'))});
    if(url.pathname==='/health') return json({ok:true,service:'china-mystic-tma-api',time:new Date().toISOString()},200,request.headers.get('Origin'));
    if(url.pathname==='/telegram/webhook') return handleTelegram(request,env);
    if(url.pathname==='/api/divine' && request.method==='POST') return divine(request,env);
    return json({error:'Not Found'},404,request.headers.get('Origin'));
  }
};

async function divine(request:Request,env:Env):Promise<Response>{
  const origin=request.headers.get('Origin');
  let body:any;
  try{body=await request.json()}catch{return json({error:'Invalid JSON'},400,origin)}
  const question=String(body?.question??'').trim();
  if(question.length<2 || question.length>1000) return json({error:'问题长度应为 2-1000 个字符'},400,origin);
  const mode=body?.mode==='mystic'?'mystic':'time';
  const tz=Number(body?.timezoneOffsetMinutes);
  const timezoneOffsetMinutes=Number.isFinite(tz)&&Math.abs(tz)<=840?tz:0;
  let d:any; let seedHash='';
  const cookie=getCookie(request,'cm_uid') || newCookieId();
  const ip=request.headers.get('CF-Connecting-IP')||request.headers.get('X-Forwarded-For')||'unknown';
  const ipHash=await sha256Hex(`${env.SERVER_SECRET}:${ip}`);
  if(mode==='time') d=standardDivination(new Date(),timezoneOffsetMinutes);
  else {
    const bucket=Math.floor(Date.now()/1000);
    const seed=`${env.SERVER_SECRET}|${cookie}|${ipHash}|${bucket}|${question}`;
    const x=await mysticDivinationFromSeed(seed); d=x.result; seedHash=x.hash;
  }
  let interpretation:any=null;
  let provider=''; let model='';
  if(env.GEMINI_API_KEY){
    try{const x=await callGemini(env.GEMINI_API_KEY,env.GEMINI_MODEL||'gemini-2.5-flash',question,d); interpretation=parseInterpretation(x.text);provider=x.provider;model=x.model;}catch{}
  }
  if(!interpretation && env.OPENROUTER_API_KEY){
    try{const x=await callOpenRouter(env.OPENROUTER_API_KEY,env.OPENROUTER_MODEL||'openrouter/free',question,d,env.OPENROUTER_SITE_URL,env.OPENROUTER_APP_NAME); interpretation=parseInterpretation(x.text);provider=x.provider;model=x.model;}catch{}
  }
  const id=crypto.randomUUID(); const now=new Date().toISOString();
  if(env.DB){
    try{
      const day=now.slice(0,10);
      const aiOk=interpretation?1:0;
      await env.DB.prepare(`INSERT INTO daily_stats(day,casts,ai_success,ai_failure) VALUES(?,?,?,?) ON CONFLICT(day) DO UPDATE SET casts=casts+excluded.casts, ai_success=ai_success+excluded.ai_success, ai_failure=ai_failure+excluded.ai_failure`).bind(day,1,aiOk,aiOk?0:1).run();
    }catch(e){ console.error('D1 stats write failed',e); }
  }
  const headers:any={'Set-Cookie':`cm_uid=${encodeURIComponent(cookie)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure; HttpOnly`};
  return json({id,divination:resultForClient(d),interpretation,ai:{provider:provider||null,model:model||null,available:!!interpretation}},200,origin,headers);
}
