import type { Apartment } from "./apartments";
import type { User } from "./auth";
import apiRequest from "./client";
import type { Paginated } from "./pagination";

export type CreateSwapData = {
    receiverApartmentId: number;
    startDate: string;
    endDate: string;
    message?: string;
}
export type Swap = {
    id: number;
    status: SwapStatus;
    startDate: string;
    endDate: string;
    message: string | null;
    direction: "SENT" | "RECEIVED";
    senderApartment: ApartmentSummary;
    receiverApartment: ApartmentSummary;
    cancelRequest: CancelRequest | null;
    otherParty: OtherParty | null;
    allowedActions: AllowedActions;
    createdAt: string;
    respondedAt: string | null;
    cancelledAt: string | null;
}
export type SwapActionName = "approve" |
    "reject" |
    "withdraw" |
    "cancel-request/approve" |
    "cancel-request/reject" |
    "cancel-request/withdraw"
export type SwapStatus = "PENDING" |
    "APPROVED" |
    "REJECTED" |
    "AUTO_REJECTED" |
    "WITHDRAWN" |
    "CANCELLED" |
    "EXPIRED"
export type ApartmentSummary = Pick<Apartment, "id" | "title" | "city" | "beds" | "neighborhood" | "rooms">
export type SwapListItem = {
    id: number;
    status: SwapStatus;
    startDate: string;
    endDate: string;
    direction: "SENT" | "RECEIVED";
    otherApartment: ApartmentSummary;
    hasOpenCancelRequest: boolean;
    cancelRequestedByMe: boolean;
    createdAt: string;
}
export type OtherParty = Pick<User, "fullName" | "email" | "phone">
export type AllowedActions = {
    canApprove: boolean;
    canReject: boolean;
    canWithdraw: boolean;
    canRequestCancel: boolean;
    canApproveCancel: boolean;
    canRejectCancel: boolean;
    canWithdrawCancelRequest: boolean;
}
export type CancelRequest = {
    isOpen: boolean;
    requestedById: number;
    requestedByMe: boolean;
    reason: string | null;
    requestedAt: string;
}

export function createSwap(data: CreateSwapData): Promise<{ swap: Swap }> {
    return apiRequest("/swaps", { method: "POST", data: data })
}
export function getSwaps(box: "sent" | "received", page: number): Promise<Paginated<SwapListItem>> {
    return apiRequest("/swaps", { params: { box, page } })
}
export function getSwap(id: number): Promise<{ swap: Swap }> {
    return apiRequest("/swaps/" + id)
}
export function swapAction(id: number, action: SwapActionName): Promise<{ swap: Swap }> {
    return apiRequest("/swaps/" + id + "/" + action, { method: "POST" })
}
export function requestCancel(id: number, reason?: string): Promise<{ swap: Swap }> {
    return apiRequest("/swaps/" + id + "/cancel-request", { method: "POST" ,data:{reason}})
}