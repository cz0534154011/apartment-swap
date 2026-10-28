import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSwaps } from "../api/swaps"
import { Link } from "react-router-dom"
import StatusBadge from "../components/StatusBadge"
import Pagination from "../components/Pagination"
import { formatDate } from "../utils/formatDate"

function MyExchangesPage() {
    const [box, setBox] = useState<"received" | "sent">("received")
    const [page, setPage] = useState(1)
    const { data, error, isLoading } = useQuery({
        queryKey: ["swaps", box, page],
        queryFn: () => getSwaps(box, page)
    })
    function changeTab(newBox: "received" | "sent") {
        setBox(newBox);
        setPage(1)
    }
    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">ההחלפות שלי</h1>
                </div>
            </div>
            <div className="tabs" role="tablist">
                <button className={box === "received" ? "tabs__tab tabs__tab--active" : "tabs__tab"}
                    type="button" onClick={() => changeTab("received")}>קיבלתי</button>
                <button className={box === "sent" ? "tabs__tab tabs__tab--active" : "tabs__tab"}
                    type="button" onClick={() => changeTab("sent")}>שלחתי</button>
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
            {data?.items.length === 0 &&
                <div className="empty-state">
                    <h2 className="empty-state__title">אין הצעות</h2>
                    <p className="empty-state__text">כאן יופיעו ההצעות שלך</p>
                </div>
            }
            <ul className="offer-list">
                {data?.items.map((swap) => (
                    <li className={swap.hasOpenCancelRequest && !swap.cancelRequestedByMe?"offer-item offer-item--highlight":"offer-item"} key={swap.id}>
                        <div className="offer-item__main">
                            <h3 className="offer-item__title">{swap.otherApartment.title}</h3>
                            <ul className="offer-item__meta">
                                <li>
                                    {swap.otherApartment.city.name}
                                    {", "}
                                    {swap.otherApartment.neighborhood}
                                </li>
                                <li>
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
                                </li>
                                <li>
                                    {swap.otherApartment.beds} מיטות
                                </li>
                            </ul>
                        </div>
                        <div className="offer-item__status">
                            <StatusBadge status={swap.status} />
                            {swap.hasOpenCancelRequest && 
                                <span className="badge badge--cancel-request">בקשת ביטול פתוחה</span>
                            }
                        </div>
                        <div className="offer-item__actions">
                            <Link className="btn btn--secondary btn--small" to={"/exchanges/" + swap.id}>לפרטים</Link>
                        </div>
                    </li>)
                )
                }
            </ul>
            {data &&
                <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            }
        </>
    )
}
export default MyExchangesPage