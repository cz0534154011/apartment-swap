import apiRequest from "./client";
import type { Paginated } from "./pagination";

export type Amenities = {
    hasElevator: boolean;
    hasPlata: boolean;
    hasUrn: boolean;
    hasShabbatClock: boolean;
    hasEruv: boolean;
    hasGenerator: boolean;
}
export type Apartment = {
    id: number;
    title: string;
    city: { id: number, name: string };
    neighborhood: string;
    rooms: number;
    beds: number;
    floor: number;
    description: string;
    createdAt: string;
    updatedAt: string;
} & Amenities
export type ApartmentsPage = Paginated<Apartment>
export type SearchFilters = {
    cityId?: number;
    minBeds?: number;
    minRooms?: number;
    page?: number;
    from?: string;
    to?: string;
    q?: string;
} & Partial<Amenities>
export type BusyRange = {
    startDate: string;
    endDate: string;
    reason: "SWAP" | "BLOCKED"
}
export type PendingRange = {
    swapId: number;
    startDate: string;
    endDate: string;
    direction: "SENT" | "RECEIVED"
}
export type CalendarResponse = {
    apartmentId: number;
    from: string;
    to: string;
    busyRanges: BusyRange[];
    pendingRanges?: PendingRange[];
}
export function searchApartments(filter: SearchFilters): Promise<ApartmentsPage> {
    return apiRequest("/apartments", { params: filter });
}
export function getApartment(id: number): Promise<{ apartment: Apartment }> {
    return apiRequest("/apartments/" + id);
}
export function getCalendar(id: number): Promise<CalendarResponse> {
    return apiRequest("/apartments/" + id + "/calendar")
}