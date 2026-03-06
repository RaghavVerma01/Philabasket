import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { assets } from '../assets/assets';
import { Link, NavLink } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { 
  Search, User, Heart, ShoppingBag, Menu, X, Package,
  ChevronRight, LogOut, ArrowLeft, Users, Gift, Award
} from 'lucide-react';

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [headerData, setHeaderData] = useState({ marqueeText: "", navMenu: [] });
    
    // Destructure points and currency logic from context
    const { 
        setShowSearch, getCartCount, backendUrl,
        navigate, token, wishlist, setToken, setCartItems, 
        fetchUserData, currency, toggleCurrency, userPoints 
    } = useContext(ShopContext);

    const fetchHeader = async () => {
        try {
            const res = await axios.get(backendUrl + '/api/header/get');
            if (res.data.success) setHeaderData(res.data.data);
        } catch (error) { console.error("Header Sync Error:", error); }
    };

    useEffect(() => {
        fetchHeader();
        if (token) fetchUserData(); 
    }, [token]);

    const calculateValue = () => {
        const inrValue = (userPoints || 0) / 10;
        return currency === 'INR' ? inrValue : inrValue / 83;
    };

    const logout = () => {
        navigate('/login');
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
    };

    const MegaMenu = ({ menuData }) => (
        <div className='group relative flex flex-col items-center cursor-pointer'>
            <div className='flex items-center gap-1.5 px-4 py-5 transition-all duration-500'>
                <p className='text-[13px] font-[800] text-black group-hover:text-[#BC002D] transition-colors capitalize font-["Nunito",sans-serif]'>
                    {menuData.title}
                </p>
                <div className='absolute bottom-4 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#BC002D] transition-all duration-300 group-hover:w-1/2 opacity-0 group-hover:opacity-100' />
            </div>
            <div className='absolute top-[85%] left-1/2 -translate-x-1/2 pt-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 delay-100 group-hover:delay-0 z-[110]'>
                <div className='h-4 w-full bg-transparent' />
                <div className='bg-white border-t-2 border-[#BC002D] p-10 flex gap-16 w-max shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-br-[40px]'>
                    {menuData.groups?.map((group, idx) => (
                        <div key={idx} className='flex flex-col min-w-[180px]'>
                            <h3 className='text-[10px] font-[900] text-[#BC002D] mb-6 tracking-[0.25em] border-b border-gray-100 pb-3 capitalize font-["Inter",sans-serif]'>
                                {group.groupName}
                            </h3>
                            <div className='flex flex-col gap-5'>
                                {group.items?.map((item, i) => (
                                    <Link 
                                        key={i} 
                                        to={`/collection?category=${encodeURIComponent(item)}`} 
                                        onClick={() => setVisible(false)}
                                        className='text-[11px] text-gray-500 hover:text-[#BC002D] font-bold tracking-[0.15em] transition-all hover:translate-x-1 font-["Inter",sans-serif]'
                                    >
                                        {item}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className='sticky top-0 z-[100] w-full'>
            
            {/* --- MARQUEE --- */}
            {/* --- DYNAMIC ANNOUNCEMENT MARQUEE --- */}
{/* 1. Ensure the parent is w-full and uses min-h to prevent collapsing */}
<div className='relative w-full bg-[#BC002D] py-2 overflow-hidden border-b border-black/10 flex items-center min-h-[32px]'>
    
    {/* 2. Remove 'w-full' from the moving container to let it span its natural length */}
    {/* Added 'hover:pause' to make it user-friendly at high speeds */}
    <div className='flex whitespace-nowrap animate-[marquee_10s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer'>
        <p className='text-[9px] md:text-[10px] font-black tracking-[0.4em] text-white px-10'>
            {headerData.marqueeText || "• LOADING REGISTRY PROTOCOL •"}
        </p>
        <p className='text-[9px] md:text-[10px] font-black tracking-[0.4em] text-white px-10'>
            {headerData.marqueeText || "• LOADING REGISTRY PROTOCOL •"}
        </p>
        {/* 3. Add a third instance to ensure no gaps at high speeds */}
        <p className='text-[9px] md:text-[10px] font-black tracking-[0.4em] text-white px-10'>
            {headerData.marqueeText || "• LOADING REGISTRY PROTOCOL •"}
        </p>
    </div>

    {/* FIXED UTILITIES */}
    <div className='hidden lg:flex absolute right-0 lg:right-4 h-full flex items-center pl-10 bg-gradient-to-l from-[#BC002D] via-[#BC002D]/90 to-transparent z-10'>
        <div className='flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mr-4'>
            {/* POINTS SECTION */}
            <div 
                className='flex items-center gap-2 border-r border-white/20 pr-3 cursor-pointer hover:opacity-80 transition-opacity' 
                onClick={() => navigate('/rewards')}
            >
                <Gift size={12} className='text-white' />
                <p className='text-[9px] font-black text-white uppercase tracking-tighter'>
                    {userPoints || 0} <span className='opacity-60'>PTS</span>
                </p>
            </div>

            {/* CURRENCY TOGGLE */}
            <div className='flex items-center gap-1'>
                {['INR', 'USD'].map((curr) => (
                    <button 
                        key={curr} 
                        onClick={() => toggleCurrency(curr)} 
                        className={`text-[8px] font-black px-2 py-0.5 rounded-full transition-all ${currency === curr ? 'bg-white text-[#BC002D]' : 'text-white/50 hover:text-white'}`}
                    >
                        {curr}
                    </button>
                ))}
            </div>
        </div>
    </div>
</div>

            {/* --- MAIN NAVIGATION --- */}
            <div className='flex items-center justify-between py-4 px-[6%] bg-white border-b border-black/[0.03] lg:p-[14px] w-full shadow-sm'>
                
                <Link to='/' className='flex-shrink-0 group'>
                    <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className='flex items-center gap-2 md:gap-3 mr-7 group cursor-pointer'>
                        <img src={assets.logo} className='w-8 md:w-10 lg:w-12 group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out' alt="" />
                        <img src={assets.logo5} className='w-24 md:w-28 lg:w-32 h-auto object-contain' alt="" />
                    </div>
                </Link>

                <nav className='hidden xl:flex items-center gap-10 mr-5'>
                    {headerData.navMenu.map((tab, index) => (
                        <MegaMenu key={index} menuData={tab} />
                    ))}
                    <NavLink to='/updates' className='group'><p className='text-[13px] font-[800] text-black group-hover:text-[#BC002D] font-["Nunito",sans-serif]'>Updates</p></NavLink>
                </nav>

                {/* UTILITIES (Desktop) */}
                <div className='flex items-center gap-4 lg:gap-6'>

    {/* SEARCH ICON (Already working) */}
    <div className='group relative flex flex-col items-center'>
        <Search onClick={() => { setShowSearch(true); navigate('/collection') ; window.scroll(0,0) }} size={18} className='cursor-pointer text-gray-400 hover:text-[#BC002D]' />
        <div className='absolute top-8 scale-0 transition-all rounded bg-black px-2 py-1 text-[7px] font-black text-white group-hover:scale-100 uppercase tracking-widest z-[100]'>Search</div>
    </div>
    
    {/* WISHLIST ICON - Tooltip added */}
    <Link to='/wishlist' onClick={()=>{window.scroll(0,0)}} className='relative hidden md:block group flex flex-col items-center'>
        <Heart size={18} className={wishlist.length > 0 ? 'fill-[#BC002D] text-[#BC002D]' : 'text-gray-400 hover:text-[#BC002D]'} />
        {wishlist.length > 0 && <span className='absolute -top-2 -right-2 bg-black text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-black'>{wishlist.length}</span>}
        <div className='absolute top-8 scale-0 transition-all rounded bg-black px-2 py-1 text-[7px] font-black text-white group-hover:scale-100 uppercase tracking-widest z-[100]'>Wishlist</div>
    </Link>

    {/* USER ICON - Added group and tooltip for Login case */}
    <div className='group relative hidden md:block flex flex-col items-center'>
        <User onClick={() => token ? null : navigate('/login')} size={18} className='cursor-pointer text-gray-400 hover:text-black' />
        {!token && (
            <div className='absolute top-8 scale-0 transition-all rounded bg-black px-2 py-1 text-[7px] font-black text-white group-hover:scale-100 uppercase tracking-widest z-[100]'>Login</div>
        )}
        {token && (
            <div className='group-hover:block hidden absolute right-0 pt-5 w-48 z-[110]'>
                <div className='bg-white border-t-2 border-[#BC002D] p-5 shadow-2xl rounded-br-[30px]'>
                    <p onClick={() => navigate('/profile')} className='text-[9px] font-black text-gray-400 cursor-pointer hover:text-[#BC002D] mb-4 uppercase flex items-center gap-2'><User size={12} /> Account</p>
                    <p onClick={() => navigate('/orders')} className='text-[9px] font-black text-gray-400 cursor-pointer hover:text-[#BC002D] mb-4 uppercase flex items-center gap-2'><Package size={12} /> My Orders</p>
                    <p onClick={logout} className='text-[9px] text-[#BC002D] cursor-pointer font-black uppercase flex items-center gap-2'><LogOut size={12} /> Sign Out</p>
                </div>
            </div>
        )}
    </div>

    {/* CART ICON - Updated to use setShowSideCart(true) and tooltip added */}
    <div 
        onClick={() => {navigate('/cart')
            window.scroll(0,0)
        }} 
        className='relative group flex flex-col items-center cursor-pointer'
    >
        <div className='bg-black p-2 rounded-sm hover:bg-[#BC002D] transition-all'>
            <ShoppingBag size={16} className='text-white' />
        </div>
        <p className='absolute -right-1.5 -top-1.5 w-4 h-4 text-[8px] flex items-center justify-center bg-[#BC002D] text-white rounded-full font-black'>{getCartCount()}</p>
        <div className='absolute top-10 scale-0 transition-all rounded bg-black px-2 py-1 text-[7px] font-black text-white group-hover:scale-100 uppercase tracking-widest z-[100]'>Cart</div>
    </div>

    <Menu onClick={() => setVisible(true)} size={22} className='cursor-pointer xl:hidden text-gray-900' /> 
</div>
            </div>

            {/* --- MOBILE DRAWER --- */}
            <div className={`fixed inset-0 z-[5000] transition-all duration-500 ${visible ? 'visible' : 'invisible'}`}>
                <div onClick={() => setVisible(false)} className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-0 right-0 h-full w-[85%] bg-white transition-transform duration-500 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className='flex flex-col h-full'>
                        
                        {/* Mobile Header (Points Integration) */}
                        <div className='p-6 bg-gray-50 border-b border-black/5'>
                            <div className='flex items-center justify-between mb-8'>
                                <button onClick={() => setVisible(false)} className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400'><ArrowLeft size={14} /> Back</button>
                                <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-black/5'>
                                    <Gift size={12} className='text-[#BC002D]' />
                                    <span className='text-[10px] text-black font-semibold'>{userPoints || 0} PTS</span>
                                </div>
                            </div>
                            
                            <div className='grid grid-cols-4 bg-white p-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03] divide-x divide-black/[0.05]'>
    
    {/* CURRENCY TOGGLE - Now an integrated icon */}
    <div 
    onClick={() => toggleCurrency(currency === 'INR' ? 'USD' : 'INR')} 
    className='flex flex-col items-center justify-between h-[38px] cursor-pointer group active:scale-95 transition-all'
>
    {/* Icon Container: Fixed size to match Lucide-react icons (usually 18-20px) */}
    <div className='flex items-center justify-center h-[20px]'>
        <span className={`
            text-[11px] font-black leading-none rounded-full flex items-center justify-center
            ${currency === 'INR' ? 'text-[#BC002D] bg-[#BC002D]/5 border border-[#BC002D]/10 w-5 h-5' : 'text-gray-400 border border-gray-200 w-5 h-5'}
        `}>
            {currency === 'INR' ? '$' : '₹'}
        </span>
    </div>
    
    {/* Label: Forced to the bottom for horizontal alignment with neighbors */}
    <span className='text-[8px] font-black uppercase text-gray-500 tracking-tighter mt-auto'>
        {currency === 'INR' ? 'Currency USD' : 'Currency INR'}
    </span>
</div>

    {/* WISHLIST */}
    <div 
        onClick={() => {navigate('/wishlist'); setVisible(false)}} 
        className='flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-all'
    >
        <Heart 
            size={18} 
            className={`${wishlist.length > 0 ? 'fill-[#BC002D] text-[#BC002D]' : 'text-gray-400'}`} 
        />
        <span className='text-[8px] font-black uppercase text-gray-400 tracking-tighter'>Wishlist</span>
    </div>

    {/* REWARDS */}
    <div 
        onClick={() => {navigate('/rewards'); setVisible(false)}} 
        className='flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-all'
    >
        <Award size={18} className='text-amber-500' />
        <span className='text-[8px] font-black uppercase text-gray-400 tracking-tighter'>Rewards</span>
    </div>

    {/* ACCOUNT */}
    <div 
        onClick={() => {if (token) navigate('/profile'); else navigate('/login'); setVisible(false);}} 
        className='flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-all'
    >
        <User size={18} className='text-gray-400 group-hover:text-black' />
        <span className='text-[8px] font-black uppercase text-gray-400 tracking-tighter'>
            {token ? 'Profile' : 'Account'}
        </span>
    </div>
</div>
                        </div>

                        {/* Mobile Content */}
                        <div className='flex-1 overflow-y-auto p-8 space-y-8'>
                            {/* Referral UI */}
                            <div onClick={() => { navigate('/referral');
                                window.scroll(0,0); setVisible(false); }} className='bg-black p-5 rounded-2xl flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className='bg-white/10 p-2 rounded-lg'><Users size={18} className='text-white' /></div>
                                    <div>
                                        <p className='text-[10px] font-black text-white uppercase tracking-widest'>Invite Collector</p>
                                        <p className='text-[8px] text-white/50 font-bold uppercase'>+50 Points</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className='text-white/30' />
                            </div>

                            {/* Dynamic Categories */}
                            <div className='space-y-4'>
    <p className='text-[8px] font-black text-[#BC002D] uppercase tracking-[0.6em] mb-4'>Categories</p>

    {/* --- NEW: TOP-LEVEL UPDATES LINK --- */}
    

    {/* --- EXISTING DYNAMIC CATEGORIES --- */}
    {headerData.navMenu.map((menu, idx) => (
        <div key={idx} className='border-b border-gray-100 pb-2'>
            <div onClick={() => setExpandedMenu(expandedMenu === idx ? null : idx)} className='flex items-center justify-between py-2 cursor-pointer'>
                <p className='text-xl font-bold tracking-tighter text-gray-900 capitalize'>{menu.title}</p>
                <ChevronRight size={18} className={`transition-transform duration-300 ${expandedMenu === idx ? 'rotate-90 text-[#BC002D]' : 'text-[#BC002D]'}`} />
            </div>
            
            {expandedMenu === idx && (
                <div className='mt-4 space-y-4 pl-2 animate-in fade-in slide-in-from-top-2 duration-300'>
                    {menu.groups.map((group, gIdx) => (
                        <div key={gIdx}>
                            {group.groupName && <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2'>{group.groupName}</p>}
                            <div className='flex flex-col gap-3'>
                                {group.items.map((item, iIdx) => (
                                    <Link key={iIdx} to={`/collection?category=${encodeURIComponent(item)}`} onClick={() => setVisible(false)} className='text-[13px] font-bold text-gray-600 hover:text-[#BC002D] transition-colors'>{item}</Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    ))}
    <div className='border-b border-gray-100 pb-2'>
        <div 
            onClick={() => {
                navigate('/updates');
                setVisible(false);
            }} 
            className='flex items-center justify-between py-2 cursor-pointer group'
        >
            <p className='text-xl font-bold tracking-tighter text-gray-900 capitalize group-hover:text-[#BC002D] transition-colors'>
                Updates
            </p>
            <div className="flex items-center gap-2">
                <span className="flex h-2 w-2">
                    {/* <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#BC002D] opacity-75"></span> */}
                    {/* <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BC002D]"></span> */}
                </span>
                <ChevronRight size={18} className="text-[#BC002D]" />
            </div>
        </div>
    </div>
</div>
                        </div>

                        <div className='p-8'>
                            <button onClick={() => {toggleCurrency(currency === 'INR' ? 'USD' : 'INR')}} className='w-full mb-3 py-3 border border-gray-200 rounded-xl text-[9px] text-black uppercase tracking-widest'>Switch to {currency === 'INR' ? 'USD' : 'INR'}</button>
                            {token ? (
                                <button onClick={() => {logout(); setVisible(false)}} className='w-full py-5 bg-gray-900 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl flex items-center justify-center gap-2'><LogOut size={14}/> Logout</button>
                            ) : (
                                <button onClick={() => {navigate('/login'); setVisible(false)}} className='w-full py-5 bg-[#BC002D] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl'>Login</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;