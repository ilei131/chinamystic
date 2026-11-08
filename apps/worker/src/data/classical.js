import { CLASSICAL } from './classical.generated';
export function getClassical(name) { return CLASSICAL[name] || { guaci: '' }; }
