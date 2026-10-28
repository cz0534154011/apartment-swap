import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "../context/AuthContext"
import { updateMe } from "../api/auth"
import FormField from "../components/FormField"

export type ProfileFormValues = {
    fullName: string;
    phone: string;
}
function MyProfilePage() {
    const { user, refreshMe } = useAuth()
    const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({ values: user ? { fullName: user.fullName, phone: user.phone ?? "" } : undefined })
    const { mutate, isPending, error, isSuccess } = useMutation({
        mutationFn: updateMe,
        onSuccess: refreshMe
    })
    function onSubmit(data: ProfileFormValues) {
        mutate({ fullName: data.fullName, phone: data.phone || null });
    }
    return (
        <div className="container container--narrow">
            <div className="page-header">
                <h1 className="page-header__title">הפרופיל שלי</h1>
            </div>
            <div className="card">
                <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <p className="text-muted">
                        מייל:
                        {" "}
                        <span className="ltr">{user?.email}</span>
                        {" "}
                        (לא ניתן לשינוי)
                    </p>
                    <FormField id="fullName" label="שם מלא" error={errors.fullName?.message}>
                        <input className="field__input" id="fullName" type="text" aria-invalid={!!errors.fullName} {...register("fullName", { required: "יש למלא שם מלא", minLength: { value: 2, message: "שם מלא חייב לכלול לפחות 2 תווים" }, maxLength: { value: 60, message: "עד 60 תווים" } })}></input>
                    </FormField>
                    <FormField id="phone" label="טלפון (לא חובה)" error={errors.phone?.message}>
                        <input className="field__input" id="phone" type="tel" aria-invalid={!!errors.phone} {...register("phone", { pattern: { value: /^\+?[\d\s\-()]{9,20}$/, message: "מספר טלפון לא תקין" } })}></input>
                    </FormField>
                    {error && <div className="alert alert--error">
                        <p className="alert__text">{error.message}</p>
                    </div>}
                    {isSuccess && <div className="alert alert--success">
                        <p className="alert__text">הפרטים נשמרו</p>
                    </div>}
                     <div className="form__actions">
                        <button className="btn btn--primary btn--block" type="submit" disabled={isPending}>{isPending ? "שומר..." : "שמירה"}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default MyProfilePage