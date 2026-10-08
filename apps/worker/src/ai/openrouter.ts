import { buildPrompt } from './prompt';
import type { DivinationResult } from '@china-mystic/divination-core';
import { getClassical } from '../data/classical';

export async function callOpenRouter(apiKey:string, model:string, question:string, d:DivinationResult, siteUrl?:string, appName?:string) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers:{'content-type':'application/json','Authorization':`Bearer ${apiKey}`,...(siteUrl?{'HTTP-Referer':siteUrl}:{}),...(appName?{'X-Title':appName}:{})},
    body:JSON.stringify({model,temperature:0.7,response_format:{type:'json_object'},messages:[{role:'system',content:'You are a careful Chinese traditional-culture interpretation assistant.'},{role:'user',content:buildPrompt(question,d,getClassical(d.originalName))}]})
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const json:any = await res.json();
  const text = json?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenRouter returned empty response');
  return { text, provider:'openrouter', model };
}
