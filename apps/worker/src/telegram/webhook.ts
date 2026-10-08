import { standardDivination } from '../divination/meihua';
import { callGemini } from '../ai/gemini';
import { callOpenRouter } from '../ai/openrouter';
import type { Env } from '../index';

async function telegramApi(token:string, method:string, payload:any) {
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const j=await r.json(); if(!j.ok) throw new Error(j.description||method+' failed'); return j;
}
async function telegramSend(token:string, chatId:number|string, text:string) { await telegramApi(token,'sendMessage',{chat_id:chatId,text,parse_mode:'HTML'}); }

export async function handleTelegram(request:Request, env:Env):Promise<Response>{
  if (!env.TELEGRAM_BOT_TOKEN) return new Response('Telegram not configured',{status:503});
  const expected=env.TELEGRAM_WEBHOOK_SECRET;
  if(expected && request.headers.get('X-Telegram-Bot-Api-Secret-Token')!==expected) return new Response('Unauthorized',{status:401});
  const update:any=await request.json();
  try {
    if(update.pre_checkout_query){ await telegramApi(env.TELEGRAM_BOT_TOKEN,'answerPreCheckoutQuery',{pre_checkout_query_id:update.pre_checkout_query.id,ok:true}); return new Response('ok'); }
    const payment=update.message?.successful_payment;
    if(payment){ await telegramSend(env.TELEGRAM_BOT_TOKEN,update.message.chat.id,'☕ 感谢你的支持！你的 Stars 已收到，感谢你支持 ChinaMystic TMA。'); return new Response('ok'); }
    const message=update.message;
    if(!message?.text) return new Response('ok');
    const text=message.text.trim();
    if(text==='/start') { await telegramSend(env.TELEGRAM_BOT_TOKEN,message.chat.id,'🔮 <b>ChinaMystic TMA</b>\n\n发送 /divine 你的问题开始梅花易数起卦。\n发送 /support 查看支持方式。'); return new Response('ok'); }
    if(/^\/terms$/i.test(text)){ await telegramSend(env.TELEGRAM_BOT_TOKEN,message.chat.id,'<b>支持条款</b>\n\nTelegram Stars 支持属于自愿支持行为。ChinaMystic TMA 提供传统文化娱乐与信息解读，不构成医疗、法律、投资或其他专业建议。'); return new Response('ok'); }
    if(/^\/paysupport$/i.test(text)){ await telegramSend(env.TELEGRAM_BOT_TOKEN,message.chat.id,'支付支持：如果支付成功但未收到确认，请保留 Telegram 支付凭证并联系管理员。'); return new Response('ok'); }
    const support=text.match(/^\/support(?:\s+(\d+))?$/i);
    if(support){
      const stars=Number(support[1]||0);
      if(stars){ await sendStarsInvoice(env,message.chat.id,stars); }
      else await telegramSend(env.TELEGRAM_BOT_TOKEN,message.chat.id,'⭐ 支持 ChinaMystic TMA\n\n50 Stars\n150 Stars\n300 Stars\n\n自定义：/support 88');
      return new Response('ok');
    }
    const question=text.replace(/^\/divine\s*/i,'').trim();
    if(!question){ await telegramSend(env.TELEGRAM_BOT_TOKEN,message.chat.id,'请这样发送：\n/divine 我今年适合创业吗？'); return new Response('ok'); }
    const d=standardDivination(new Date(),0);
    let interpretation='';
    if(env.GEMINI_API_KEY){ try{ interpretation=(await callGemini(env.GEMINI_API_KEY,env.GEMINI_MODEL||'gemini-2.5-flash',question,d)).text; }catch{} }
    if(!interpretation && env.OPENROUTER_API_KEY){ try{ interpretation=(await callOpenRouter(env.OPENROUTER_API_KEY,env.OPENROUTER_MODEL||'openrouter/free',question,d)).text; }catch{} }
    const plain=interpretation?interpretation.replace(/[{}]/g,'').slice(0,3500):'AI 解读暂时不可用。';
    await telegramSend(env.TELEGRAM_BOT_TOKEN,message.chat.id,`🔮 <b>${d.originalName}</b>\n动爻：第${d.movingLine}爻\n变卦：${d.changed.name}\n体：${d.body.name}　用：${d.use.name}\n\n${plain}\n\n/support 支持 ChinaMystic`);
  } catch(e) { console.error('telegram webhook error',e); }
  return new Response('ok');
}

async function sendStarsInvoice(env:Env,chatId:number|string,stars:number){
  if(stars<1 || stars>10000) { await telegramSend(env.TELEGRAM_BOT_TOKEN!,chatId,'支持金额请填写 1-10000 Stars。'); return; }
  await telegramApi(env.TELEGRAM_BOT_TOKEN!,'sendInvoice',{chat_id:chatId,title:'支持 ChinaMystic TMA',description:`自愿支持 ${stars} Stars`,payload:`support:${stars}:${crypto.randomUUID()}`,currency:'XTR',prices:[{label:'支持 ChinaMystic TMA',amount:stars}]});
}
