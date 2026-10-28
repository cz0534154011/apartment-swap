import { Link } from "react-router-dom";
import { useMyApartment } from "../hooks/useMyApartment"
import { ApiError } from "../api/client";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedDates, deleteBlockedDate } from "../api/myApartment";
import { formatDate } from "../utils/formatDate";

function MyAvailabilityPage() {
    const { data, isLoading, error } = useMyApartment();
    const noApartment = error instanceof ApiError
        && error.code === "NO_APARTMENT";
    const { data: blockedDates } = useQuery({
        queryKey: ["blockedDates"],
        queryFn: getBlockedDates,
        enabled: !!data
    })
    const queryClient = useQueryClient()
    const { mutate: removeBlock,
        isPending: removePending,
        error: removeError
    } = useMutation({
        mutationFn: deleteBlockedDate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blockedDates"] });
            queryClient.invalidateQueries({ queryKey: ["calendar"] });
        }
    })
    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">לוח התפוסה שלי</h1>
                    <p className="page-header__subtitle">כאן חוסמים תאריכים שבהם הדירה לא פנויה</p>
                </div>
            </div>
            {isLoading &&
                <div className="loading">
                    <span className="spinner"></span>
                    <p className="loading__text">טוען את הדירה...</p>
                </div>
            }
            {error && !noApartment &&
                <div className="alert alert--error">
                    <p className="alert__text">{error.message}</p>
                </div>
            }
            {noApartment &&
                <p className="text-muted">
                    כדי לנהל לוח תפוסה יש
                    {" "}
                    <Link to={"/my-apartment"}>לפרסם את הדירה שלך</Link>
                </p>
            }
            {data &&
                <div className="two-columns">
                    <div className="two-columns__main card">
                        <h2 className="card__title">החסימות שלי</h2>
                        {removeError &&
                            <div className="alert alert--error">
                                <p className="p.alert__text">{removeError.message}</p>
                            </div>
                        }
                        {blockedDates?.length === 0 &&
                            <p className="text-muted">אין חסימות</p>
                        }
                        <ul className="block-list">
                            {blockedDates?.map((block) => (
                                <li className="block-list__item" key={block.id}>
                                    <div className="block-list__info">
                                        <p className="block-list__dates">
                                            <span className="ltr">
                                                {formatDate(block.startDate)}
                                                עד
                                                {" "}
                                                {formatDate(block.endDate)}
                                            </span>
                                        </p>
                                        {block.note &&
                                            <p className="block-list__note">{block.note}</p>
                                        }
                                    </div>
                                    <button className="	btn btn--danger btn--small" type="button" disabled={removePending} onClick={()=>removeBlock(block.id)}>
                                        מחיקה
                                    </button>
                                </li>)
                            )
                            }
                        </ul>
                    </div>
                    <div className="two-columns__side">
                        <AvailabilityCalendar apartmentId={data.apartment.id} />
                    </div>

                </div>
            }
        </>
    )
}
export default MyAvailabilityPage