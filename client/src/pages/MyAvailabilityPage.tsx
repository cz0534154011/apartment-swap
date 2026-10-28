import { Link } from "react-router-dom";
import { useMyApartment } from "../hooks/useMyApartment"
import { ApiError } from "../api/client";
import AvailabilityCalendar from "../components/AvailabilityCalendar";

function MyAvailabilityPage() {
    const { data, isLoading, error } = useMyApartment();
    const noApartment = error instanceof ApiError
        && error.code === "NO_APARTMENT";
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
                        <p>כאן תהיה רשימת החסימות</p>
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