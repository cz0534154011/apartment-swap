import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getSiteInfo } from "../api/site";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type RegisterData } from "../api/auth";
import { useState } from "react";

function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterData>()
    const { mutate, isPending, error } = useMutation({
        mutationFn: registerUser,
        onSuccess: () => navigate("/my-apartment")
    })
    const { data: siteInfo } = useQuery({
        queryKey: ["siteInfo"],
        queryFn: getSiteInfo
    })
    function onSubmit(data: RegisterData) {
        mutate(data);
    }

    return (
        <div className="container container--narrow">
            <div className="page-header">
                <h1 className="page-header__title">הרשמה</h1>
            </div>
            <div className="card">
                <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="field">
                        <label className="field__label" htmlFor="fullName">שם מלא</label>
                        <input className="field__input" id="fullName" type="text" aria-invalid={!!errors.fullName} {...register("fullName", { required: "יש למלא שם מלא", minLength: { value: 2, message: "שם מלא חייב לכלול לפחות 2 תווים" } })}></input>
                        {errors.fullName && <p className="field__error">{errors.fullName.message}</p>}
                    </div>
                    <div className="field">
                        <label className="field__label" htmlFor="email">מייל</label>
                        <input className="field__input" id="email" type="email" aria-invalid={!!errors.email} {...register("email", { required: "יש למלא מייל", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "כתובת מייל לא תקינה" } })}></input>
                        {errors.email && <p className="field__error">{errors.email.message}</p>}
                    </div>
                    <div className="field">
                        <label className="field__label" htmlFor="password">סיסמה</label>
                        <div className="password-field">
                            <input className="field__input" id="password" type={showPassword?"text":"password"} aria-invalid={!!errors.password} {...register("password", { required: "יש למלא סיסמה", minLength: { value: 8, message: "הסיסמה חייבת לכלול לפחות 8 תווים" }, pattern: { value: /^(?=.*[A-Za-z\u0590-\u05FF])(?=.*\d).+$/, message: "הסיסמה חייבת לכלול אות אחת וספרה אחת" } })}></input>
                            <button className="password-field__toggle" type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="הצגת הסיסמה">{showPassword?"הסתרה":"הצגה"}</button>
                        </div>
                        <p className="field__hint">לפחות 8 תווים, אות אחת וספרה אחת</p>
                        {errors.password && <p className="field__error">{errors.password.message}</p>}
                    </div>
                    <div className="field">
                        <label className="field__label" htmlFor="phone">טלפון (לא חובה)</label>
                        <input className="field__input" id="phone" type="tel" aria-invalid={!!errors.phone} {...register("phone", { pattern: { value: /^\+?[\d\s\-()]{9,20}$/, message: "מספר טלפון לא תקין" } })}></input>
                        {errors.phone && <p className="field__error">{errors.phone.message}</p>}
                    </div>
                    <details className="terms-box">
                        <summary className="terms-box__summary">הצגת התקנון</summary>
                        <p className="terms-box__text">{siteInfo?.termsText}</p>
                    </details>
                    <div className="field">
                        <label className="checkbox">
                            <input type="checkbox" {...register("acceptTerms", { required: "יש לאשר את התקנון" })}></input>
                            קראתי ואני מסכים לתקנון האתר
                        </label>
                        {errors.acceptTerms && <p className="field__error">{errors.acceptTerms.message}</p>}
                    </div>

                    {error && <div className="alert alert--error">
                        <p className="alert__text">{error.message}</p>
                    </div>}
                    <div className="form__actions">
                        <button className="btn btn--primary btn--block" type="submit" disabled={isPending}>{isPending ? "נרשם..." : "הרשמה"}</button>
                    </div>
                </form>
            </div>
            <p className="text-center mt-md">כבר רשום? {"  "}
                <Link to={"/login"}>להתחברות</Link></p>
        </div>
    )
}
export default RegisterPage