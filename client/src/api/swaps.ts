import type { Apartment } from "./apartments";
import apiRequest from "./client";
import type { Paginated } from "./pagination";

export type CreateSwapData={
    receiverApartmentId:number;
    startDate:string;
    endDate:string;
    message?:string;
}
export type Swap={
    id:number;
    status:SwapStatus;
    startDate:string;
    endDate:string;
    message:string|null;
}
export type SwapStatus= "PENDING"|
"APPROVED"|
"REJECTED"|
"AUTO_REJECTED"|
"WITHDRAWN"|
"CANCELLED"|
"EXPIRED"
export type ApartmentSummary=Pick<Apartment,"id"|"title"|"city"|"beds"|"neighborhood"|"rooms">
export type SwapListItem={
    id:number;
    status:SwapStatus;
    startDate:string;
    endDate:string;
    direction:"SENT"|"RECEIVED";
    otherApartment:ApartmentSummary;
    hasOpenCancelRequest:boolean;
    cancelRequestedByMe:boolean;
    createdAt:string;
}

export function createSwap(data:CreateSwapData):Promise<{swap:Swap}>{
    return apiRequest("/swaps",{method:"POST",data:data})
}
export function getSwaps(box:"sent"|"received",page:number):Promise<Paginated<SwapListItem>>{
    return apiRequest("/swaps",{params:{box,page}})
}