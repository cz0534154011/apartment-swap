import { type OtherParty } from "../api/swaps";

export type ContactBoxProps = {
    otherParty: OtherParty;
}

function ContactBox({ otherParty }: ContactBoxProps) {
    return (
        <div className="contact-box">
            <h2 className="contact-box__title">פרטי קשר</h2>
            <ul className="contact-box__list">
                <li className="contact-box__item">
                    <span className="contact-box__label">
                        שם:
                    </span>
                    {" "}
                    {otherParty.fullName}
                </li>
                {otherParty.phone &&
                    <li className="contact-box__item">
                        <span className="contact-box__label">
                            טלפון:
                        </span>
                        {" "}
                        <span className="ltr">{otherParty.phone}</span>
                    </li>
                }
                <li className="contact-box__item">
                    <span className="contact-box__label">
                        מייל:
                    </span>
                    {" "}
                    <a className="ltr" href={`mailto:${otherParty.email}`}>{otherParty.email}</a>
                </li>
            </ul>
        </div>
    )
}
export default ContactBox