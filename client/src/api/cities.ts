import apiRequest from "./client";

export type City={
    id: number;
    name: string;
    isActive: boolean;
}

export function getCities():Promise<City[]>{
    return apiRequest("/cities");
}