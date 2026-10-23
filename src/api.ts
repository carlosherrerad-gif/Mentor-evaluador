export type User={id:string;name:string;email:string};
export type Role='admin'|'editor'|'reader';
export type Project={id:string;name:string;code:string;district:string;address:string;region:string;province:string;responsible:string;description:string;deleted_at:string|null;urban_config_json:string;land_json:string;status:'draft'|'active'|'archived';role:Role;revision:number;scenario_count:number;member_count:number;created_at:string;updated_at:string};
export type Scenario={id:string;project_id:string;name:string;revision:number;status:'active'|'archived';deleted_at:string|null;configuration_json:string;economics_json:string;source_template_json:string|null};
export type Template={id:string;owner_id:string;category:'building'|'urban';name:string;archived:number;version:number;config_json:string;note:string;version_date:string;author:string};
export type Member=User & {role:Role};
export type History={id:string;detail:string;user_name:string;created_at:string};
export type Session={user:User|null;setupRequired:boolean;setupAllowed:boolean;setupTokenRequired:boolean};
export class ApiError extends Error {constructor(message:string,public status:number,public code?:string){super(message);}}
export async function api<T>(path:string,method='GET',data?:unknown):Promise<T>{
  const response=await fetch(`/api${path}`,{method,credentials:'same-origin',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const result=await response.json().catch(()=>({error:'El servidor no devolvió una respuesta válida.'}));
  if(!response.ok)throw new ApiError(result.error||'No se pudo completar la operación.',response.status,result.code);
  return result;
}
