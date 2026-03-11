import React, { useState, useEffect } from 'react';
import { 
  X, Truck, Users, Award, 
  ArrowRight, ShieldCheck, Zap, Sparkles, MapPin,ChevronRight
} from 'lucide-react';

const PromoPopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        //sessionStorage logic maintained for premium session experience
        const hasSeenPopup = sessionStorage.getItem('phila_promo_seen');
        if (!hasSeenPopup) {
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const closePopup = () => {
        setIsVisible(false);
        sessionStorage.setItem('phila_promo_seen', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Soft Backdrop with high-end blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-700" 
                onClick={closePopup}
            ></div>

            {/* Popup Body - Now Landscape */}
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-[#D4AF37]/10 overflow-hidden animate-in zoom-in-95 duration-500 font-sans grid grid-cols-1 md:grid-cols-2">
                
                {/* --- LEFT: LEDGER IDENTITY PANEL (Dark) --- */}
                <div className="bg-[#0c0c0c] p-12 text-white relative flex flex-col justify-between select-none">
                    {/* Background Texture: Subtle Mesh Glow */}
                    <div className='absolute inset-0 bg-[#BC002D]/5 blur-[100px] pointer-events-none'></div>
                    
                    <div>
                        {/* Title - Matches Bestseller Logic (Dynamic Accent) */}
                        <div className="flex items-center gap-4 mb-5">
                            <span className="h-[1px] w-12 bg-[#BC002D]"></span>
                            <span className="text-[10px] tracking-[0.5em] text-[#BC002D] uppercase font-black">
                                Collector privileges
                            </span>
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter uppercase leading-[0.9] text-white">
                            Member <br /> <span className="text-[#D4AF37]">Sovereignty.</span>
                        </h2>
                        
                        <p className="text-[12px] text-gray-400 font-medium leading-relaxed max-w-sm mt-6 uppercase tracking-wider">
                            Exclusive protocols for verified archivists and global acquisition partners. Catalogy history through direct registry access.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* TIER WRAPPED AVATAR (Preview) */}
                        <div className="flex items-center gap-4 border border-white/5 bg-white/5 p-4 rounded-xl">
                            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-700 flex items-center justify-center text-xl font-black text-black shadow-lg'>
                                C
                            </div>
                            <div>
                                <p className='text-[10px] font-black uppercase tracking-widest text-[#D4AF37]'>Collector Level</p>
                                <p className='text-xs font-bold text-gray-300'>Accessing Registry Ledger...</p>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-3 mt-4 opacity-40">
                            <ShieldCheck size={12} className="text-[#BC002D]" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Verified Sovereign Registry</p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: FEATURES REGISTRY (Light) --- */}
                <div className="p-12 relative">
                    {/* Decorative Gold & Red Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#BC002D]"></div>
                    <div className="absolute top-0 right-1/2 translate-x-1/2 h-[2.5px] w-[2.5px] bg-[#D4AF37] z-10"></div>
                    
                    {/* Floating Close Trigger */}
                    <button 
                        onClick={closePopup}
                        className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all duration-300"
                    >
                        <X size={16} />
                    </button>

                    <div className="max-w-md mx-auto h-full flex flex-col justify-between">
                        {/* Sovereign Badge */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={20} className="text-[#D4AF37]" />
                                <h3 className='text-sm font-black uppercase tracking-widest text-gray-900'>Archive protocols</h3>
                            </div>
                        </div>

                        {/* Features List - Row Wise */}
                        {/* Features List - Row Wise */}
<div className="space-y-4">
    {[
        { 
            icon: Truck, 
            label: 'Logistics Protocol', 
            value: 'Complimentary Dispatch above ₹4,999' 
        },
        { 
            icon: Zap, 
            label: 'Accumulation Rate', 
            value: 'Earn 100 PhilaCoins for every ₹1,000 spent' 
        },
        { 
            icon: Users, 
            label: 'Network Expansion', 
            value: 'Earn 1000 Coins for every successful invite' 
        },
    ].map((item, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 p-5 rounded-sm bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-sm group-hover:bg-[#BC002D] transition-colors ${idx === 0 ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : idx === 1 ? 'bg-[#BC002D]/10 text-[#BC002D]' : 'bg-gray-100 text-gray-500'}`}>
                    <item.icon size={18} className='group-hover:text-white' />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#D4AF37] transition-colors">{item.label}</p>
                    <p className="text-[12px] font-bold text-black uppercase tracking-tight group-hover:text-white transition-colors">{item.value}</p>
                </div>
            </div>
            <ChevronRight size={14} className='text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-transform'/>
        </div>
    ))}
</div>

{/* Conversion Protocol Section - Hidden Exact Rate */}


                        {/* Conversion Protocol Section */}
                       

                        {/* Action Button */}
                        <button 
                            onClick={closePopup}
                            className="w-full mt-10 bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#BC002D] transition-all duration-300 shadow-xl"
                        >
                            Enter global archive <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoPopup;