import apiRequest from "./client";
import { type Paginated } from "./pagination";
import { type MyApartment } from "./myApartment";
import { type User } from "./auth";

export type Owner = Pick<User, "id" | "fullName"|"email" >
export type AdminApartment = MyApartment&{owner:Owner};

export function getAdminApartments(page: number): Promise<Paginated<AdminApartment>> {
    return apiRequest("/admin/apartments", { params: {page } })
}
export function blockApartment(id: number, reason: string): Promise<{ apartment: AdminApartment }> {
    return apiRequest("/admin/apartments/" + id + "/block", { method: "POST" ,data:{reason}})
}
export function unblockApartment(id: number): Promise<{ apartment: AdminApartment }> {
    return apiRequest("/admin/apartments/" + id + "/unblock", { method: "POST"})
}