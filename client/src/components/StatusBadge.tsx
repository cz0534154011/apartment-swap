import { type SwapStatus } from "../api/swaps";

const STATUS_LABELS: Record<SwapStatus, string> = {
    PENDING: "ממתינה",
    APPROVED: "מאושרת",
    REJECTED: "נדחתה",
    AUTO_REJECTED: "נדחתה אוטומטית",
    WITHDRAWN: "נמשכה",
    CANCELLED: "בוטלה",
    EXPIRED: "פג תוקף",
}
export type StatusBadgeProps = {
    status: SwapStatus;
}
function StatusBadge({ status }: StatusBadgeProps) {
    const statusClass = status.toLowerCase().replace("_", "-");
    return <span className={"badge badge--" + statusClass}>
        {STATUS_LABELS[status]}
    </span>
}
export default StatusBadge
