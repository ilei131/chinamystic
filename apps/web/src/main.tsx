import React, {useState} from 'react';
import {TonConnectUIProvider, TonConnectButton, useTonConnectUI} from '@tonconnect/ui-react';
import {createRoot} from 'react-dom/client';
import {detectLang, t, Lang} from './i18n';
import './style.css';

const API=import.meta.env.VITE_API_BASE_URL || '';

type Result={divination:any;interpretation:any;ai:any};

function Lines({g}:{g:any}){
  const lines=[...(g.lower?.binary||[]),...(g.upper?.binary||[])];
  return <div className="lines">{lines.map((v:number,i:number)=><div className={v?'yang':'yin'} key={i}><span/><span/></div>)}</div>
}

function Spinner(){
  return <div className="spinner-overlay"><div className="spinner"/><p className="spinner-text">Consulting the oracle…</p></div>
}

function SupportPanel({lang}:{lang:Lang}){
 const T=t(lang);
 const [tonConnectUI]=useTonConnectUI();
 const [custom,setCustom]=useState('');
 const recipient=import.meta.env.VITE_TON_RECIPIENT||'';
 const kofi=import.meta.env.VITE_KOFI_URL||'';
 async function pay(amount:number){
   if(!recipient) return;
   await tonConnectUI.sendTransaction({validUntil:Math.floor(Date.now()/1000)+300,messages:[{address:recipient,amount:String(Math.round(amount*1e9))}]});
 }
 return <div className="card support-card"><div className="section-kicker">{T.supportKicker}</div><h3>{T.supportTitle}</h3><p>{T.supportDesc}</p><div className="support-actions">{kofi&&<a className="support-btn" href={kofi} target="_blank" rel="noreferrer">☕ Ko-fi</a>} {recipient&&<><TonConnectButton/><button className="support-btn" onClick={()=>pay(.1)}>0.1 TON</button><button className="support-btn" onClick={()=>pay(.5)}>0.5 TON</button><button className="support-btn" onClick={()=>pay(1)}>1 TON</button><div className="custom-ton"><input inputMode="decimal" value={custom} onChange={e=>setCustom(e.target.value)} placeholder={T.supportCustomPlaceholder}/><button className="support-btn" onClick={()=>{const n=Number(custom);if(n>0)pay(n)}}>{T.supportBtn}</button></div></>}</div></div>
}

function Block({title,text}:{title:string;text?:string}){return <div className="reading-block"><h4>{title}</h4><p>{text||'—'}</p></div>}

