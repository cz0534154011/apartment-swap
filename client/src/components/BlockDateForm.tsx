import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { addBlockedDate, type BlockedDateInput } from "../api/myApartment"
import FormField from "./FormField"

function BlockDateForm() {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<BlockedDateInput>();
    const queryClient = useQueryClient();
    const { mutate, data: result, isPending, error } = useMutation({
        mutationFn: addBlockedDate,
        onSuccess: () => {
            reset();
            queryClient.invalidateQueries({ queryKey: ["blockedDates"] });
            queryClient.invalidateQueries({ queryKey: ["calendar"] });
        }
    })
    function onSubmit(data: BlockedDateInput) {
        mutate({ ...data, note: data.note || undefined })
    }
    return (
        <>
            <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <h2 className="card__title">חסימת תאריכים</h2>
                <div className="form__row">
                    <FormField id="startDate" label="מתאריך" error={errors.startDate?.message}>
                        <input className="field__input" id="startDate" type="date"
                            aria-invalid={!!errors.startDate}
                            {...register("startDate", { required: "יש לבחור תאריך התחלה" })} />
                    </FormField>
                    <FormField id="endDate" label="עד תאריך" error={errors.endDate?.message}>
                        <input className="field__input" id="endDate" type="date"
                            aria-invalid={!!errors.endDate}
                            {...register("endDate", { required: "יש לבחור תאריך סיום" })} />
                    </FormField>
                </div>
                <FormField id="note" label="הערה (לא חובה)" error={errors.note?.message}>
                    <input className="field__input" id="note" type="text"
                        aria-invalid={!!errors.note}
                        {...register("note", { maxLength: { value: 100, message: "עד 100 תווים" } })} />
                </FormField>
                {error &&
                    <div className="alert alert--error">
                        <p className="alert__text">{error.message}</p>
                    </div>
                }
                {result &&
                    <div className="alert alert--success">
                        <p className="alert__text">החסימה נוספה</p>
                        {result.autoRejectedOffers>0 &&
                            <p className="alert__text">{result.autoRejectedOffers} הצעות ממתינות נדחו אוטומטית</p>
                        }
                    </div>
                }
                <div className="form__actions">
                    <button className="btn btn--primary" type="submit" disabled={isPending}>חסימה</button>
                </div>
            </form>
        </>
    )
}
export default BlockDateForm