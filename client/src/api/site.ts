
import apiRequest from "./client";

export type SiteInfo = {
    adminContactEmail: string;
    termsText: string;
    termsVersion: string;
};

export function getSiteInfo(): Promise<SiteInfo> {
    return apiRequest("/site-info");
}
