export type TrigramId = 1|2|3|4|5|6|7|8;
export type DivinationMode = 'time' | 'mystic';
export type FiveElement = '木'|'火'|'土'|'金'|'水';
export type BodyUseRelation = '比和'|'体生用'|'用生体'|'体克用'|'用克体';

export interface Trigram {
  id: TrigramId;
  name: string;
  symbol: string;
  element: FiveElement;
  nature: string;
  binary: [number, number, number];
}

export const TRIGRAMS: Record<TrigramId, Trigram> = {
  1: { id:1, name:'乾', symbol:'☰', element:'金', nature:'天', binary:[1,1,1] },
  2: { id:2, name:'兑', symbol:'☱', element:'金', nature:'泽', binary:[1,1,0] },
  3: { id:3, name:'离', symbol:'☲', element:'火', nature:'火', binary:[1,0,1] },
  4: { id:4, name:'震', symbol:'☳', element:'木', nature:'雷', binary:[1,0,0] },
  5: { id:5, name:'巽', symbol:'☴', element:'木', nature:'风', binary:[0,1,1] },
  6: { id:6, name:'坎', symbol:'☵', element:'水', nature:'水', binary:[0,1,0] },
  7: { id:7, name:'艮', symbol:'☶', element:'土', nature:'山', binary:[0,0,1] },
  8: { id:8, name:'坤', symbol:'☷', element:'土', nature:'地', binary:[0,0,0] },
};

export const KING_WEN: Record<number, { name:string; upper:TrigramId; lower:TrigramId }> = {
  1:{name:'乾为天',upper:1,lower:1},2:{name:'坤为地',upper:8,lower:8},3:{name:'水雷屯',upper:6,lower:4},4:{name:'山水蒙',upper:7,lower:6},5:{name:'水天需',upper:6,lower:1},6:{name:'天水讼',upper:1,lower:6},7:{name:'地水师',upper:8,lower:6},8:{name:'水地比',upper:6,lower:8},
  9:{name:'风天小畜',upper:5,lower:1},10:{name:'天泽履',upper:1,lower:2},11:{name:'地天泰',upper:8,lower:1},12:{name:'天地否',upper:1,lower:8},13:{name:'天火同人',upper:1,lower:3},14:{name:'火天大有',upper:3,lower:1},15:{name:'地山谦',upper:8,lower:7},16:{name:'雷地豫',upper:4,lower:8},
  17:{name:'泽雷随',upper:2,lower:4},18:{name:'山风蛊',upper:7,lower:5},19:{name:'地泽临',upper:8,lower:2},20:{name:'风地观',upper:5,lower:8},21:{name:'火雷噬嗑',upper:3,lower:4},22:{name:'山火贲',upper:7,lower:3},23:{name:'山地剥',upper:7,lower:8},24:{name:'地雷复',upper:8,lower:4},
  25:{name:'天雷无妄',upper:1,lower:4},26:{name:'山天大畜',upper:7,lower:1},27:{name:'山雷颐',upper:7,lower:4},28:{name:'泽风大过',upper:2,lower:5},29:{name:'坎为水',upper:6,lower:6},30:{name:'离为火',upper:3,lower:3},31:{name:'泽山咸',upper:2,lower:7},32:{name:'雷风恒',upper:4,lower:5},
  33:{name:'天山遁',upper:1,lower:7},34:{name:'雷天大壮',upper:4,lower:1},35:{name:'火地晋',upper:3,lower:8},36:{name:'地火明夷',upper:8,lower:3},37:{name:'风火家人',upper:5,lower:3},38:{name:'火泽睽',upper:3,lower:2},39:{name:'水山蹇',upper:6,lower:7},40:{name:'雷水解',upper:4,lower:6},
  41:{name:'山泽损',upper:7,lower:2},42:{name:'风雷益',upper:5,lower:4},43:{name:'泽天夬',upper:2,lower:1},44:{name:'天风姤',upper:1,lower:5},45:{name:'泽地萃',upper:2,lower:8},46:{name:'地风升',upper:8,lower:5},47:{name:'泽水困',upper:2,lower:6},48:{name:'水风井',upper:6,lower:5},
  49:{name:'泽火革',upper:2,lower:3},50:{name:'火风鼎',upper:3,lower:5},51:{name:'震为雷',upper:4,lower:4},52:{name:'艮为山',upper:7,lower:7},53:{name:'风山渐',upper:5,lower:7},54:{name:'雷泽归妹',upper:4,lower:2},55:{name:'雷火丰',upper:4,lower:3},56:{name:'火山旅',upper:3,lower:7},
  57:{name:'巽为风',upper:5,lower:5},58:{name:'兑为泽',upper:2,lower:2},59:{name:'风水涣',upper:5,lower:6},60:{name:'水泽节',upper:6,lower:2},61:{name:'风泽中孚',upper:5,lower:2},62:{name:'雷山小过',upper:4,lower:7},63:{name:'水火既济',upper:6,lower:3},64:{name:'火水未济',upper:3,lower:6}
};

