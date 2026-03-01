import React, { useContext, useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { 
  Search, User, Heart, ShoppingBag, Menu, X, Package,
  ChevronRight, LogOut, Trophy, ArrowLeft, Users, Gift, TrendingUp
} from 'lucide-react';

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const [showRewardsDropdown, setShowRewardsDropdown] = useState(false);
    
    const { 
        currency, setShowSearch, getCartCount, 
        navigate, token, wishlist, setToken, setCartItems, 
        userPoints, fetchUserData 
    } = useContext(ShopContext);

    useEffect(() => {
        if (token) fetchUserData(); 
    }, [token]);

    const logout = () => {
        navigate('/login');
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
    };

    const CATEGORY_GROUPS = {
        philatelic: { title: "MINT VARIETY", items: { "MINT & SHEETS": ["SheetLet", "Miniature Sheets", "Full Sheet","Year Pack","Block of Four","Block of Four with Traffic light","Joint Issue"], "SPECIALS": ["First Day Cover", "My Stamp", "Definitive"] }},
        thematic: { title: "THEMES", items: { "NATURE": ["WildLife", "Bird Stamps", "Yoga"], "CULTURE": ["Cinema", "Gandhi", "Space"] }},
        gifting: { title: "GIFTING", items: { "POSTAL STATIONARY": ["Postcard","Greeting Card","Presentation Pack","BOPP","Ancillaries"] }},
        Foreign_Stamps: { title: "FOREIGN STAMPS", items: { "SPECIAL": ["Foreign Stamps","Joint Issue","Classic Items","Foreign First Day Covers","Foreign Miniature Sheets"] }},
    };

    const MegaMenu = ({ menuData }) => (
        <div className='group relative flex flex-col items-center gap-1 cursor-pointer '>
            <div className='flex items-center gap-1.5 px-2 transition-all duration-500'>
                <p className='text-[10px] font-black tracking-[0.4em] text-black group-hover:text-[#BC002D] transition-colors'>{menuData.title}</p>
            </div>
            <div className='absolute top-full left-1/2 -translate-x-1/2 pt-8 hidden group-hover:block z-[110]'>
                <div className='bg-white border-t-2 border-[#BC002D] p-10 flex gap-16 w-max shadow-2xl rounded-br-[40px]'>
                    {Object.entries(menuData.items).map(([groupName, items], idx) => (
                        <div key={idx} className='flex flex-col min-w-[160px]'>
                            <h3 className='text-[9px] font-black text-[#BC002D] mb-6 tracking-[0.3em] border-b border-gray-100 pb-3'>{groupName}</h3>
                            <div className='flex flex-col gap-4'>
                                {items.map((item, i) => (
                                    <Link key={i} onClick={() => { window.scrollTo(0,0); setVisible(false); }} to={`/collection?category=${encodeURIComponent(item)}`} className='text-[10px] text-gray-400 hover:text-[#BC002D] font-bold uppercase tracking-[0.2em] transition-all hover:translate-x-1'>{item}</Link>
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
            
            {/* --- ANNOUNCEMENT MARQUEE --- */}
            <div className='bg-[#BC002D] py-2 overflow-hidden border-b border-black/10'>
                <div className='flex whitespace-nowrap animate-marquee'>
                    <p className='text-[9px] md:text-[10px] font-black  tracking-[0.4em] text-white px-18 '>
                        •Buy More and Earn More  • Global Shipping Protocol Active • Secure SSL Acquisition Protocol • Collector's Archive Updated Weekly • Free Shipping on Orders Above ₹999 •
                    </p>
                    <p className='text-[9px] md:text-[10px] font-black  tracking-[0.4em] text-white px-18'>
                        • Buy More and Earn More  • Global Shipping Protocol Active • Secure SSL Acquisition Protocol • Collector's Archive Updated Weekly • Free Shipping on Orders Above ₹999 •
                    </p>
                </div>
            </div>

            {/* --- MAIN NAVIGATION --- */}
            <div className='flex items-center justify-between py-5 px-[6%] bg-white border-b border-black/[0.03] lg:p-[34px] w-full shadow-sm'>
                
                {/* LOGO */}
                <Link to='/' className='flex-shrink-0 group'>
                    <div className='flex items-center gap-2 md:gap-3 mr-7 group cursor-pointer'>
                        <img 
                            src={assets.logo} 
                            className='w-8 md:w-10 lg:w-12 group-hover:rotate-[360deg] transition-transform duration-1000 object-contain' 
                            alt="PhilaBasket Logo" 
                        />
                        <img 
                            src={assets.logo5} 
                            className='w-24 md:w-28 lg:w-32 h-auto object-contain' 
                            alt="PhilaBasket Text" 
                        />
                    </div>
                </Link>

                {/* DESKTOP NAVIGATION */}
                <nav className='hidden xl:flex items-center gap-10 mr-5'>
                    {Object.values(CATEGORY_GROUPS).map((group, index) => <MegaMenu key={index} menuData={group} />)}
                    <NavLink to='/updates' className='group flex items-center gap-1.5'>
                        <p className='text-[10px] font-black tracking-[0.4em] text-gray-900 uppercase'>Updates</p>
                    </NavLink>
                </nav>

                {/* UTILITIES */}
                <div className='flex items-center gap-3 lg:gap-2'>
                    <div className='flex items-center gap-4 lg:gap-6'>
                        <Search onClick={() => { setShowSearch(true); navigate('/collection') }} size={18} className='cursor-pointer text-gray-400 hover:text-[#BC002D] transition-colors' />
                        
                        <Link to='/wishlist' className='relative hidden md:block group'>
                            <Heart size={18} className={`transition-colors ${wishlist.length > 0 ? 'fill-[#BC002D] text-[#BC002D]' : 'text-gray-400 group-hover:text-[#BC002D]'}`} />
                            {wishlist.length > 0 && <span className='absolute -top-2 -right-2 bg-black text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-black'>{wishlist.length}</span>}
                        </Link>

                        <div className='group relative hidden md:block'>
                            <User onClick={() => token ? null : navigate('/login')} size={18} className='cursor-pointer text-gray-400 hover:text-black transition-colors' />
                            {token && (
                            <div className='group-hover:block hidden absolute right-0 pt-5 w-48'>
                                <div className='bg-white border-t-2 border-[#BC002D] p-5 shadow-2xl rounded-br-[30px]'>
                                    <p onClick={() => {navigate('/profile'); window.scrollTo(0,0);}} className='text-[9px] font-black text-gray-400 cursor-pointer hover:text-[#BC002D] mb-4 uppercase tracking-[0.2em] flex items-center gap-2'><User size={12} /> Account Profile</p>
                                    <p onClick={() => {navigate('/orders')
                                        window.scrollTo(0,0);
                                    }} className='text-[9px] font-black text-gray-400 cursor-pointer hover:text-[#BC002D] mb-4 uppercase tracking-[0.2em] flex items-center gap-2'><Package size={12} /> MY ORDERS</p>
                                    <p onClick={logout} className='text-[9px] text-[#BC002D] cursor-pointer font-black uppercase tracking-[0.2em] flex items-center gap-2'><LogOut size={12} /> Sign Out</p>
                                </div>
                            </div>
                            )}
                        </div>

                        <Link to='/cart' className='hidden lg:flex relative active:scale-90 transition-transform'>
                            <div className=' bg-black p-2 rounded-sm hover:bg-[#BC002D] transition-all'>
                                <ShoppingBag size={16} className='text-white' />
                            </div>
                            <p className='absolute -right-1.5 -top-1.5 w-4 h-4 text-[8px] flex items-center justify-center bg-[#BC002D] text-white rounded-full font-black'>{getCartCount()}</p>
                        </Link> 

                        <Menu onClick={() => setVisible(true)} size={22} className='cursor-pointer xl:hidden text-gray-900' /> 
                    </div>
                </div>
            </div>

            {/* MOBILE ARCHIVE DRAWER */}
            <div className={`fixed inset-0 z-[5000] transition-all duration-500 ${visible ? 'visible' : 'invisible'}`}>
                <div onClick={() => setVisible(false)} className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-0 right-0 h-full w-[85%] bg-white transition-transform duration-500 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className='flex flex-col h-full'>
                        <div className='p-6 bg-gray-50 border-b border-black/5'>
                            <div className='flex items-center justify-between mb-8'>
                                <button onClick={() => setVisible(false)} className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400'><ArrowLeft size={14} /> Back</button>
                                <img src={assets.logo} className='w-9' alt="" />
                            </div>
                            <div className='flex items-center bg-white p-3 rounded-xl shadow-sm border border-black/5 overflow-x-auto hide-scrollbar w-full'>
                                <div onClick={() => {setShowSearch(true); navigate('/collection'); setVisible(false);}} className='flex flex-col items-center gap-1 min-w-[64px] flex-1 border-r border-black/5 cursor-pointer'>
                                    <Search size={18} className='text-[#BC002D]' />
                                    <span className='text-[8px] font-black uppercase tracking-tighter text-gray-400'>Search</span>
                                </div>
                                <div onClick={() => {navigate('/wishlist'); setVisible(false);}} className='flex flex-col items-center gap-1 min-w-[64px] flex-1 border-r border-black/5 cursor-pointer'>
                                    <Heart size={18} className={wishlist.length > 0 ? 'fill-[#BC002D] text-[#BC002D]' : 'text-gray-400'} />
                                    <span className='text-[8px] font-black uppercase tracking-tighter text-gray-400'>Wishlist</span>
                                </div>
                                <div onClick={() => {navigate('/cart'); setVisible(false);}} className='flex flex-col items-center gap-1 min-w-[64px] flex-1 border-r border-black/5 cursor-pointer'>
                                    <ShoppingBag size={18} className='text-black' />
                                    <span className='text-[8px] font-black uppercase tracking-tighter text-gray-400'>Cart</span>
                                </div>
                                <div onClick={() => {if (token) navigate('/profile'); else navigate('/login'); setVisible(false);}} className='flex flex-col items-center gap-1 min-w-[64px] flex-1 cursor-pointer'>
                                    <User size={18} className='text-gray-400' />
                                    <span className='text-[8px] font-black uppercase tracking-tighter text-gray-400'>{token ? 'Profile' : 'Login'}</span>
                                </div>
                            </div>
                        </div>

                        <div className='flex-1 overflow-y-auto p-10 space-y-8'>
                            <div 
                                onClick={() => { navigate(token ? '/referral' : '/login'); setVisible(false); }}
                                className='bg-black p-5 rounded-2xl flex items-center justify-between group active:bg-[#BC002D] transition-all'
                            >
                                <div className='flex items-center gap-4'>
                                    <div className='bg-white/10 p-2 rounded-lg'><Users size={18} className='text-white' /></div>
                                    <div>
                                        <p className='text-[10px] font-black text-white uppercase tracking-widest'>Refer Collector</p>
                                        <p className='text-[8px] text-white/50 font-bold uppercase'>Earn 50 Points Now</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className='text-white/30' />
                            </div>

                            <div className='flex flex-col gap-6'>
                                <p className='text-[8px] font-black text-[#BC002D] uppercase tracking-[0.6em]'>Registry Map</p>
                                {['Home', 'Collection', 'Orders', 'Blogs','Updates'].map((item, idx) => (
                                    <NavLink key={idx} onClick={() => setVisible(false)} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className='text-4xl font-bold tracking-tighter text-gray-900 flex items-center justify-between group'>
                                        {item} <ChevronRight size={20} className='text-gray-200 group-active:text-[#BC002D]' />
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        <div className='p-8'>
                            {token ? (
                                <button onClick={()=>{logout(); setVisible(false)}} className='w-full py-5 bg-gray-900 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl flex items-center justify-center gap-2'><LogOut size={14}/> Logout</button>
                            ) : (
                                <button onClick={()=>{navigate('/login'); setVisible(false)}} className='w-full py-5 bg-[#BC002D] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl shadow-lg'>Login</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;