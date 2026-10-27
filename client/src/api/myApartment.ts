import apiRequest from "./client";
import { type Apartment } from "./apartments";

export type ApartmentStatus="ACTIVE"|"HIDDEN"

export type MyApartment=Apartment&{
    status:ApartmentStatus;
    isBlocked:boolean;
    blockReason:string|null;
    blockedAt:string|null;
}
export type MyApartmentResponse={
    apartment:MyApartment
}
export type ApartmentInput=Omit<Apartment,"id"|"city"|"createdAt"|"updatedAt">&{
    cityId:number;
}
export type BlockedDate={
    id:number;
    startDate:string;
    endDate:string;
    note:string|null;
}
export type BlockedDateInput={
    startDate:string;
    endDate:string;
    note?:string;
}

export function getMyApartment():Promise<MyApartmentResponse>{
    return apiRequest("/my/apartment")
}
export function createMyApartment(data:ApartmentInput):Promise<MyApartmentResponse>{
    return apiRequest("/my/apartment",{method:"POST", data:data})
}
export function updateMyApartment(data:ApartmentInput):Promise<MyApartmentResponse>{
    return apiRequest("/my/apartment",{method:"PUT", data:data})
}
export function setMyApartmentStatus(status:ApartmentStatus):Promise<MyApartmentResponse>{
    return apiRequest("/my/apartment/status",{method:"PATCH", data:{status:status}})
}
export function getBlockedDates():Promise<BlockedDate[]>{
    return apiRequest("/my/apartment/blocked-dates")
}
export function addBlockedDate(data:BlockedDateInput):Promise<{blockedDate:BlockedDate,autoRejectedOffers:number}>{
    return apiRequest("/my/apartment/blocked-dates",{method:"POST",data:data})
}
export function deleteBlockedDate(id:number){
    return apiRequest("/my/apartment/blocked-dates/"+id,{method:"DELETE"})
}