export function hexagramName(upper: TrigramId, lower: TrigramId): string {
  for (const k of Object.keys(KING_WEN)) {
    const item = KING_WEN[Number(k)];
    if (item.upper === upper && item.lower === lower) return item.name;
  }
  return `${TRIGRAMS[upper].name}${TRIGRAMS[lower].name}`;
}

export function hexagramIndex(upper: TrigramId, lower: TrigramId): number {
  for (const [k, item] of Object.entries(KING_WEN)) {
    if (item.upper === upper && item.lower === lower) return Number(k);
  }
  throw new Error('Unknown hexagram combination');
}

export function hexagramLines(upper: TrigramId, lower: TrigramId): number[] {
  return [...TRIGRAMS[lower].binary, ...TRIGRAMS[upper].binary];
}

export function trigramFromBinary(bits: [number,number,number]): TrigramId {
  const key = bits.join('');
  for (const id of Object.keys(TRIGRAMS).map(Number) as TrigramId[]) {
    if (TRIGRAMS[id].binary.join('') === key) return id;
  }
  throw new Error(`Unknown trigram binary: ${key}`);
}

export function hexagramFromLines(lines: number[]): { upper: TrigramId; lower: TrigramId; index: number; name: string } {
  if (lines.length !== 6) throw new Error('A hexagram must contain six lines');
  const lower = trigramFromBinary(lines.slice(0,3) as [number,number,number]);
  const upper = trigramFromBinary(lines.slice(3,6) as [number,number,number]);
  return { upper, lower, index: hexagramIndex(upper, lower), name:hexagramName(upper, lower) };
}

export function changedHexagram(upper: TrigramId, lower: TrigramId, movingLine: number) {
  if (movingLine < 1 || movingLine > 6) throw new Error('movingLine must be 1..6');
  const lines = hexagramLines(upper, lower);
  lines[movingLine - 1] = lines[movingLine - 1] ? 0 : 1;
  const changed = hexagramFromLines(lines);
  return { ...changed, upper:changed.upper, lower:changed.lower };
}

/** 互卦：取二三四爻为下卦、三四五爻为上卦。 */
export function mutualHexagram(upper: TrigramId, lower: TrigramId) {
  const lines = hexagramLines(upper, lower);
  return hexagramFromLines([lines[1],lines[2],lines[3],lines[2],lines[3],lines[4]]);
}

/** 错卦：六爻阴阳全部反转。 */
export function oppositeHexagram(upper: TrigramId, lower: TrigramId) {
  return hexagramFromLines(hexagramLines(upper, lower).map(v=>v?0:1));
}

/** 综卦：六爻上下颠倒（初爻与上爻互换）。 */
export function reverseHexagram(upper: TrigramId, lower: TrigramId) {
  return hexagramFromLines(hexagramLines(upper, lower).slice().reverse());
}

const GENERATES: Record<FiveElement, FiveElement> = {木:'火',火:'土',土:'金',金:'水',水:'木'};
const CONTROLS: Record<FiveElement, FiveElement> = {木:'土',土:'水',水:'火',火:'金',金:'木'};

export function bodyUseRelation(body: Trigram, use: Trigram): BodyUseRelation {
  if (body.element === use.element) return '比和';
  if (GENERATES[body.element] === use.element) return '体生用';
  if (GENERATES[use.element] === body.element) return '用生体';
  if (CONTROLS[body.element] === use.element) return '体克用';
  if (CONTROLS[use.element] === body.element) return '用克体';
  throw new Error(`Cannot determine relation: ${body.element}/${use.element}`);
}

export function bodyUseMeaning(relation: BodyUseRelation): string {
  return ({
    '比和':'体用同五行，倾向于协调、同类、稳定。',
    '体生用':'体泄于用，往往意味着自身付出、消耗或主动投入较多。',
    '用生体':'外部条件生助自身，通常较有助力，事情相对容易获得支持。',
    '体克用':'自身对所问之事有控制、推动或制约能力，但也可能较费力。',
    '用克体':'所问之事或外部环境对自身形成压力、约束或消耗。'
  } as Record<BodyUseRelation,string>)[relation];
}

