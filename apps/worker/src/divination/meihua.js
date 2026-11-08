import { Solar } from 'lunar-typescript';
import { timeDivination, mysticDivination } from '@china-mystic/divination-core';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const zhiNo = (zhi) => {
    const i = ZHI.indexOf(zhi);
    if (i < 0)
        throw new Error(`Unknown Earthly Branch: ${zhi}`);
    return i + 1;
};
export function localParts(now, timezoneOffsetMinutes) {
    const localMs = now.getTime() - timezoneOffsetMinutes * 60_000;
    const d = new Date(localMs);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() };
}
export function standardDivination(now, timezoneOffsetMinutes) {
    const p = localParts(now, timezoneOffsetMinutes);
    const solar = Solar.fromYmdHms(p.year, p.month, p.day, p.hour, p.minute, p.second);
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
export async function mysticDivinationFromSeed(seed) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
    const bytes = new Uint8Array(digest);
    return { result: mysticDivination(bytes), hash: [...bytes].map(b => b.toString(16).padStart(2, '0')).join('') };
}
