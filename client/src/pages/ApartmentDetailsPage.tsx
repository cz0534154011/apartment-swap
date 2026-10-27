import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApartment, getCalendar } from "../api/apartments";
import AmenityTags from "../components/AmenityTags";
import { DayPicker } from "react-day-picker";
import { he } from "date-fns/locale";
import { addMonths } from "date-fns";

function ApartmentDetailsPage() {
    const { id } = useParams()
    const { data, error, isLoading } = useQuery({
        queryKey: ["apartment", id],
        queryFn: () => getApartment(Number(id))
    })
    const { data: calendar } = useQuery({
        queryKey: ["calendar", id],
        queryFn: () => getCalendar(Number(id))
    })
    const swapDays = calendar?.busyRanges?.filter((range) => range.reason === "SWAP").map((range) => ({ from: new Date(range.startDate), to: new Date(range.endDate) }))
    const blockedDays = calendar?.busyRanges?.filter((range) => range.reason === "BLOCKED").map((range) => ({ from: new Date(range.startDate), to: new Date(range.endDate) }))
    const maxDate = addMonths(new Date(), 6)
    return (
        <>
            {isLoading &&
                <div className="loading">
                    <span className="spinner"></span>
                    <p className="loading__text">טוען פרטי דירה...</p>
                </div>
            }
            {error &&
                <div className="alert alert--error">
                    <p className="alert__text">{error.message}</p>
                </div>
            }
            {data &&
                <>
                    <div className="page-header">
                        <div className="page-header__text">
                            <h1 className="page-header__title">{data.apartment.title}</h1>
                            <p className="page-header__subtitle">{data.apartment.city.name}, {data.apartment.neighborhood}</p>
                        </div>
                    </div>
                    <div className="two-columns">
                        <div className="two-columns__main">
                            <dl className="details-list">
                                <div className="details-list__item">
                                    <dt className="details-list__label">חדרים</dt>
                                    <dd className="details-list__value">{data.apartment.rooms}</dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">מיטות</dt>
                                    <dd className="details-list__value">{data.apartment.beds}</dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">קומה</dt>
                                    <dd className="details-list__value">{data.apartment.floor}</dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">עיר</dt>
                                    <dd className="details-list__value">{data.apartment.city.name}</dd>
                                </div>
                            </dl>
                            <AmenityTags apartment={data.apartment} />
                            <p className="text-block">{data.apartment.description}</p>
                        </div>
                        <div className="two-columns__side">
                            <div className="calendar">
                                <DayPicker
                                    dir="rtl" locale={he}
                                    startMonth={new Date()}
                                    disabled={[{ before: new Date() },{after:maxDate}]}
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

                        </div>
                    </div>
                </>
            }
        </>
    )
}
export default ApartmentDetailsPage