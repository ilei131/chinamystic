import { buildPrompt } from './prompt';
import type { DivinationResult } from '@china-mystic/divination-core';
import { getClassical } from '../data/classical';

export async function callGemini(apiKey:string, model:string, question:string, d:DivinationResult, language:'zh'|'en'='zh') {
  const promptText = buildPrompt(question, d, language, getClassical(d.originalName));
  const systemText = language==='en'
    ? 'You are a careful Chinese traditional-culture interpretation assistant. Follow the user prompt exactly. Output in English with Chinese terms preserved alongside.'
    : 'You are a careful Chinese traditional-culture interpretation assistant. Follow the user prompt exactly.';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method:'POST', headers:{'content-type':'application/json'},
    body:JSON.stringify({
      systemInstruction:{parts:[{text:systemText}]},
      contents:[{role:'user',parts:[{text:promptText}]}],
      generationConfig:{temperature:0.7,responseMimeType:'application/json'}
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json:any = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('') || '';
  if (!text) throw new Error('Gemini returned empty response');
  return { text, provider:'gemini', model };
}