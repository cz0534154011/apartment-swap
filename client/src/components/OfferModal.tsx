import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { createSwap } from "../api/swaps"


export type OfferModalProps = {
    apartmentId: number;
    onClose: () => void;
}
export type OfferFormValues = {
    startDate: string;
    endDate: string;
    message: string
}
function OfferModal({ apartmentId, onClose }: OfferModalProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<OfferFormValues>();
    const { mutate, isPending, error, isSuccess } = useMutation({
        mutationFn: createSwap
    })
    function onSubmit(data: OfferFormValues) {
        mutate({
            receiverApartmentId: apartmentId,
            startDate: data.startDate,
            endDate: data.endDate, message: data.message || undefined
        })
    }

    return (
        <div className="modal-backdrop">
            <div className="modal" role="dialog" aria-modal="true">
                <div className="modal__header">
                    <h2 className="modal__title">שליחת הצעת החלפה</h2>
                    <button className="modal__close" type="button" aria-label="סגירה" onClick={onClose} >x</button>
                </div>
                <form className="modal__form" onSubmit={handleSubmit(onSubmit)} noValidate >
                    <div className="modal__body">
                        <div className="form__row">
                            <div className="field">
                                <label className="field__label" htmlFor="startDate">מתאריך</label>
                                <input className="field__input" id="startDate" type="date" aria-invalid={!!errors.startDate} {...register("startDate", { required: "יש לבחור תאריך התחלה" })}></input>
                                {errors.startDate &&
                                    <p className="field__error">{errors.startDate.message}</p>
                                }
                            </div>
                            <div className="field">
                                <label className="field__label" htmlFor="endDate">עד תאריך</label>
                                <input className="field__input" id="endDate" type="date" aria-invalid={!!errors.endDate} {...register("endDate", { required: "יש לבחור תאריך סיום" })}></input>
                                {errors.endDate &&
                                    <p className="field__error">{errors.endDate.message}</p>
                                }
                            </div>
                        </div>
                        <div className="field">
                            <label className="field__label" htmlFor="message">הודעה</label>
                            <textarea className="field__input" id="message" aria-invalid={!!errors.message} {...register("message", { maxLength: { value: 500, message: "עד 500 תווים" } })}></textarea >
                            {errors.message &&
                                <p className="field__error">{errors.message.message}</p>
                            }
                        </div>
                        {error &&
                            <div className="alert alert--error">
                                <p className="alert__text">{error.message}</p>
                            </div>
                        }
                        {isSuccess &&
                            <div className="alert alert--success" >
                                <p className="alert__text">ההצעה נשלחה</p>
                            </div>
                        }
                    </div>
                    <div className="modal__actions">
                        <button className="btn btn--ghost" type="button" onClick={onClose} >{isSuccess?"סגירה":"ביטול"}</button>
                        <button className="btn btn--primary" type="submit" disabled={isPending || isSuccess} >שליחה</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default OfferModal