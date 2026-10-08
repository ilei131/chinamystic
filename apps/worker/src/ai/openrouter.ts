import { buildPrompt } from './prompt';
import type { DivinationResult } from '@china-mystic/divination-core';
import { getClassical } from '../data/classical';

export async function callOpenRouter(apiKey:string, model:string, question:string, d:DivinationResult, language:'zh'|'en'='zh', siteUrl?:string, appName?:string) {
  const promptText = buildPrompt(question, d, language, getClassical(d.originalName));
  const systemText = language==='en'
    ? 'You are a careful Chinese traditional-culture interpretation assistant.'
    : 'You are a careful Chinese traditional-culture interpretation assistant.';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers:{'content-type':'application/json','Authorization':`Bearer ${apiKey}`,...(siteUrl?{'HTTP-Referer':siteUrl}:{}),...(appName?{'X-Title':appName}:{})},
    body:JSON.stringify({model,temperature:0.7,response_format:{type:'json_object'},messages:[{role:'system',content:systemText},{role:'user',content:promptText}]})
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const json:any = await res.json();
  const text = json?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenRouter returned empty response');
  return { text, provider:'openrouter', model };
}