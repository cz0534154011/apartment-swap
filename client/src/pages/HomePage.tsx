import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { searchApartments } from "../api/apartments";

function HomePage() {
   const { data, error, isLoading } = useQuery({
      queryKey: ["apartments"],
      queryFn: () => searchApartments({})
   })
   return (
      <>
         <div className="page-header">
            <div className="page-header__text">
               <h1 className="page-header__title">חיפוש דירות</h1>
               <p className="page-header__subtitle">מצאו דירה להחלפה לשבת או לחופשה</p>
            </div>
         </div>
         {isLoading &&
            <div className="loading">
               <span className="spinner"></span>
               <p className="loading__text">טוען דירות...</p>
            </div>
         }
         {error &&
            <div className="alert alert--error">
               <p className="alert__text">{error.message}</p>
            </div>
         }
         {data?.items.length === 0 &&
            <div className="empty-state">
               <h2 className="empty-state__title">לא נמצאו דירות</h2>
               <p className="empty-state__text">נסו לשנות את הסינון</p>
            </div>
         }
         {data && data.items.length > 0 &&
            <ul className="card-grid">{data.items.map((apartment) => (
               <li key={apartment.id}>
                  <article className="apartment-card">
                     <h2 className="apartment-card__title">{apartment.title}</h2>
                     <p className="apartment-card__location">{apartment.city.name}, {apartment.neighborhood}</p>
                     <ul className="apartment-card__meta">
                        <li>{apartment.rooms} חדרים</li>
                        <li>{apartment.beds} מיטות</li>
                     </ul>
                     <ul className="tag-list">
                        {apartment.hasElevator &&
                           <li className="amenity-tag">מעלית</li>
                        }
                        {apartment.hasEruv &&
                           <li className="amenity-tag">עירוב</li>
                        }
                        {apartment.hasGenerator &&
                           <li className="amenity-tag">גנרטור</li>
                        }
                        {apartment.hasPlata &&
                           <li className="amenity-tag">פלטה</li>
                        }
                        {apartment.hasShabbatClock &&
                           <li className="amenity-tag">שעון שבת</li>
                        }
                        {apartment.hasUrn &&
                           <li className="amenity-tag">מיחם</li>
                        }
                     </ul>
                     <div className="apartment-card__footer">
                        <Link className="btn btn--secondary btn--small" to={"/apartments/" + apartment.id}>לפרטים</Link>
                     </div>
                  </article>
               </li>
            ))}</ul>
         }
      </>
   )
}
export default HomePage