import React, { useState, useEffect } from 'react';
import { 
  X, Truck, Users, Award, 
  ArrowRight, ShieldCheck, Zap, Sparkles
} from 'lucide-react';

const PromoPopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
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
                className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-700" 
                onClick={closePopup}
            ></div>

            {/* Popup Body */}
            <div className="relative w-full max-w-[440px] bg-white rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#D4AF37]/20 overflow-hidden animate-in zoom-in-95 duration-500 font-sans">
                
                {/* Decorative Gold & Red Top Bar */}
                <div className="flex h-1.5 w-full">
                    <div className="flex-1 bg-[#BC002D]"></div>
                    <div className="flex-1 bg-[#D4AF37]"></div>
                    <div className="flex-1 bg-[#BC002D]"></div>
                </div>

                {/* Floating Close Trigger */}
                <button 
                    onClick={closePopup}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-[#BC002D] hover:text-white transition-all duration-300 z-50"
                >
                    <X size={16} />
                </button>

                <div className="p-10">
                    {/* Sovereign Badge */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="mb-4 p-3 rounded-full bg-gradient-to-tr from-[#D4AF37]/20 to-white border border-[#D4AF37]/30">
                            <Sparkles size={20} className="text-[#D4AF37]" />
                        </div>
                        <p className="text-[10px] tracking-[0.5em] text-[#D4AF37] uppercase font-black mb-2 ml-1">Archive Member Privileges</p>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tighter uppercase leading-[0.9]">
                            Collector <br /> <span className="text-[#BC002D]">Sovereignty.</span>
                        </h2>
                    </div>

                    {/* Features Registry */}
                    <div className="space-y-6">
                        {/* Item 1 */}
                        <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm group-hover:border-[#BC002D]/30">
                                <Truck size={18} className="text-[#BC002D]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Logistics</p>
                                <p className="text-[11px] text-gray-600 font-bold uppercase tracking-tight">Free Shipping above <span className="text-black">₹4,999</span></p>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm group-hover:border-[#BC002D]/30">
                                <Zap size={18} className="text-[#BC002D]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Accumulation</p>
                                <p className="text-[11px] text-gray-600 font-bold uppercase tracking-tight">Earn <span className="text-black">100 PTS</span> per <span className="text-black">₹1,000</span></p>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="flex items-center gap-5 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm group-hover:border-[#BC002D]/30">
                                <Users size={18} className="text-[#BC002D]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Referral</p>
                                <p className="text-[11px] text-gray-600 font-bold uppercase tracking-tight">Earn <span className="text-black">50 Points</span> for Invites</p>
                            </div>
                        </div>

                        {/* Conversion Protocol Section */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between bg-black p-4 rounded-sm">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest">Exchange Rate</span>
                                    <span className="text-[11px] font-black text-white uppercase tracking-wider">10 PTS = ₹1.00</span>
                                </div>
                                <Award size={16} className="text-[#D4AF37]" />
                            </div>
                        </div>
                    </div>

                    {/* Final Action */}
                    <button 
                        onClick={closePopup}
                        className="w-full mt-10 bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#BC002D] transition-all duration-300 shadow-lg"
                    >
                        Enter Archive <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="mt-6 flex justify-center items-center gap-2 opacity-40">
                        <ShieldCheck size={10} className="text-gray-900" />
                        <p className="text-[8px] font-black text-gray-900 uppercase tracking-[0.2em]">Verified Sovereign Registry</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoPopup;