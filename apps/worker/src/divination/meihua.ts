import { Solar } from 'lunar-typescript';
import { timeDivination, mysticDivination, type DivinationResult } from '@china-mystic/divination-core';

const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const zhiNo = (zhi: string) => {
  const i = ZHI.indexOf(zhi);
  if (i < 0) throw new Error(`Unknown Earthly Branch: ${zhi}`);
  return i + 1;
};

export function localParts(now: Date, timezoneOffsetMinutes: number) {
  const localMs = now.getTime() - timezoneOffsetMinutes * 60_000;
  const d = new Date(localMs);
  return { year:d.getUTCFullYear(), month:d.getUTCMonth()+1, day:d.getUTCDate(), hour:d.getUTCHours(), minute:d.getUTCMinutes(), second:d.getUTCSeconds() };
}

export function standardDivination(now: Date, timezoneOffsetMinutes: number): DivinationResult {
  const p = localParts(now, timezoneOffsetMinutes);
  const solar = Solar.fromYmdHms(p.year,p.month,p.day,p.hour,p.minute,p.second);
  const lunar = solar.getLunar();
  const result = timeDivination({
    lunarYear: lunar.getYear(),
    lunarMonth: Math.abs(lunar.getMonth()),
    lunarDay: lunar.getDay(),
    yearBranchNo: zhiNo(lunar.getYearZhi()),
    hourBranchNo: zhiNo(lunar.getTimeZhi())
  });
  return result;
}

export async function mysticDivinationFromSeed(seed: string): Promise<{ result: DivinationResult; hash: string }> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
  const bytes = new Uint8Array(digest);
  return { result:mysticDivination(bytes), hash:[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('') };
}
