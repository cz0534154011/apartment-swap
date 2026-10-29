import apiRequest from "./client";
import { type Paginated } from "./pagination";
import { type MyApartment } from "./myApartment";
import { type User } from "./auth";
import { type ApartmentSummary,type SwapStatus   } from "./swaps";

export type Owner = Pick<User, "id" | "fullName"|"email"|"phone" >
export type AdminApartment = MyApartment&{owner:Owner};
export type AdminSwapApartment = ApartmentSummary&{owner: Pick<User,"id"|"fullName">};
export type AdminUser = User&{apartment:{id: number, title: string, status: string,isBlocked: boolean}|null};
export type AdminSwap = {
    id: number;
    status: SwapStatus;
    startDate: string;
    endDate: string;
    senderApartment : AdminSwapApartment;
    receiverApartment: AdminSwapApartment;
    hasOpenCancelRequest: boolean;
    createdAt: string;
}

export function getAdminApartments(page: number): Promise<Paginated<AdminApartment>> {
    return apiRequest("/admin/apartments", { params: {page } })
}
export function blockApartment(id: number, reason: string): Promise<{ apartment: AdminApartment }> {
    return apiRequest("/admin/apartments/" + id + "/block", { method: "POST" ,data:{reason}})
}
export function unblockApartment(id: number): Promise<{ apartment: AdminApartment }> {
    return apiRequest("/admin/apartments/" + id + "/unblock", { method: "POST"})
}
export function getAdminUsers(page: number): Promise<Paginated<AdminUser>> {
    return apiRequest("/admin/users", { params: {page } })
}
export function getAdminSwaps(page: number): Promise<Paginated<AdminSwap>> {
    return apiRequest("/admin/swaps", { params: {page } })
}