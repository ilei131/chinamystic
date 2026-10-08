import React, {useState} from 'react';
import {TonConnectUIProvider, TonConnectButton, useTonConnectUI} from '@tonconnect/ui-react';
import {createRoot} from 'react-dom/client';
import './style.css';

const API=import.meta.env.VITE_API_BASE_URL || '';

type Result={divination:any;interpretation:any;ai:any};

function Lines({g}:{g:any}){
  const lines=[...(g.lower?.binary||[]),...(g.upper?.binary||[])];
  return <div className="lines">{lines.map((v:number,i:number)=><div className={v?'yang':'yin'} key={i}><span/><span/></div>)}</div>
}

function SupportPanel(){
 const [tonConnectUI]=useTonConnectUI();
 const [custom,setCustom]=useState('');
 const recipient=import.meta.env.VITE_TON_RECIPIENT||'';
 const kofi=import.meta.env.VITE_KOFI_URL||'';
 async function pay(amount:number){
   if(!recipient) return;
   await tonConnectUI.sendTransaction({validUntil:Math.floor(Date.now()/1000)+300,messages:[{address:recipient,amount:String(Math.round(amount*1e9))}]});
 }
 return <div className="card support-card"><div className="section-kicker">支持 ChinaMystic</div><h3>☕ 如果这次解卦对你有帮助</h3><p>可以自愿请我喝杯咖啡。免费功能不会因此受到影响。</p><div className="support-actions">{kofi&&<a className="support-btn" href={kofi} target="_blank" rel="noreferrer">☕ Ko-fi</a>} {recipient&&<><TonConnectButton/><button className="support-btn" onClick={()=>pay(.1)}>0.1 TON</button><button className="support-btn" onClick={()=>pay(.5)}>0.5 TON</button><button className="support-btn" onClick={()=>pay(1)}>1 TON</button><div className="custom-ton"><input inputMode="decimal" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="自定义 TON"/><button className="support-btn" onClick={()=>{const n=Number(custom);if(n>0)pay(n)}}>支持</button></div></>}</div></div>
}

function App(){
 const [question,setQuestion]=useState('');
 const [mode,setMode]=useState<'time'|'mystic'>('time');
 const [loading,setLoading]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState('');
 async function divine(){
   if(question.trim().length<2)return setError('请先输入一个想占问的问题。');
   setLoading(true);setError('');setResult(null);
   try{
    const r=await fetch(`${API}/api/divine`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,mode,timezoneOffsetMinutes:new Date().getTimezoneOffset()*-1})});
    const j=await r.json(); if(!r.ok) throw new Error(j.error||'占卜失败'); setResult(j);
   }catch(e:any){setError(e.message||'暂时无法连接占卜服务。')} finally{setLoading(false)}
 }
 const d=result?.divination;
 return <main>
  <section className="hero">
   <div className="eyebrow">CHINA MYSTIC · TMA</div>
   <h1>以易观象<br/><em>AI 解意</em></h1>
   <p className="lead">古老的梅花易数，结合现代 AI 的文化解读。</p>
   <div className="card ask">
    <label>你想问什么？</label>
    <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="例如：今年适合换工作吗？" maxLength={1000}/>
    <div className="controls">
      <div className="modes"><button className={mode==='time'?'active':''} onClick={()=>setMode('time')}>传统时间起卦</button><button className={mode==='mystic'?'active':''} onClick={()=>setMode('mystic')}>灵机起卦</button></div>
      <button className="divine" onClick={divine} disabled={loading}>{loading?'正在观象…':'✦ 灵机起卦'}</button>
    </div>
    {error&&<div className="error">{error}</div>}
   </div>
  </section>
  {d&&<section className="result-wrap">
   <div className="result-head"><span>{d.method}</span><small>{d.lunar?`农历 ${d.lunar.year}年${d.lunar.month}月${d.lunar.day}日`:'现代熵源'}</small></div>
   <div className="hex-grid">
    <div className="card hex-card"><div className="section-kicker">本卦</div><h2>{d.original.name}</h2><div className="gua-symbols">{d.original.upper.symbol}<span>+</span>{d.original.lower.symbol}</div><Lines g={d.original}/><div className="meta">上卦 {d.original.upper.name} · 下卦 {d.original.lower.name}<br/>体 {d.body.name}（{d.body.element}） · 用 {d.use.name}（{d.use.element}）</div></div>
    <div className="arrow">第 {d.movingLine} 爻动<br/><span>↓</span></div>
    <div className="card hex-card changed"><div className="section-kicker">变卦</div><h2>{d.changed.name}</h2><div className="gua-symbols">{d.changed.upper.symbol}<span>+</span>{d.changed.lower.symbol}</div><Lines g={d.changed}/><div className="meta">体用：{d.analysis.bodyUseRelation}</div></div>
   </div>
   <div className="card analysis-card">
    <div className="section-kicker">梅花易数结构</div>
    <div className="analysis-grid">
      <div><span>体用</span><strong>{d.analysis.bodyUseRelation}</strong><small>{d.body.element} → {d.use.element}</small></div>
      <div><span>互卦</span><strong>{d.analysis.mutual.name}</strong><small>{d.analysis.mutual.upper.symbol} {d.analysis.mutual.lower.symbol}</small></div>
      <div><span>错卦</span><strong>{d.analysis.opposite.name}</strong><small>{d.analysis.opposite.upper.symbol} {d.analysis.opposite.lower.symbol}</small></div>
      <div><span>综卦</span><strong>{d.analysis.reverse.name}</strong><small>{d.analysis.reverse.upper.symbol} {d.analysis.reverse.lower.symbol}</small></div>
    </div>
   </div>
   <div className="card reading">
    <div className="section-kicker">AI 解卦</div>
    {result.ai.available&&result.interpretation?<>
      <h3>{result.interpretation.summary}</h3>
      <Block title="本卦" text={result.interpretation.hexagram}/><Block title="体用五行" text={result.interpretation.bodyUse}/><Block title={`第${d.movingLine}爻`} text={result.interpretation.movingLine}/><Block title="变卦" text={result.interpretation.changed}/><Block title="互卦" text={result.interpretation.mutual}/><Block title="错卦 · 综卦" text={result.interpretation.secondary}/><Block title="综合判断" text={result.interpretation.answer}/><Block title="建议" text={result.interpretation.advice}/>
    </>:<><h3>AI 解读暂时不可用</h3><Block title="卦辞" text={d.classical.guaci}/>{d.classical.movingYao&&<Block title="动爻" text={d.classical.movingYao}/>}<p>当前仍可依据本卦、动爻和变卦进行传统文化层面的参考。</p></>}
    <div className="disclaimer">{result.interpretation?.disclaimer||'传统文化解读，仅供参考，不构成医疗、法律、投资等专业建议。'}</div>
   </div>
   <SupportPanel/>
  </section>}
  <footer>ChinaMystic TMA · Traditional Chinese Divination × AI</footer>
 </main>
}
function Block({title,text}:{title:string;text?:string}){return <div className="reading-block"><h4>{title}</h4><p>{text||'—'}</p></div>}

const manifestUrl=(import.meta.env.VITE_SITE_URL||window.location.origin).replace(/\/$/,'')+'/tonconnect-manifest.json';
createRoot(document.getElementById('root')!).render(<TonConnectUIProvider manifestUrl={manifestUrl}><App/></TonConnectUIProvider>);
