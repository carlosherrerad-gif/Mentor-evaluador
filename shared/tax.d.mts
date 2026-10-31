import type {EconomicResult} from './economics.mjs';
export type TaxRule={status:'pending'|'taxed'|'exempt'|'unaffected';input:'pending'|'included'|'excluded';regime:'standard'|'property'|'custom';rate:number|null;taxablePercent:number|null;creditPercent:number|null;note:string};
export type TaxAmount={rule:TaxRule;base:number|null;tax:number|null;total:number|null;credit:number|null;nonRecoverable:number|null;economic:number|null;pending:string[]};
export type TaxRow=TaxAmount&{key:string;label:string;amount:number|null;income:boolean;nonCash?:boolean;source:{kind:string;key?:string;index?:number}};
export function validateTax(value?:unknown,fail?:(s:number,m:string)=>never):TaxRule;
export function taxAmount(amount:number|null,rule?:Partial<TaxRule>,income?:boolean):TaxAmount;
export function taxSummary(result:EconomicResult,ownedLand?:boolean):{rows:TaxRow[];pending:string[];complete:boolean;income:number|null;cost:number|null;profit:number|null;incomeTax:number|null;purchaseTax:number|null;credit:number|null;nonRecoverable:number|null;incomeTotal:number|null;costTotal:number|null};
