import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// --- STATIC IMPORTS (Load Instantly) ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';
import Home from './pages/Home'; // Home should never be lazy
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UtilityBar from './components/UtilityBar';
import ChatBot from './components/ChatBot';
import Updates from './pages/Update';
import RewardHistory from './pages/RewardHistory';
// import PrivacyPolicy from './pages/Legal';
import Legal from './pages/Legal';
import FaceValueSubscription from './pages/FaceValusSubscription';
import SideCart from './components/SideCart';
import Gifting from './pages/Gifting';
// import Rewards from './pages/Rewards';
const Rewards=lazy(()=>import('./pages/Rewards'))

// --- LAZY IMPORTS (Load on Demand) ---
const Collection = lazy(() => import('./pages/Collection'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Product = lazy(() => import('./pages/Product'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'));
const Orders = lazy(() => import('./pages/Orders'));
const Referral = lazy(() => import('./pages/Referral'));
const Verify = lazy(() => import('./pages/Verify'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ArchiveBlogs = lazy(() => import('./pages/ArchieveBlogs'));
const BlogContent = lazy(() => import('./pages/BlogContent'));
const Terms=lazy(()=>import('./pages/Terms'))
const FAQ=lazy(()=>import('./pages/FAQs'))
const Shipping=lazy(()=>import('./pages/Shipping'))

const App = () => {
  return (
    <div className='px-2 sm:px-[1vw] md:px-[2vw] lg:px-[0vw] bg-[#0a0a0a] min-h-screen'>
      <ToastContainer theme="dark" />
      
      {/* Navbar and SearchBar are now part of the main bundle for instant interaction */}
      <Navbar />
      <SearchBar />
      <SideCart/>


      <Suspense fallback={
        <div className='h-[60vh] flex flex-col items-center justify-center bg-[#0a0a0a] text-[#BC002D]'>
          <div className='w-8 h-8 border-2 border-[#BC002D] border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-[10px] font-black uppercase tracking-[0.4em]'>Accessing Archive...</p>
        </div>
      }>
        <Routes>
          {/* Home is loaded instantly */}
          <Route path='/' element={<Home />} />
          
          {/* All other routes are chunked */}
          <Route path='/collection' element={<Collection />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          {/* <Route path='/product/:productId' element={<Product />} /> */}
          <Route path='/product/:productId/:slug' element={<Product />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/referral' element={<Referral />} />
          <Route path='/login' element={<Login />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/wishlist' element={<Wishlist />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/orders' element={<Orders />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/reset-password/:token' element={<ResetPassword/>} />
          <Route path='/blogs' element={<ArchiveBlogs />} />
          <Route path='/rewards' element={<Rewards />} />
          <Route path='/terms' element={<Terms/>} />
          <Route path='/faq' element={<FAQ/>} />
          <Route path='/ship' element={<Shipping/>} />
          <Route path='/updates' element={<Updates/>} />
          <Route path='/history' element={<RewardHistory/>}/>
          <Route path='/privacy' element={<Legal />} />
          <Route path='/membership' element={<FaceValueSubscription />} />
          <Route path='/gifting' element={<Gifting />} />







          <Route path='/blog/:blogId' element={<BlogContent />} />
        </Routes>
      </Suspense>
      {/* <UtilityBar/> */}
      <Footer />
      <ChatBot/>
    </div>
  )
}

export default App;