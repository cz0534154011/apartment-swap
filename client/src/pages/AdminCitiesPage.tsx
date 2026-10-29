import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllCities, createCity, updateCity, deleteCity, type City } from "../api/cities"
import { useState } from "react"
import FormField from "../components/FormField"

function AdminCitiesPage() {
    const { data: cities, error, isLoading } = useQuery({
        queryKey: ["cities", "all"],
        queryFn: getAllCities
    })
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState("");

    const { mutate: addCity,
        isPending: addPending,
        error: addError
    } = useMutation({
        mutationFn: createCity,
        onSuccess: () => {
            setNewName("");
            queryClient.invalidateQueries({
                queryKey: ["cities"]
            })
        }
    })

    const { mutate: toggleCity,
        error: toggleError
    } = useMutation({
        mutationFn: (city: City) => updateCity(city.id, { isActive: !city.isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["cities"]
            })
        }
    })

    const { mutate: removeCity,
        error: removeError
    } = useMutation({
        mutationFn: deleteCity,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["cities"]
            })
        }
    })
    const actionError = addError || toggleError || removeError

    return (
        <>
            <div className="page-header">
                <div className="page-header__text">
                    <h1 className="page-header__title">ניהול ערים</h1>
                </div>
            </div>
            <div className="card">
                <h2 className="card__title">הוספת עיר</h2>
                <FormField id="newCity" label="שם העיר">
                    <input className="field__input"
                        id="newCity" maxLength={40} value={newName}
                        onChange={(e) => setNewName(e.target.value)} />
                </FormField>
                <button className="btn btn--primary" type="button" disabled={addPending} onClick={() => addCity(newName)}>הוספה</button>
            </div>
            {isLoading &&
                <div className="loading">
                    <span className="spinner"></span>
                    <p className="loading__text">טוען...</p>
                </div>
            }
            {error &&
                <div className="alert alert--error">
                    <p className="alert__text">{error.message}</p>
                </div>
            }
            {actionError &&
                <div className="alert alert--error">
                    <p className="alert__text">{actionError.message}</p>
                </div>
            }
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>שם</th>
                            <th>סטטוס</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cities?.map((city) => (
                            <tr className={city.isActive ? "" : "table__row--muted"} key={city.id}>
                                <td>{city.name}</td>
                                <td>{city.isActive ? "פעילה" : "מושבתת"}</td>
                                <td>
                                    <div className="table__actions ">
                                        <button className="btn btn--secondary btn--small" type="button" onClick={()=>toggleCity(city)}>{city.isActive?"השבתה":"הפעלה"}</button>
                                        <button className="btn btn--danger btn--small" type="button" onClick={()=>removeCity(city.id)}>מחיקה</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
export default AdminCitiesPage