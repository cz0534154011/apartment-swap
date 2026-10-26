import { Link } from "react-router-dom"

function NotFoundPage() {
    return (

        <div className="not-found">
            <p className="not-found__code">404</p>
            <h1 className="not-found__title">העמוד לא נמצא</h1>
            <p className="not-found__text" >ייתכן שהקישור שגוי או שהעמוד הוסר</p>
            <Link className="btn btn--primary" to={'/'}>חזרה לדף הבית</Link>
        </div>

    )
}
export default NotFoundPage
