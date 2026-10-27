import { useQuery } from "@tanstack/react-query";
import ApartmentCard from "../components/ApartmentCard";
import { searchApartments, type SearchFilters } from "../api/apartments";
import { useState } from "react";

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
                  {ApartmentCard({ apartment })}
               </li>
            ))}</ul>
         }
      </>
   )
}
export default HomePage