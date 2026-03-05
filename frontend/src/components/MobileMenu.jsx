import React, { useState } from 'react';
import { ChevronRight, ChevronDown, X, User, Package, LogOut } from 'lucide-react';

const MobileMenu = ({ visible, setVisible, headerData, token, logout, navigate }) => {
    // Track which main category is expanded
    const [expandedMenu, setExpandedMenu] = useState(null);

    const toggleMenu = (id) => {
        setExpandedMenu(expandedMenu === id ? null : id);
    };

    return (
        <div className={`fixed top-0 bottom-0 left-0 overflow-hidden bg-white transition-all z-[200] ${visible ? 'w-full' : 'w-0'}`}>
            <div className='flex flex-col h-full text-gray-600'>
                
                {/* --- HEADER / USER SECTION --- */}
                <div className='bg-black p-6 text-white'>
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-xs font-black tracking-widest uppercase'>Philabasket</h2>
                        <X onClick={() => setVisible(false)} className='cursor-pointer text-white' size={24} />
                    </div>
                    
                    <div className='flex items-center gap-4'>
                        <div className='bg-gray-800 p-3 rounded-full'>
                            <User size={20} />
                        </div>
                        <div>
                            <p className='text-[10px] font-black text-gray-400 uppercase tracking-tighter'>Welcome</p>
                            <p onClick={() => token ? navigate('/profile') : navigate('/login')} className='text-sm font-bold cursor-pointer'>
                                {token ? 'My Account' : 'Login / Signup'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- NAV MENU SECTION --- */}
                <div className='flex-1 overflow-y-auto bg-gray-50'>
                    <p className='p-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]'>Categories</p>
                    
                    {headerData?.navMenu?.map((menu) => (
                        <div key={menu._id} className='border-b border-gray-100 bg-white'>
                            <div 
                                onClick={() => toggleMenu(menu._id)}
                                className='flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50'
                            >
                                <span className='text-[11px] font-black uppercase text-gray-900 tracking-tight'>{menu.title}</span>
                                {expandedMenu === menu._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>

                            {/* --- GROUPS & ITEMS --- */}
                            {expandedMenu === menu._id && (
                                <div className='bg-gray-50 pb-2'>
                                    {menu.groups.map((group) => (
                                        <div key={group._id} className='px-4 py-2'>
                                            {group.groupName && (
                                                <p className='text-[8px] font-black text-[#BC002D] uppercase mb-2 ml-2'>{group.groupName}</p>
                                            )}
                                            <div className='grid grid-cols-1 gap-1'>
                                                {group.items.map((item, idx) => (
                                                    <p 
                                                        key={idx}
                                                        onClick={() => {
                                                            navigate(`/collection?category=${item}`);
                                                            setVisible(false);
                                                        }}
                                                        className='text-[10px] font-bold text-gray-600 py-2 px-3 bg-white rounded-lg border border-gray-100'
                                                    >
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* --- FOOTER SECTION --- */}
                {token && (
                    <div className='p-4 bg-white border-t border-gray-100'>
                        <div className='grid grid-cols-2 gap-2'>
                            <button 
                                onClick={() => { navigate('/orders'); setVisible(false); }}
                                className='flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl text-[9px] font-black uppercase'
                            >
                                <Package size={12} /> Orders
                            </button>
                            <button 
                                onClick={logout}
                                className='flex items-center justify-center gap-2 p-3 bg-[#BC002D] text-white rounded-xl text-[9px] font-black uppercase'
                            >
                                <LogOut size={12} /> Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileMenu;