import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { getCities } from "../api/cities";
import { type SearchFilters } from "../api/apartments";

export type FilterFormValues = {
    cityId: string;
    minRooms: string;
    minBeds: string;
    from: string;
    to: string;
    q: string;
    hasElevator: boolean;
    hasPlata: boolean;
    hasUrn: boolean;
    hasShabbatClock: boolean;
    hasEruv: boolean;
    hasGenerator: boolean;
}