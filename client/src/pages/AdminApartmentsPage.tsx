import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAdminApartments, blockApartment, unblockApartment, type AdminApartment } from "../api/admin"
import { useState } from "react"
import Pagination from "../components/Pagination"

function AdminApartmentsPage() {
    const [page, setPage] = useState(1);
    const { data, error, isLoading } = useQuery({
        queryKey: ["adminApartments", page],
        queryFn: () => getAdminApartments(page)
    })
    const queryClient = useQueryClient();

    const { mutate: blockApt,
        error: blockError
    } = useMutation({
        mutationFn: (data: { id: number, reason: string }) => blockApartment(data.id, data.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["adminApartments"]
            })
        }
    })

    const { mutate: unblockApt,
        error: unblockError
    } = useMutation({
        mutationFn: unblockApartment,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["adminApartments"]
            })
        }
    })
    const actionError = blockError || unblockError
    function handleBlock(apartment: AdminApartment) {
        const reason = prompt("סיבת החסימה")
        if (reason) {
            blockApt({ id: apartment.id, reason })
        }
    }
    return (

        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">ניהול דירות</h1>
                </div>
            </div>
            {isLoading &&
                <div className="loading">
                    <span className="spinner"></span>
                    <p className="loading__text">טוען...</p>
                </div>
            }
            {error &&
                <div className="alert alert--error">
                    <p className="alert__text">{error.message}</p>
                </div>
            }
            {actionError &&
                <div className="alert alert--error">
                    <p className="alert__text">{actionError.message}</p>
                </div>
            }
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>שם</th>
                            <th>סטטוס</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.items.map((apartment) => (
                            <tr className={apartment.isBlocked ? "table__row--muted" : ""} key={apartment.id}>
                                <td>{apartment.title}</td>
                                <td>{apartment.city.name}</td>
                                <td>
                                    <div className="table__actions ">
                                        {apartment.isBlocked ?
                                            <button className="btn btn--secondary btn--small" type="button" onClick={() => unblockApt(apartment.id)}>שחרור </button>
                                            : <button className="btn btn--danger btn--small" type="button" onClick={() => handleBlock(apartment)}>חסימה</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data &&
                <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            }
        </>
    )

}
export default AdminApartmentsPage