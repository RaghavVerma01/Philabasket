import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/Dashboard'
import AddBlog from './pages/AddBlog'
import ListBlog from './pages/ListBlog'
import EditBlog from './pages/EditBlog'
import CustomerMail from './pages/CustomMail'
import NewsletterDispatch from './pages/NewsletterDispatch'
import MediaLibrary from './pages/MediaLibrary'
import RegistryExportDesk from './pages/RegistryExportDesk'
import CategoryManager from './pages/CategoryManager'
import Feedback from './pages/Feedback'
import AddCoupon from './pages/AddCoupon'
import Users from './pages/Users'
import BannerManager from './pages/BannerManager'
import HeaderManager from './pages/HeaderManager'
import Settings from './pages/Settings'
import OrderDetail from './pages/OrderDetail'
import UserDetail from './components/UserDetails'
export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '$'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');

  useEffect(()=>{
    localStorage.setItem('token',token)
  },[token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === ""
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='flex-1 mx-auto px-8 my-8 text-gray-900 text-base overflow-hidden'>
              <Routes>
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/orders' element={<Orders token={token} />} />
                <Route path='/dashboard' element={<Dashboard token={token} />} />
                <Route path='/blog' element={<AddBlog token={token}/>} />
                <Route path='/list-blog' element={<ListBlog token={token}/>} />
                <Route path='/edit-blog/:id' element={<EditBlog token={token}  />} />
                <Route path='/mail' element={<CustomerMail token={token}  />} />
                <Route path='/news' element={<NewsletterDispatch token={token}  />} />
                <Route path='/media' element={<MediaLibrary token={token}  />} />
                <Route path='/export' element={<RegistryExportDesk token={token}  />} />
                <Route path='/category' element={<CategoryManager token={token}  />} />
                <Route path='/feedback' element={<Feedback token={token}  />} />
                <Route path='/coupon' element={<AddCoupon token={token}  />} />
                <Route path='/users' element={<Users token={token}  />} />
                <Route path='/banner' element={<BannerManager token={token}  />} />
                <Route path='/header' element={<HeaderManager token={token}  />} />
                <Route path='/setting' element={<Settings token={token}  />} />
                <Route path='/orders/:orderId' element={<OrderDetail token={token} />} />
                <Route path='/users/:id' element={<UserDetail token={token} />} />

















              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App