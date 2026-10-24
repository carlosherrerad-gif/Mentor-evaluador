import type {Building,buildingSummary} from './building.mjs';
import type {extraSummary} from './building-extra.mjs';
import type {CheckResult} from './urban-checks.mjs';
export type Potential={model:Building;base:ReturnType<typeof buildingSummary>;extra:ReturnType<typeof extraSummary>;checks:CheckResult;hasLevels:boolean;groups:{id:string;name:string;constructed:number|null;sale:number|null;hypothesis:number|null;units:number|null;constructedOrigin:string;saleOrigin:string;note:string}[];pending:string[];warnings:string[];metrics:{units:number|null;constructed:number|null;sale:number|null;parking:number|null;commercial:number|null;hypothesis:number|null}};
export function potentialSummary(input:{configuration?:Record<string,unknown>;urban?:Record<string,unknown>;land?:Record<string,unknown>;district?:string;today:string}):Potential;
