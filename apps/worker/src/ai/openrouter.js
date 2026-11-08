import { buildPrompt } from './prompt';
import { getClassical } from '../data/classical';
export async function callOpenRouter(apiKey, model, question, d, language = 'zh', siteUrl, appName) {
    const promptText = buildPrompt(question, d, language, getClassical(d.originalName));
    const systemText = language === 'en'
        ? 'You are a careful Chinese traditional-culture interpretation assistant.'
        : 'You are a careful Chinese traditional-culture interpretation assistant.';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...(siteUrl ? { 'HTTP-Referer': siteUrl } : {}), ...(appName ? { 'X-Title': appName } : {}) },
        body: JSON.stringify({ model, temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: systemText }, { role: 'user', content: promptText }] })
    });
    if (!res.ok)
        throw new Error(`OpenRouter ${res.status}`);
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content || '';
    if (!text)
        throw new Error('OpenRouter returned empty response');
    return { text, provider: 'openrouter', model };
}