function App(){
 const [question,setQuestion]=useState('');
 const [loading,setLoading]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState('');
 const [lang,setLang]=useState<Lang>(detectLang);
 const T=t(lang);
 async function divine(){
   if(question.trim().length<2)return setError(T.errorTooShort);
   setLoading(true);setError('');setResult(null);
   try{
    const r=await fetch(`${API}/api/divine`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,mode:'mystic',language:lang,timezoneOffsetMinutes:new Date().getTimezoneOffset()*-1})});
    const j=await r.json(); if(!r.ok) throw new Error(j.error||T.errorDivineFailed); setResult(j);
   }catch(e:any){setError(e.message||T.errorNetwork)} finally{setLoading(false)}
 }
 function toggleLang(){setLang(l=>l==='zh'?'en':'zh')}
 const d=result?.divination;
 return <main>
  {loading&&<Spinner/>}
  <div className="lang-switch"><button onClick={toggleLang} title={T.languageSwitch}>{T.languageSwitch}</button></div>
  <section className="hero">
   <div className="eyebrow">{T.eyebrow}</div>
   <h1>{T.hero1}<br/><em>{T.hero2}</em></h1>
   <p className="lead">{T.lead}</p>
   <div className="card ask">
    <label>{T.askLabel}</label>
    <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder={T.placeholder} maxLength={1000}/>
    <div className="controls">
      <div/>
      <button className="divine" onClick={divine} disabled={loading}>{loading?T.divineLoading:T.divineBtn}</button>
    </div>
    {error&&<div className="error">{error}</div>}
   </div>
  </section>
  {d&&<section className="result-wrap">
   <div className="result-head"><span>{d.method}</span><small>{d.lunar?`${lang==='zh'?'农历':'Lunar'} ${d.lunar.year}${lang==='zh'?'年':'/'}${d.lunar.month}${lang==='zh'?'月':'/'}${d.lunar.day}${lang==='zh'?'日':''}`:`${lang==='zh'?'现代熵源':'Modern entropy source'}`}</small></div>
   <div className="hex-grid">
    <div className="card hex-card"><div className="section-kicker">{T.sectionOriginal}</div><h2>{d.original.name}</h2><div className="gua-symbols">{d.original.upper.symbol}<span>+</span>{d.original.lower.symbol}</div><Lines g={d.original}/><div className="meta">{T.upperHex} {d.original.upper.name} · {T.lowerHex} {d.original.lower.name}<br/>{T.body} {d.body.name}（{d.body.element}） · {T.use} {d.use.name}（{d.use.element}）</div></div>
    <div className="arrow">{lang==='zh'?`第 ${d.movingLine} 爻动`:`Line ${d.movingLine} moves`}<br/><span>↓</span></div>
    <div className="card hex-card changed"><div className="section-kicker">{T.sectionChanged}</div><h2>{d.changed.name}</h2><div className="gua-symbols">{d.changed.upper.symbol}<span>+</span>{d.changed.lower.symbol}</div><Lines g={d.changed}/><div className="meta">{T.body}{T.use}：{d.analysis.bodyUseRelation}</div></div>
   </div>
   <div className="card analysis-card">
    <div className="section-kicker">{T.sectionAnalysis}</div>
    <div className="analysis-grid">
      <div><span>{T.body}{T.use}</span><strong>{d.analysis.bodyUseRelation}</strong><small>{d.body.element} → {d.use.element}</small></div>
      <div><span>{lang==='zh'?'互卦':'Mutual'}</span><strong>{d.analysis.mutual.name}</strong><small>{d.analysis.mutual.upper.symbol} {d.analysis.mutual.lower.symbol}</small></div>
      <div><span>{lang==='zh'?'错卦':'Opposite'}</span><strong>{d.analysis.opposite.name}</strong><small>{d.analysis.opposite.upper.symbol} {d.analysis.opposite.lower.symbol}</small></div>
      <div><span>{lang==='zh'?'综卦':'Reverse'}</span><strong>{d.analysis.reverse.name}</strong><small>{d.analysis.reverse.upper.symbol} {d.analysis.reverse.lower.symbol}</small></div>
    </div>
   </div>
   <div className="card reading">
    <div className="section-kicker">{T.sectionReading}</div>
    {result.ai.available&&result.interpretation?<>
      <h3>{result.interpretation.summary}</h3>
      <Block title={T.blockHexagram} text={result.interpretation.hexagram}/><Block title={T.blockBodyUse} text={result.interpretation.bodyUse}/><Block title={`${lang==='zh'?'第':'Line '}${d.movingLine}${lang==='zh'?'爻':''}`} text={result.interpretation.movingLine}/><Block title={T.blockChanged} text={result.interpretation.changed}/><Block title={T.blockMutual} text={result.interpretation.mutual}/><Block title={T.blockSecondary} text={result.interpretation.secondary}/><Block title={T.blockAnswer} text={result.interpretation.answer}/><Block title={T.blockAdvice} text={result.interpretation.advice}/>
    </>:<><h3>{T.aiUnavailable}</h3><Block title={T.blockGuaci} text={d.classical.guaci}/>{d.classical.movingYao&&<Block title={T.blockMovingYao} text={d.classical.movingYao}/>}<p>{T.aiUnavailableNote}</p></>}
    <div className="disclaimer">{result.interpretation?.disclaimer||T.disclaimer}</div>
   </div>
   <SupportPanel lang={lang}/>
  </section>}
  <footer>{T.footer}</footer>
 </main>
}

const manifestUrl=(import.meta.env.VITE_SITE_URL||window.location.origin).replace(/\/$/,'')+'/tonconnect-manifest.json';
createRoot(document.getElementById('root')!).render(<TonConnectUIProvider manifestUrl={manifestUrl}><App/></TonConnectUIProvider>);