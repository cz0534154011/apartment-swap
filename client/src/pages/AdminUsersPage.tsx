import { useQuery } from "@tanstack/react-query"
import { getAdminUsers } from "../api/admin"
import { useState } from "react"
import Pagination from "../components/Pagination"

function AdminUsersPage() {
    const [page, setPage] = useState(1);
    const { data, error, isLoading } = useQuery({
        queryKey: ["adminUsers", page],
        queryFn: () => getAdminUsers(page)
    })

    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">משתמשים</h1>
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
                            <th>שם</th>
                            <th>מייל</th>
                            <th>טלפון</th>
                            <th>תפקיד</th>
                            <th>דירה</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.items.map((user) => (
                            <tr key={user.id}>
                                <td>{user.fullName}</td>
                                <td>{<span className="ltr">{user.email}</span>}</td>
                                <td>
                                    {<span className="ltr">{user.phone}</span>}
                                </td>
                                <td>
                                    {user.role==="ADMIN"?"מנהל":"משתמש"}
                                </td>
                                <td>
                                    {user.apartment?.title??"אין"}
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
export default AdminUsersPage