export interface AnalyticalHexagram { index:number; name:string; upper:Trigram; lower:Trigram; }
export interface Analysis {
  mutual: AnalyticalHexagram;
  opposite: AnalyticalHexagram;
  reverse: AnalyticalHexagram;
  bodyUseRelation: BodyUseRelation;
  bodyUseMeaning: string;
}

export function analyzeHexagram(upper: TrigramId, lower: TrigramId, movingLine: number, bodyId: TrigramId, useId: TrigramId): Analysis {
  const mutual=mutualHexagram(upper,lower);
  const opposite=oppositeHexagram(upper,lower);
  const reverse=reverseHexagram(upper,lower);
  const body=TRIGRAMS[bodyId]; const use=TRIGRAMS[useId];
  const relation=bodyUseRelation(body,use);
  return {mutual:{...mutual,upper:TRIGRAMS[mutual.upper],lower:TRIGRAMS[mutual.lower]},opposite:{...opposite,upper:TRIGRAMS[opposite.upper],lower:TRIGRAMS[opposite.lower]},reverse:{...reverse,upper:TRIGRAMS[reverse.upper],lower:TRIGRAMS[reverse.lower]},bodyUseRelation:relation,bodyUseMeaning:bodyUseMeaning(relation)};
}

export function remainder(value: number, divisor: number): number { const r=value%divisor; return r===0?divisor:r; }

export interface TimeDivinationInput { lunarYear:number; lunarMonth:number; lunarDay:number; yearBranchNo:number; hourBranchNo:number; }
export interface DivinationResult {
  mode:DivinationMode; upper:Trigram; lower:Trigram; originalIndex:number; originalName:string; movingLine:number;
  changed:{upper:Trigram;lower:Trigram;index:number;name:string}; body:Trigram; use:Trigram; analysis:Analysis;
  method:string; formula:string; lunar?:{year:number;month:number;day:number;yearBranchNo:number;hourBranchNo:number};
}

function finish(mode:DivinationMode, upperId:TrigramId, lowerId:TrigramId, movingLine:number, method:string, formula:string, lunar?:DivinationResult['lunar']): DivinationResult {
  const originalIndex=hexagramIndex(upperId,lowerId); const changed=changedHexagram(upperId,lowerId,movingLine);
  const bodyId=movingLine<=3?upperId:lowerId; const useId=movingLine<=3?lowerId:upperId;
  return {mode,upper:TRIGRAMS[upperId],lower:TRIGRAMS[lowerId],originalIndex,originalName:hexagramName(upperId,lowerId),movingLine,changed:{...changed,upper:TRIGRAMS[changed.upper],lower:TRIGRAMS[changed.lower],name:hexagramName(changed.upper,changed.lower)},body:TRIGRAMS[bodyId],use:TRIGRAMS[useId],analysis:analyzeHexagram(upperId,lowerId,movingLine,bodyId,useId),method,formula,lunar};
}

export function timeDivination(input:TimeDivinationInput):DivinationResult {
  const total=input.yearBranchNo+input.lunarMonth+input.lunarDay;
  const upperId=remainder(total,8) as TrigramId;
  const lowerId=remainder(total+input.hourBranchNo,8) as TrigramId;
  const movingLine=remainder(total+input.hourBranchNo,6);
  return finish('time',upperId,lowerId,movingLine,'梅花易数·农历年月日时起卦',`上卦=(年支序数${input.yearBranchNo}+月${input.lunarMonth}+日${input.lunarDay}) mod 8；下卦=(总数+时支序数${input.hourBranchNo}) mod 8；动爻=(总数+时支序数) mod 6`,{year:input.lunarYear,month:input.lunarMonth,day:input.lunarDay,yearBranchNo:input.yearBranchNo,hourBranchNo:input.hourBranchNo});
}

export function mysticDivination(bytes:Uint8Array):DivinationResult {
  if(bytes.length<3) throw new Error('Need at least 3 bytes');
  return finish('mystic',(bytes[0]%8+1) as TrigramId,(bytes[1]%8+1) as TrigramId,bytes[2]%6+1,'ChinaMystic 灵机起卦','SHA-256 entropy → 上卦 / 下卦 / 动爻');
}
