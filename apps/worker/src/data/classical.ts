import { CLASSICAL } from './classical.generated';
export type ClassicalHexagram = { guaci:string; tuan?:string; xiang?:string[]; yaoci?:{position:string;text:string}[] };
export function getClassical(name:string): ClassicalHexagram { return CLASSICAL[name] || {guaci:''}; }
