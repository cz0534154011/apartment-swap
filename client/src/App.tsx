// import { useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
import Layout from "./components/Layout";
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminApartmentsPage from './pages/AdminApartmentsPage'
import AdminCitiesPage from './pages/AdminCitiesPage'
import AdminExchangesPage from './pages/AdminExchangesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import ApartmentDetailsPage from './pages/ApartmentDetailsPage'
import TermsPage from './pages/TermsPage'
import ExchangeDetailsPage from './pages/ExchangeDetailsPage'
import LoginPage from './pages/LoginPage'
import MyApartmentPage from './pages/MyApartmentPage'
import MyAvailabilityPage from './pages/MyAvailabilityPage'
import MyExchangesPage from './pages/MyExchangesPage'
import MyProfilePage from './pages/MyProfilePage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'


function App() {


  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<HomePage />}></Route>
          <Route path='/admin/apartments' element={<AdminApartmentsPage />}></Route>
          <Route path='/admin/cities' element={<AdminCitiesPage />}></Route>
          <Route path='/admin/exchanges' element={<AdminExchangesPage />}></Route>
          <Route path='/admin/users' element={<AdminUsersPage />}></Route>
          <Route path='/apartments/:id' element={<ApartmentDetailsPage />}></Route>
          <Route path='/terms' element={<TermsPage />}></Route>
          <Route path='/exchanges/:id' element={<ExchangeDetailsPage />}></Route>
          <Route path='/login' element={<LoginPage />}></Route>
          <Route path='/my-apartment' element={<MyApartmentPage />}></Route>
          <Route path='/my-availability' element={<MyAvailabilityPage />}></Route>
          <Route path='/my-exchanges' element={<MyExchangesPage />}></Route>
          <Route path='/my-profile' element={<MyProfilePage />}></Route>
          <Route path='/register' element={<RegisterPage />}></Route>
          <Route path='*' element={<NotFoundPage />}></Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
