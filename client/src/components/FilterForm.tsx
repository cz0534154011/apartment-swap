import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { getCities } from "../api/cities";
import { type Amenities, type SearchFilters } from "../api/apartments";
import { AMENITIES } from "../utils/amenities";

export type FilterFormValues = {
    cityId: string;
    minRooms: string;
    minBeds: string;
    from: string;
    to: string;
    q: string;
} & Amenities
export type FilterFormProps = {
    onSearch: (filters: SearchFilters) => void
}

function FilterForm({ onSearch }: FilterFormProps) {
    const { data: cities } = useQuery({
        queryKey: ["cities"],
        queryFn: getCities
    })
    const { register, handleSubmit, reset } = useForm<FilterFormValues>()
    function onSubmit(data: FilterFormValues) {
        onSearch({
            ...data,
            cityId: data.cityId ? Number(data.cityId) : undefined,
            minRooms: data.minRooms ? Number(data.minRooms) : undefined,
            minBeds: data.minBeds ? Number(data.minBeds) : undefined,
            from: data.from || undefined,
            to: data.to || undefined,
            q: data.q || undefined
        })
    }
    function handleClear() {
        reset();
        onSearch({})
    }
    return (
        <details className="filter-panel">
            <summary className="filter-panel__summary">סינון וחיפוש</summary>
            <form className="filter-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="field">
                    <label className="field__label" htmlFor="q">חיפוש חופשי</label>
                    <input className="field__input" id="q" {...register("q")}></input>
                </div>
                <div className="field">
                    <label className="field__label" htmlFor="cityId">עיר</label>
                    <select className="field__input" id="cityId" {...register("cityId")}>
                        <option value="">כל הערים</option>
                        {cities?.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
                    </select>
                </div>
                <div className="field">
                    <label className="field__label" htmlFor="from">מתאריך</label>
                    <input className="field__input" id="from" {...register("from")} type="date" ></input>
                </div>
                <div className="field">
                    <label className="field__label" htmlFor="to">עד תאריך</label>
                    <input className="field__input" id="to" {...register("to")} type="date" ></input>
                </div>
                <div className="field">
                    <label className="field__label" htmlFor="minRooms">מינימום חדרים</label>
                    <input className="field__input" id="minRooms" min={1} {...register("minRooms")} type="number" ></input>
                </div>
                <div className="field">
                    <label className="field__label" htmlFor="minBeds">מינימום מיטות</label>
                    <input className="field__input" id="minBeds" min={1} {...register("minBeds")} type="number" ></input>
                </div>
                <fieldset className="fieldset">
                    <legend className="fieldset__legend">אביזרי שבת</legend>
                    <div className="checkbox-group">
                        {AMENITIES.map((amenity) => (<label className="checkbox" key={amenity.key}><input type="checkbox" {...register(amenity.key)} /> {amenity.label}</label>))}
                    </div>
                </fieldset>
                <div className="filter-form__actions">
                    <button className="btn btn--primary" type="submit">חיפוש</button>
                    <button className="btn btn--ghost" type="button" onClick={handleClear}>ניקוי</button>
                </div>
            </form>
        </details>
    )
}
export default FilterForm
