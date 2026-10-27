
import apiRequest from "./client";

export type Apartment={
    id:number;
    title:string;
    city:{id:number,name:string};
    neighborhood:string;
    rooms:number;
    beds:number;
    floor:number;
    hasElevator:boolean;
    hasPlata:boolean;
    hasUrn:boolean;
    hasShabbatClock:boolean;
    hasEruv:boolean;
    hasGenerator:boolean;
    description:string;
    createdAt:string;
    updatedAt:string;
}
export type ApartmentsPage={
    items:Apartment[];
    page:number;
    pageSize:number;
    total:number;
    totalPages:number;
}
export type SearchFilters={
    cityId?:number;
    minBeds?:number;
    minRooms?:number;
    page?:number;
    from?:string;
    to?:string;
    q?:string;
    hasElevator?:boolean;
    hasPlata?:boolean;
    hasUrn?:boolean;
    hasShabbatClock?:boolean;
    hasEruv?:boolean;
    hasGenerator?:boolean;
}
export function searchApartments(filter:SearchFilters):Promise<ApartmentsPage>{
    return apiRequest("/apartments",{params:filter});
}