import { useQuery } from "@tanstack/react-query"
import { getMyApartment } from "../api/myApartment"
import { ApiError } from "../api/client";
import  ApartmentForm from "../components/ApartmentForm";

function MyApartmentPage() {
    const { data, error, isLoading } = useQuery({
        queryKey: ["myApartment"],
        queryFn: getMyApartment,
        retry: false
    })
    const noApartment = error instanceof ApiError
        && error.code === "NO_APARTMENT";
    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">הדירה שלי</h1>
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
                <ApartmentForm/>
            }
            {data &&
                <ApartmentForm apartment={data.apartment} />
            }

        </>
    )
}
export default MyApartmentPage