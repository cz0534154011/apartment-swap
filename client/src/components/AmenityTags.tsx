import { type Apartment } from "../api/apartments";
import { AMENITIES } from "../utils/amenities";

export type AmenityTagsProps = {
    apartment: Apartment
}
function AmenityTags({apartment}:AmenityTagsProps)  {
    return (
        <ul className="tag-list">
                {AMENITIES.map(
                    (amenity) => (apartment[amenity.key] &&
                        <li className="amenity-tag" key={amenity.key}>
                            {amenity.label}
                        </li>)
                )}
            </ul>
            
    )
}
export default AmenityTags