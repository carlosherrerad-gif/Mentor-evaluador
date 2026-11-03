export type Financing={clients:number|null;bank:number|null;equity:number|null;debtRate:number|null;equityRate:number|null;fee:number|null;notes:string};
export function validateFinancing(value?:unknown,fail?:(status:number,message:string)=>never):Financing;
export function financingSummary(input?:Record<string,unknown>):any;
