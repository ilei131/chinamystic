// Fallback dataset shipped with the MVP. Run `npm run sync:zhouyi` to replace this
// with the complete public-domain Zhouyi dataset (64 卦 + 彖传 + 象传 + 爻辞).
import { JUDGEMENTS } from './hexagrams';
export const CLASSICAL = Object.fromEntries(
  Object.entries(JUDGEMENTS).map(([name, guaci]) => [name, { guaci, tuan:'', xiang:[], yaoci:[] }])
) as Record<string,{guaci:string;tuan:string;xiang:string[];yaoci:{position:string;text:string}[]}>;
