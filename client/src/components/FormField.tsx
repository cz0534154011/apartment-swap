import { type ReactNode } from "react";

export type FormFieldProps  = {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}
function FormField({ id, label, error, children}: FormFieldProps ) {
    return (
        <div className="field">
            <label className="field__label" htmlFor={id}>{label}</label>
            {children}
            {error &&
                <p className="field__error">{error}</p>
            }
        </div>
    )
}
export default FormField