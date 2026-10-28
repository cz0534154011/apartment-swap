import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getSwap } from "../api/swaps"
import StatusBadge from "../components/StatusBadge"
import { formatDate } from "../utils/formatDate"

function ExchangeDetailsPage() {
    const { id } = useParams();
    const { data, error, isLoading } = useQuery({
        queryKey: ["swap", Number(id)],
        queryFn: () => getSwap(Number(id))
    })
    const swap = data?.swap;
    const otherApartment = swap?.direction === "SENT" ? swap.receiverApartment : swap?.senderApartment
    const myApartment = swap?.direction === "SENT" ? swap.senderApartment : swap?.receiverApartment
    return (
        <>
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
            {swap &&
                <>
                    <div className="page-header">
                        <div className="page-header__text">
                            <h1 className="page-header__title">{otherApartment?.title}</h1>
                            <p className="page-header__subtitle">{otherApartment?.city.name}</p>
                        </div>
                        <div className="page-header__actions">
                            <StatusBadge status={swap.status} />
                        </div>
                    </div>
                    <div className="two-columns">
                        <div className="two-columns__main card">
                            <dl className="details-list">
                                <div className="details-list__item">
                                    <dt className="details-list__label">תאריכים</dt>
                                    <dd className="details-list__value">
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
                                    </dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">הדירה שלי</dt>
                                    <dd className="details-list__value">{myApartment?.title}</dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">הדירה של הצד השני</dt>
                                    <dd className="details-list__value">{otherApartment?.title}, {otherApartment?.neighborhood}</dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">מיטות אצל הצד השני</dt>
                                    <dd className="details-list__value">{otherApartment?.beds}</dd>
                                </div>
                                <div className="details-list__item">
                                    <dt className="details-list__label">נשלחה בתאריך</dt>
                                    <dd className="details-list__value">{formatDate(swap.createdAt)}</dd>
                                </div>
                            </dl>
                            {swap.message &&
                                <p className="text-block">{swap.message}</p>
                            }
                        </div>
                        <div className="two-columns__side">
                            {swap.otherParty &&
                                <div className="contact-box">
                                    <h2 className="contact-box__title">פרטי קשר</h2>
                                    <ul className="contact-box__list">
                                        <li className="contact-box__item">
                                            <span className="contact-box__label">
                                                שם:
                                            </span>
                                            {" "}
                                            {swap.otherParty.fullName}
                                        </li>
                                        {swap.otherParty.phone &&
                                            <li className="contact-box__item">
                                                <span className="contact-box__label">
                                                    טלפון:
                                                </span>
                                                {" "}
                                                <span className="ltr">{swap.otherParty.phone}</span>
                                            </li>
                                        }
                                        <li className="contact-box__item">
                                            <span className="contact-box__label">
                                                מייל:
                                            </span>
                                            {" "}
                                            <a className="ltr" href={`mailto:${swap.otherParty.email}`}>{swap.otherParty.email}</a>
                                        </li>
                                    </ul>
                                </div>
                            }
                        </div>
                    </div>
                </>
            }
        </>
    )
}
export default ExchangeDetailsPage