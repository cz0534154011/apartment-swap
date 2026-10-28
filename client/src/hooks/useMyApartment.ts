import { useQuery } from "@tanstack/react-query";
import { getMyApartment } from "../api/myApartment";
export function useMyApartment(){
    return useQuery({
        queryKey: ["myApartment"],
        queryFn: getMyApartment,
        retry:false
    })
}
