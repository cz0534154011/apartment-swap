import { useQuery } from "@tanstack/react-query"
import { getAdminSwaps } from "../api/admin"
import { useState } from "react"
import Pagination from "../components/Pagination"
import  StatusBadge  from "../components/StatusBadge"
import  {formatDate}  from "../utils/formatDate"

function AdminExchangesPage() {
    const [page, setPage] = useState(1);
    const { data, error, isLoading } = useQuery({
        queryKey: ["adminSwaps", page],
        queryFn: () => getAdminSwaps(page)
    })

    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">כל ההחלפות</h1>
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
            
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>שולח</th>
                            <th>מקבל</th>
                            <th>תאריכים</th>
                            <th>סטטוס</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.items.map((swap) => (
                            <tr key={swap.id}>
                                <td>{swap.senderApartment.owner.fullName}<br />{swap.senderApartment.title}</td>
                                <td>{swap.receiverApartment.owner.fullName}<br />{swap.receiverApartment.title}</td>
                                <td>
                                     מ:
                                    {" "}
                                    <span className="ltr">
                                        {formatDate(swap.startDate)}
                                    </span>
                                    {" "}
                                    עד
                                    {" "}
                                    <span className="ltr">
                                        {formatDate(swap.endDate)}
                                    </span>
                                </td>
                                <td>
                                    <StatusBadge status={swap.status}/>
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
export default AdminExchangesPage