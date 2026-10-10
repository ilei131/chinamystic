import { buildPrompt } from './prompt';
import type { DivinationResult } from '@china-mystic/divination-core';
import { getClassical } from '../data/classical';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(apiKey:string, question:string, d:DivinationResult, language:'zh'|'en'='zh') {
  const model = DEFAULT_MODEL;
  const promptText = buildPrompt(question, d, language, getClassical(d.originalName));
  const systemText = language==='en'
    ? 'You are a careful Chinese traditional-culture interpretation assistant. Follow the user prompt exactly. Output in English with Chinese terms preserved alongside.'
    : 'You are a careful Chinese traditional-culture interpretation assistant. Follow the user prompt exactly.';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{'content-type':'application/json','Authorization':`Bearer ${apiKey}`},
    body:JSON.stringify({model,temperature:0.7,response_format:{type:'json_object'},messages:[{role:'system',content:systemText},{role:'user',content:promptText}]})
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const json:any = await res.json();
  const text = json?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Groq returned empty response');
  return { text, provider:'groq', model };
}
