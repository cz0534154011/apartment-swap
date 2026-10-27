import { useQuery } from "@tanstack/react-query";
import { getSiteInfo } from "../api/site";
export function useSiteInfo(){
    return useQuery({
        queryKey: ["siteInfo"],
        queryFn: getSiteInfo
    })
}
