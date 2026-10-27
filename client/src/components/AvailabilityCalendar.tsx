import { useQuery } from "@tanstack/react-query";
import { getCalendar } from "../api/apartments";
import { DayPicker } from "react-day-picker";
import { he } from "date-fns/locale";
import { addMonths } from "date-fns";

export type AvailabilityCalendarProps = {
    apartmentId: number
}
function AvailabilityCalendar({ apartmentId }: AvailabilityCalendarProps) {
    const { data: calendar } = useQuery({
        queryKey: ["calendar", apartmentId],
        queryFn: () => getCalendar(apartmentId)
    })
    const swapDays = calendar?.busyRanges?.filter((range) => range.reason === "SWAP").map((range) => ({ from: new Date(range.startDate), to: new Date(range.endDate) }))
    const blockedDays = calendar?.busyRanges?.filter((range) => range.reason === "BLOCKED").map((range) => ({ from: new Date(range.startDate), to: new Date(range.endDate) }))
    const maxDate = addMonths(new Date(), 6)
    return (
        <>
            <div className="calendar">
                <DayPicker
                    dir="rtl" locale={he}
                    startMonth={new Date()}
                    disabled={[{ before: new Date() }, { after: maxDate }]}
                    modifiers={{ swap: swapDays, blocked: blockedDays }}
                    modifiersClassNames={{ swap: "day--swap", blocked: "day--blocked" }}
                    endMonth={maxDate}
                />
            </div>
            <ul className="calendar-legend">
                <li className="calendar-legend__item">
                    <span className="calendar-legend__swatch calendar-legend__swatch--free"></span>
                    פנוי
                </li>
                <li className="calendar-legend__item">
                    <span className="calendar-legend__swatch calendar-legend__swatch--swap"></span>
                    החלפה מאושרת
                </li>
                <li className="calendar-legend__item">
                    <span className="calendar-legend__swatch calendar-legend__swatch--blocked"></span>
                    חסום
                </li>
            </ul>
        </>
    )
}
export default AvailabilityCalendar