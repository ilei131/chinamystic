import fs from 'node:fs/promises';
import path from 'node:path';

// The classical Zhouyi text is ancient/public-domain material. This project uses the
// machine-readable dataset only as a convenient transcription source for the build.
// It is NOT stored in D1. The generated TS is bundled into the Worker.
const url='https://raw.githubusercontent.com/Johnson-Jia/liuyao-divination/main/data/zhouyi.json';
const out=path.resolve('apps/worker/src/data/classical.generated.ts');
const res=await fetch(url);
if(!res.ok) throw new Error(`download failed: ${res.status}`);
const source=await res.json();
const outData={};
for(const [name,value] of Object.entries(source)) {
  const yao=Object.entries(value.yao||{}).slice(0,6).map(([position,text])=>({position,text}));
  outData[name]={guaci:value.gua_ci||'',tuan:value.tuan||'',xiang:Array.isArray(value.xiang)?value.xiang:[],yaoci:yao};
}
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,`// GENERATED FILE — do not edit manually.\nexport const CLASSICAL = ${JSON.stringify(outData,null,2)} as const;\n`);
console.log(`generated ${out}`);
