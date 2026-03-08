import React, { useState, useEffect } from 'react';
import { 
  X, Truck, Users, Star, Award, 
  ArrowRight, ShieldCheck, Zap 
} from 'lucide-react';

const PromoPopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show once per session to maintain premium experience
        const hasSeenPopup = sessionStorage.getItem('phila_promo_seen');
        if (!hasSeenPopup) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
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
            {/* Backdrop with Blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" 
                onClick={closePopup}
            ></div>

            {/* Popup Content */}
            <div className="relative w-full max-w-lg bg-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 select-none font-sans">
                
                {/* Header Accent */}
                <div className="h-1.5 w-full bg-[#BC002D]"></div>

                {/* Close Button */}
                <button 
                    onClick={closePopup}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 md:p-10">
                    {/* Brand Label */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="h-[1px] w-8 bg-[#BC002D]"></span>
                        <p className="text-[10px] tracking-[0.4em] text-[#BC002D] uppercase font-black">Archive Bulletin</p>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter uppercase leading-none mb-8">
                        Collector <br /> <span className="text-[#BC002D]">Privileges.</span>
                    </h2>

                    {/* Features Grid */}
                    <div className="space-y-6">
                        
    {/* Free Shipping */}
    <div className="flex items-start gap-4 group">
        <div className="p-3 bg-gray-50 rounded-sm group-hover:bg-[#BC002D]/5 transition-colors">
            <Truck size={18} className="text-[#BC002D]" />
        </div>
        <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Complimentary Dispatch</p>
            <p className="text-[12px] text-gray-500 font-medium">Free Shipping on domestic orders above <span className="text-black font-bold">₹4,999</span>.</p>
        </div>
    </div>

    {/* Points Accumulation - NEW */}
    <div className="flex items-start gap-4 group">
        <div className="p-3 bg-gray-50 rounded-sm group-hover:bg-[#BC002D]/5 transition-colors">
            <Zap size={18} className="text-[#BC002D]" />
        </div>
        <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Accumulation Protocol</p>
            <p className="text-[12px] text-gray-500 font-medium">Earn <span className="text-black font-bold">100 Points</span> for every <span className="text-black font-bold">₹1,000</span> spent in the archive.</p>
        </div>
    </div>

    {/* Referral System */}
    <div className="flex items-start gap-4 group">
        <div className="p-3 bg-gray-50 rounded-sm group-hover:bg-[#BC002D]/5 transition-colors">
            <Users size={18} className="text-[#BC002D]" />
        </div>
        <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Referral Protocol</p>
            <p className="text-[12px] text-gray-500 font-medium">Earn <span className="text-black font-bold">50 PTS</span> for every collector you invite after their first dispatch.</p>
        </div>
    </div>

    {/* Tiers & Rewards */}
    <div className="flex items-start gap-4 group">
        <div className="p-3 bg-gray-50 rounded-sm group-hover:bg-[#BC002D]/5 transition-colors">
            <Award size={18} className="text-[#BC002D]" />
        </div>
        <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Tiered Multipliers</p>
            <p className="text-[12px] text-gray-500 font-medium">Silver, Gold, and Platinum tiers offer up to <span className="text-black font-bold">50% reward multipliers</span>.</p>
        </div>
    </div>

    {/* Conversion Note - NEW */}
    <div className="mt-4 p-3 bg-black rounded-sm flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/60">Exchange Protocol</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#BC002D]">10 PTS = ₹1.00 (10% Value)</p>
    </div>
</div>

                    {/* Action Button */}
                    <button 
                        onClick={closePopup}
                        className="w-full mt-10 bg-black text-white py-4 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#BC002D] transition-all duration-300"
                    >
                        Explore <ArrowRight size={14} />
                    </button>

                    <div className="mt-6 flex justify-center items-center gap-2">
                        <ShieldCheck size={12} className="text-gray-900" />
                        <p className="text-[9px] font-bold text-gray-900 uppercase tracking-widest">Sovereign Registry Policy Applied</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoPopup;