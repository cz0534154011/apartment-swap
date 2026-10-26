import { Link, NavLink, Outlet } from "react-router-dom"

function Layout(){
    return(
        <div className="site">
            <header className="site-header">
                <div className="site-header__inner">
                    <Link className="site-header__brand site-header__brand--with-tagline" to={'/'}>
                    <span className="site-header__name">דירה לדירה</span>
                    <span className="site-header__tagline">החלפת דירות לשבתות וחופשות</span>
                    </Link>
                    <nav className="site-nav">{/*צריך להוסיף בדיקת המשתמש הנוכחי*/}
                        <ul className="site-nav__list">
                            <li>
                                <NavLink className='site-nav__link' to={'/'} end>חיפוש דירות</NavLink>
                            </li>
                            <li>
                                <NavLink className='site-nav__link' to={'/my-apartment'}>הדירה שלי</NavLink>
                            </li>
                            <li>
                                <NavLink className='site-nav__link' to={'/my-availability'}>לוח התפוסה שלי</NavLink>
                            </li>
                            <li>
                                <NavLink className='site-nav__link' to={'/my-exchanges'}>ההחלפות שלי</NavLink>
                            </li>
                            <li>
                                <NavLink className='site-nav__link' to={'/my-profile'}>פרופיל</NavLink>
                            </li>
                            <li>
                                <NavLink className='site-nav__link' to={'/login'}>התחברות</NavLink>
                            </li>
                            <li>
                                <NavLink className='site-nav__link' to={'/register'}>הרשמה</NavLink>
                               
                            </li>

                        </ul>
                    </nav>
                    <div className="site-header__user">
                        {/*תלוי במשתמש*/} 
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