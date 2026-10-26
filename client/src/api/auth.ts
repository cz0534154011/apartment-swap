
import apiRequest from "./client";

export type User={
    id:number;
    fullName:string;
    email:string;
    phone:string|null;
    role:"USER"|"ADMIN";
    createdAt:string;
}
export type AuthResponse={
    token:string;
    expiresIn:number;
    user:User;
}
export type MeResponse={
    user:User;
    hasApartment:boolean;
}
export type RegisterData={
    fullName:string;
    email:string;
    password:string;
    phone?:string;
    acceptTerms:boolean;
}
export type LoginData={
    email:string;
    password:string;
}

export function register(data:RegisterData):Promise<AuthResponse>{
    return apiRequest("/auth/register",{method:"POST",data:data});
}
export function login(data:LoginData):Promise<AuthResponse>{
    return apiRequest("/auth/login",{method:"POST",data:data});
}
export function getMe():Promise<MeResponse>{
    return apiRequest("/auth/me");
}