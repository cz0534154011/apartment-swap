import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type LoginData } from "../api/auth";
import { useState } from "react";

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginData>()
    const { mutate, isPending, error } = useMutation({
        mutationFn: login,
        onSuccess: () => navigate("/")
    })
    function onSubmit(data: LoginData) {
        mutate(data);
    }

    return (
        <div className="container container--narrow">
            <div className="page-header">
                <h1 className="page-header__title">התחברות</h1>
            </div>
            <div className="card">
                <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="field">
                        <label className="field__label" htmlFor="email">מייל</label>
                        <input className="field__input" id="email" type="email" aria-invalid={!!errors.email} {...register("email", { required: "יש למלא מייל"})}></input>
                        {errors.email && <p className="field__error">{errors.email.message}</p>}
                    </div>
                    <div className="field">
                        <label className="field__label" htmlFor="password">סיסמה</label>
                        <div className="password-field">
                            <input className="field__input" id="password" type={showPassword?"text":"password"} aria-invalid={!!errors.password} {...register("password", { required: "יש למלא סיסמה"})}></input>
                            <button className="password-field__toggle" type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="הצגת הסיסמה">{showPassword?"הסתרה":"הצגה"}</button>
                        </div>
                        {errors.password && <p className="field__error">{errors.password.message}</p>}
                    </div>
                    {error && <div className="alert alert--error">
                        <p className="alert__text">{error.message}</p>
                    </div>}
                    <div className="form__actions">
                        <button className="btn btn--primary btn--block" type="submit" disabled={isPending}>{isPending ? "מתחבר..." : "התחברות"}</button>
                    </div>
                </form>
            </div>
            <p className="text-center mt-md">עוד לא רשום? {"  "}
                <Link to={"/register"}>להרשמה</Link></p>
        </div>
    )
}



export default LoginPage