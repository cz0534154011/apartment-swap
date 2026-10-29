import apiRequest from "./client";

export type City={
    id: number;
    name: string;
    isActive: boolean;
}
export type UpdateCityData={
    name ?:string;
    isActive?:boolean;
}

export function getCities():Promise<City[]>{
    return apiRequest("/cities");
}
export function getAllCities():Promise<City[]>{
    return apiRequest("/cities",{params:{includeInactive:true}});
}
export function createCity(name :string):Promise<{city:City}>{
    return apiRequest("/cities",{method:"POST",data:{name}});
}
export function updateCity(id:number,data:UpdateCityData):Promise<{city:City}>{
    return apiRequest("/cities/"+id,{method:"PATCH",data:data});
}
export function deleteCity(id:number){
    return apiRequest("/cities/"+id,{method:"DELETE"})
}