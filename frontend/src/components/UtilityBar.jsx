import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Gift, Users, ArrowRight, Award } from 'lucide-react'; // Added Award icon

const UtilityBar = () => {
    const { currency, toggleCurrency, userPoints, navigate } = useContext(ShopContext);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setFilterOpen(document.body.hasAttribute('data-filter-open'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-filter-open'] });
        return () => observer.disconnect();
    }, []);

    const calculateValue = () => {
        const inrValue = (userPoints || 0) / 10;
        return currency === 'INR' ? inrValue : inrValue / 83;
    };

    const handleLogoToggle = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
        } else {
            setIsCollapsed(true);
            setIsExpanded(false);
        }
    };

    if (filterOpen) return null;

    return (
        <div className='hidden lg:flex fixed bottom-20 left-6 z-[400] select-none flex-col items-start'>

            {/* DETAIL PANEL (REWARDS) */}
            {!isCollapsed && isExpanded && (
                <div className='mb-4 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-[30px] shadow-2xl w-[280px] p-6 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300'>
                    <div className='flex justify-between items-center mb-6'>
                        <h3 className='text-[10px] font-black text-white uppercase tracking-[0.3em]'>Archive Rewards</h3>
                    </div>

                    <div className='flex flex-col gap-3'>
                        {/* INVITE BUTTON */}
                        <div 
                            className='bg-[#BC002D] p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-lg shadow-[#BC002D]/20' 
                            onClick={() => {navigate('/referral');
                                window.scrollTo(0, 0);
                            }
                            }
                        >
                            <div className='flex items-center gap-3'>
                                <Users size={18} className='text-white' />
                                <p className='text-[9px] font-black text-white uppercase'>Invite Collector (+50 PTS)</p>
                            </div>
                            <ArrowRight size={14} className='text-white' />
                        </div>

                        {/* --- NEW REDEEM BUTTON --- */}
                        <div 
    className='bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/10 hover:scale-[1.02] transition-all' 
    onClick={() => {
        navigate('/rewards');
        window.scrollTo(0, 0);
    }}
>
                            <div className='flex items-center gap-3'>
                                <Award size={18} className='text-amber-400' />
                                <div className='flex flex-col'>
    <p className='text-[9px] font-black text-white uppercase'>Rewards Value</p>
    <p className='text-[7px] font-bold text-gray-400 uppercase tracking-widest'>
        Current Worth: <span className='text-green-500'>{currency} {calculateValue().toFixed(2)}</span>
    </p>
</div>
                            </div>
                            <ArrowRight size={14} className='text-gray-400' />
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN INTERACTION AREA */}
            <div className={`flex items-center gap-4 transition-all duration-500 ease-out ${isCollapsed ? 'w-14 h-14' : 'bg-black/90 backdrop-blur-xl border border-white/10 rounded-full pl-2 pr-6 py-2 shadow-2xl'}`}>

                <div className='relative shrink-0'>
                    <button
                        onClick={handleLogoToggle}
                        className={`transition-all duration-300 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden
                            ${isCollapsed ? 'w-14 h-14 bg-[#BC002D]' : 'w-10 h-10 bg-[#BC002D] hover:scale-110 active:scale-95'}
                            ${isExpanded ? 'bg-white text-[#BC002D]' : 'text-white'}`}
                    >
                        <Gift size={isCollapsed ? 29 : 20} />
                        {isCollapsed && (
                            <span className='absolute -top-1 right-3 bg-black text-white text-[8px] px-1.5 py-1 rounded-full font-black border border-white/20'>
                                {userPoints || 0}
                            </span>
                        )}
                    </button>
                </div>

                {!isCollapsed && (
                    <div className='flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500'>
                        <div
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex flex-col cursor-pointer hover:opacity-70 transition-opacity group ${isExpanded ? 'scale-110' : ''}`}
                        >
                            <p className='text-[7px] font-black text-[#BC002D] uppercase leading-none mb-1 group-hover:underline'>View Options</p>
                            <p className='text-[11px] font-black text-white uppercase tabular-nums'>{userPoints || 0} PTS</p>
                        </div>

                        <div className='h-8 w-[1px] bg-white/10'></div>

                        <div className='flex flex-col'>
                            <p className='text-[7px] font-black text-green-500 uppercase leading-none mb-1'>Value</p>
                            <p className='text-[10px] font-black text-white tabular-nums'>{currency} {calculateValue().toFixed(2)}</p>
                        </div>

                        <div className='flex items-center bg-white/5 rounded-full p-1 border border-white/5'>
                            {['INR', 'USD'].map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => toggleCurrency(curr)}
                                    className={`px-2 py-1 rounded-full text-[8px] font-black transition-all ${currency === curr ? 'bg-[#BC002D] text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UtilityBar;