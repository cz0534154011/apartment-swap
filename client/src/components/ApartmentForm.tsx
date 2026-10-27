import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCities } from "../api/cities";
import { AMENITIES } from "../utils/amenities";
import { type ApartmentInput, type MyApartment, createMyApartment, updateMyApartment } from "../api/myApartment";
import { useAuth } from "../context/AuthContext";

export type ApartmentFormValues = Omit<ApartmentInput, "cityId" | "rooms" | "beds" | "floor"> & {
    cityId: string;
    rooms: string;
    beds: string;
    floor: string;
}
export type ApartmentFormProps = {
    apartment?: MyApartment;
}
function ApartmentForm({ apartment }: ApartmentFormProps) {
    const { data: cities } = useQuery({
        queryKey: ["cities"],
        queryFn: getCities
    })
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ApartmentFormValues>(
        {
            defaultValues: apartment ?
                {
                    ...apartment,
                    cityId: String(apartment.city.id),
                    rooms: String(apartment.rooms),
                    beds: String(apartment.beds),
                    floor: String(apartment.floor)
                }
                : undefined
        })
    const queryClient = useQueryClient();
    const { refreshMe } = useAuth();
    const { mutate, isPending, error, isSuccess } = useMutation({
        mutationFn: apartment ? updateMyApartment : createMyApartment,
        onSuccess: () => {
            refreshMe();
            queryClient.invalidateQueries({ queryKey: ["myApartment"] });
        }
    })
    function onSubmit(data: ApartmentFormValues) {
        const body: ApartmentInput = {
            ...data,
            cityId: Number(data.cityId),
            rooms: Number(data.rooms),
            beds: Number(data.beds),
            floor: Number(data.floor),
        }
        mutate(body)
    }
    if (!cities) {
        return <div className="loading">
            <span className="spinner"></span>
            <p className="loading__text">טוען...</p>
        </div>

    }
    return (
        <>
            <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="field">
                    <label className="field__label" htmlFor="title">כותרת</label>
                    <input className="field__input" id="title" type="text" aria-invalid={!!errors.title}
                        {...register("title", {
                            required: "יש למלא כותרת",
                            minLength: { value: 5, message: "כותרת חייבת לכלול לפחות 5 תווים" },
                            maxLength: { value: 100, message: "כותרת יכולה לכלול עד 100 תווים" }
                        })} />
                    {errors.title &&
                        <p className="field__error">{errors.title.message}</p>
                    }
                </div>
                <div className="form__row">
                    <div className="field">
                        <label className="field__label" htmlFor="cityId">עיר</label>
                        <select className="field__input" id="cityId" aria-invalid={!!errors.cityId} {...register("cityId", { required: "יש לבחור עיר" })}>
                            <option value="">בחירת עיר</option>
                            {cities?.map((city) => (<option key={city.id} value={city.id}>{city.name}</option>))}
                        </select>
                        {errors.cityId &&
                            <p className="field__error">{errors.cityId.message}</p>
                        }
                    </div>
                    <div className="field">
                        <label className="field__label" htmlFor="neighborhood">שכונה</label>
                        <input className="field__input" id="neighborhood" type="text" aria-invalid={!!errors.neighborhood}
                            {...register("neighborhood", {
                                required: "יש למלא שכונה",
                                minLength: { value: 2, message: "שכונה חייבת לכלול לפחות 2 תווים" },
                                maxLength: { value: 60, message: "שכונה יכולה לכלול עד 60 תווים" }
                            })} />
                        {errors.neighborhood &&
                            <p className="field__error">{errors.neighborhood.message}</p>
                        }
                    </div>
                </div>
                <div className="form__row">
                    <div className="field">
                        <label className="field__label" htmlFor="rooms">חדרים</label>
                        <input className="field__input" id="rooms" type="number" step={0.5} aria-invalid={!!errors.rooms}
                            {...register("rooms", {
                                required: "יש למלא מספר חדרים",
                                min: { value: 1, message: "לפחות חדר אחד" },
                                max: { value: 20, message: "עד 20 חדרים" }
                            })} />
                        {errors.rooms &&
                            <p className="field__error">{errors.rooms.message}</p>
                        }
                    </div>
                    <div className="field">
                        <label className="field__label" htmlFor="beds">מיטות</label>
                        <input className="field__input" id="beds" type="number" aria-invalid={!!errors.beds}
                            {...register("beds", {
                                required: "יש למלא מספר מיטות",
                                min: { value: 1, message: "לפחות מיטה אחת" },
                                max: { value: 30, message: "עד 30 מיטות" }
                            })} />
                        {errors.beds &&
                            <p className="field__error">{errors.beds.message}</p>
                        }
                    </div>
                </div>
                <div className="field">
                    <label className="field__label" htmlFor="floor">קומה</label>
                    <input className="field__input" id="floor" type="number" aria-invalid={!!errors.floor}
                        {...register("floor", {
                            required: "יש למלא קומה",
                            min: { value: -3, message: "קומה מינימלית 3-" },
                            max: { value: 60, message: "קומה מקסימלית 60" }
                        })} />
                    {errors.floor &&
                        <p className="field__error">{errors.floor.message}</p>
                    }
                </div>
                <fieldset className="fieldset">
                    <legend className="fieldset__legend">אביזרי שבת</legend>
                    <div className="checkbox-group">
                        {AMENITIES.map((amenity) => (<label className="checkbox" key={amenity.key}><input type="checkbox" {...register(amenity.key)} /> {amenity.label}</label>))}
                    </div>
                </fieldset>
                <div className="field">
                    <label className="field__label" htmlFor="description">תיאור</label>
                    <textarea className="field__input" id="description" rows={6} aria-invalid={!!errors.description}
                        {...register("description", {
                            required: "יש למלא תיאור",
                            minLength: { value: 10, message: "תיאור חייב לכלול לפחות 10 תווים" },
                            maxLength: { value: 2000, message: "תיאור יכול לכלול עד 2000 תווים" }
                        })} />
                    {errors.description &&
                        <p className="field__error">{errors.description.message}</p>
                    }
                </div>
                <p className="form__warning">פרטים לא נכונים עלולים להוביל לחסימת הדירה</p>
                {error &&
                    <div className="alert alert--error">
                        <p className="alert__text">{error.message}</p>
                    </div>
                }
                {isSuccess &&
                    <div className="alert alert--success">
                        <p className="alert__text">הדירה נשמרה בהצלחה</p>
                    </div>
                }
                <div className="form__actions">
                    <button className="btn btn--primary" type="submit" disabled={isPending}>
                        {isPending?"שומר...":apartment ? "שמירת שינויים" : "פרסום הדירה"}
                    </button>
                </div>
            </form>
        </>
    )
}
export default ApartmentForm