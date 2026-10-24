export type Urban=Record<string,string|number|null>;
export const urbanGroups:{id:string;title:string;fields:string[][]}[];
export const urbanFields:string[][];
export function urbanFrom(input?:Record<string,unknown>):Urban;
export function validateUrban(input:unknown,fail:(status:number,message:string)=>never):Urban;
export function urbanWarnings(config:Record<string,unknown>,district:string,today:string):string[];
