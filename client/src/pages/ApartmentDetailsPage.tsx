import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApartment } from "../api/apartments";
import AmenityTags from "../components/AmenityTags";

function ApartmentDetailsPage() {
    const { id } = useParams()
    const { data, error, isLoading } = useQuery({
        queryKey: ["apartment", id],
        queryFn: () => getApartment(Number(id))
    })
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
                            {/* לוח  */}
                        </div>
                    </div>
                </>
            }
        </>
    )
}
export default ApartmentDetailsPage