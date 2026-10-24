export type Plant={unitsPerFloor:number|null;floorHeight:number|null;efficiency:number|null;constructedMode:'auto'|'manual';saleMode:'auto'|'manual';constructed:number|null;sale:number|null};
export type Special=Plant&{floor:number};
export type Building=Plant&{floors:number|null;occupancy:number|null;specials:Special[];notes:string;manualAreaReference:number|null};
export function buildingFrom(config?:Record<string,unknown>):Building;
export function validateBuilding(input:unknown,fail:(status:number,message:string)=>never,area?:number|null):Building;
export function buildingSummary(model:Building,area:number|null):{rows:{floor:number;special:boolean;constructedMode:string;saleMode:string;constructed:number|null;sale:number|null;units:number|null;average:number|null;height:number|null}[];constructed:number|null;sale:number|null;units:number|null;height:number|null;average:number|null;typicalFloors:number;specialFloors:number;errors:string[];manualReview:boolean;complete:boolean};
