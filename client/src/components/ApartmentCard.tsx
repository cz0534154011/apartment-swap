import { Link } from "react-router-dom";
import { type Apartment } from "../api/apartments";
import { AMENITIES } from "../utils/amenities";

export type ApartmentCardProps = {
    apartment: Apartment;
}
function ApartmentCard({ apartment }: ApartmentCardProps) {
    return (
        <article className="apartment-card">
            <h2 className="apartment-card__title">{apartment.title}</h2>
            <p className="apartment-card__location">{apartment.city.name}, {apartment.neighborhood}</p>
            <ul className="apartment-card__meta">
                <li>{apartment.rooms} חדרים</li>
                <li>{apartment.beds} מיטות</li>
            </ul>
            <ul className="tag-list">
                {AMENITIES.map(
                    (amenity) => (apartment[amenity.key] &&
                        <li className="amenity-tag" key={amenity.key}>
                            {amenity.label}
                        </li>)
                )}
            </ul>
            <div className="apartment-card__footer">
                <Link className="btn btn--secondary btn--small" to={"/apartments/" + apartment.id}>לפרטים</Link>
            </div>
        </article>
    )
}
export default ApartmentCard