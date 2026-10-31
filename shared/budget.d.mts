import type {EconomicResult,Basis} from './economics.mjs';
export type BudgetValues={base:number|null;tax:number|null;total:number|null;share:number|null};
export type BudgetPart=BudgetValues&{label:string;amount?:number|null;basis?:Basis;quantity?:number|null;price?:number|null};
export type BudgetRow=BudgetValues&{key:string;label:string;parts:BudgetPart[]};
export function salesPercentage(amount:number|null,sales:number|null):number|null;
export function budgetSummary(result:EconomicResult,ownedLand?:boolean):{incomes:BudgetRow[];costs:BudgetRow[];incomeTotals:BudgetValues;costTotals:BudgetValues};
