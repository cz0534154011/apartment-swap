import apiRequest from "./client";

export type CreateSwapData={
    receiverApartmentId:number;
    startDate:string;
    endDate:string;
    message?:string;
}
export type Swap={
    id:number;
    status:string;
    startDate:string;
    endDate:string;
    message:string|null;
}
export function createSwap(data:CreateSwapData):Promise<{swap:Swap}>{
    return apiRequest("/swaps",{method:"POST",data:data})
}