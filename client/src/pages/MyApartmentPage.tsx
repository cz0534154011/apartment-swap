import { useMutation, useQueryClient } from "@tanstack/react-query"
import { setMyApartmentStatus } from "../api/myApartment"
import { ApiError } from "../api/client";
import ApartmentForm from "../components/ApartmentForm";
import { useSiteInfo } from "../hooks/useSiteInfo";
import { useMyApartment } from "../hooks/useMyApartment";

function MyApartmentPage() {
    const { data, error, isLoading } = useMyApartment()
    const noApartment = error instanceof ApiError
        && error.code === "NO_APARTMENT";
    const queryClient = useQueryClient()
    const { data: siteInfo } = useSiteInfo()
    const { mutate: changeStatus,
        isPending: statusPending,
        error: statusError
    } = useMutation({
        mutationFn: setMyApartmentStatus,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myApartment"] })
    })
    const isActive = data?.apartment.status === "ACTIVE";
    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">הדירה שלי</h1>
                    {data &&
                        <p className="page-header__subtitle">{isActive ? "הדירה פעילה ומופיעה בחיפוש" : "הדירה מוסתרת ואינה מופיעה בחיפוש"}</p>}
                </div>
                {data &&
                    <div className="page-header__actions">
                        <button className="btn btn--secondary" type="button"
                            disabled={statusPending || data.apartment.isBlocked}
                            onClick={() => (changeStatus(isActive ? "HIDDEN" : "ACTIVE"))} >{isActive?"הסתרת הדירה":"הצגת הדירה"}</button>
                    </div>
                }
            </div>
            {statusError &&
                <div className="alert alert--error">
                    <p className="alert__text">{statusError.message}</p>
                </div>
            }
            {data?.apartment.isBlocked && 
                <div className="alert alert--blocked">
                    <p className="alert__title">הדירה שלך חסומה על ידי מנהל</p>
                    <p className="alert__reason">סיבה: {data.apartment.blockReason}</p>
                    <p className="alert__text">לבירור אפשר לפנות למנהל: 
                        {" "}
                        <a className="ltr" href={`mailto:${siteInfo?.adminContactEmail}`}>{siteInfo?.adminContactEmail}</a>
                    </p>
                </div>
            }
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
                <ApartmentForm />
            }
            {data &&
                <ApartmentForm apartment={data.apartment} />
            }

        </>
    )
}
export default MyApartmentPage