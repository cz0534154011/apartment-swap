import { useQuery } from "@tanstack/react-query";
import { getSiteInfo } from "../api/site";

function TermsPage() {

    const { data, error, isPending } = useQuery({
        queryKey: ["siteInfo"],
        queryFn: getSiteInfo
    })
    if (isPending) {
        return <div className="loading">
            <span className="spinner"></span>
            <p className="loading__text">טוען...</p>
        </div>
    }
    if (error) {
       return <div className="alert alert--error">
            <p className="alert__text">{error.message}</p>
        </div>
    }
   
    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">תקנון וצור קשר</h1>
            </div>
            <section className="card">
                <p className="text-block">{data.termsText}</p>
            </section>
              <section className="contact-box mt-lg">
                <h2 className="contact-box__title">צור קשר</h2>
                <p>לשאלות ופניות: <a className="ltr" href={`mailto:${data.adminContactEmail}`}>{data.adminContactEmail}</a></p>
                
            </section>



        </>
    )
}
export default TermsPage