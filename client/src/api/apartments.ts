import apiRequest from "./client";

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
}&Amenities
export type ApartmentsPage = {
    items: Apartment[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export type SearchFilters = {
    cityId?: number;
    minBeds?: number;
    minRooms?: number;
    page?: number;
    from?: string;
    to?: string;
    q?: string;
}&Partial<Amenities>
export function searchApartments(filter: SearchFilters): Promise<ApartmentsPage> {
    return apiRequest("/apartments", { params: filter });
}