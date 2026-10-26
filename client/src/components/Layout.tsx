import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext";

function Layout() {
    const { user, isLoading, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout()
        navigate("/")
    }
    return (
        <div className="site">
            <header className="site-header">
                <div className="site-header__inner">
                    <Link className="site-header__brand site-header__brand--with-tagline" to={'/'}>
                        <span className="site-header__name">דירה לדירה</span>
                        <span className="site-header__tagline">החלפת דירות לשבתות וחופשות</span>
                    </Link>
                    <nav className="site-nav">
                        <ul className="site-nav__list">
                            <li>
                                <NavLink className="site-nav__link" to={'/'} end>חיפוש דירות</NavLink>
                            </li>
                            {user?.role === "USER" &&
                                <>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/my-apartment'}>הדירה שלי</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/my-availability'}>לוח התפוסה שלי</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/my-exchanges'}>ההחלפות שלי</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/my-profile'}>פרופיל</NavLink>
                                    </li>
                                </>
                            }
                            {user?.role === "ADMIN" &&
                                <>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/admin/apartments'}>ניהול דירות</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/admin/cities'}>ניהול ערים</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/admin/users'}>משתמשים</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/admin/exchanges'}>כל ההחלפות</NavLink>
                                    </li>
                                </>
                            }
                            {!isLoading && !user &&
                                <>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/login'}>התחברות</NavLink>
                                    </li>
                                    <li>
                                        <NavLink className="site-nav__link" to={'/register'}>הרשמה</NavLink>
                                    </li>
                                </>
                            }
                        </ul>
                    </nav>
                    <div className="site-header__user">
                        {user &&
                            <>
                                <span>שלום, {user.fullName}</span>
                                <button className="btn btn--ghost btn--small" type="button" onClick={handleLogout}>יציאה</button>
                            </>
                        }
                    </div>
                </div>
            </header>
            <main className="site-main">
                <Outlet></Outlet>
            </main>
            <footer className="site-footer">
                <div className="site-footer__inner">
                    <ul className="site-footer__links">
                        <li>
                            <Link to={'/terms'}>תקנון וצור קשר</Link>
                        </li>
                    </ul>
                    <span>מנהל האתר: <a className="ltr" href="mailto:cz0534154011@gmail.com">cz0534154011@gmail.com</a></span>
                </div>
            </footer>
        </div>
    )
}
export default Layout