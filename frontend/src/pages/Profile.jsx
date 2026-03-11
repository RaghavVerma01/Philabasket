import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, MapPin, ShieldCheck, Loader2, Edit3, X, History, ArrowRight, Wallet,Award,Zap,Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { token, backendUrl, userData, fetchUserData, navigate } = useContext(ShopContext);
    const [showTierBenefits, setShowTierBenefits] = useState(false);
    
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [address, setAddress] = useState({ 
        street: '', 
        city: '', 
        state: '', 
        zipCode: '', 
        phone: '' 
    });
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData) {
            setName(userData.name || '');
            if (userData.defaultAddress) {
                setAddress(userData.defaultAddress);
            }
        }
    }, [userData]);

    const handlePincodeChange = async (e) => {
        const pin = e.target.value;
        setAddress(prev => ({ ...prev, zipCode: pin }));
        
        if (pin.length === 6) {
            setIsVerifying(true);
            try {
                const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
                if (response.data[0].Status === "Success") {
                    const data = response.data[0].PostOffice[0];
                    setAddress(prev => ({ 
                        ...prev, 
                        city: data.District, 
                        state: data.State 
                    }));
                    toast.success(`Registry Verified: ${data.District}`);
                } else {
                    toast.error("Invalid Registry Pincode.");
                }
            } catch (error) {
                toast.error("Pincode service offline.");
            } finally {
                setIsVerifying(false);
            }
        }
    };

    const updateProfile = async () => {
        if (!name.trim()) return toast.error("Identity name cannot be empty.");
        
        setLoading(true);
        try {
            const res = await axios.post(
                backendUrl + '/api/user/update-address', 
                { name, address }, 
                { headers: { token } }
            );
            if (res.data.success) {
                toast.success("Registry synchronized successfully.");
                setIsEditingName(false);
                fetchUserData();
            }
        } catch (error) {
            toast.error("Registry synchronization failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='px-6 md:px-16 lg:px-24 py-16 bg-[#FCF9F4] min-h-screen font-sans'>
            <div className='mb-12'>
                <h2 className='text-4xl font-black uppercase tracking-tighter text-black'>Account Archive</h2>
                <p className='text-[10px] text-gray-400 tracking-[0.3em] uppercase mt-2 font-black'>Collector Identity & Logistics</p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-12'>
                
                {/* --- Identity & Vault Card --- */}
                <div className='lg:col-span-1 space-y-6'>
    <div className={`relative p-8 rounded-xl text-white shadow-2xl overflow-hidden border transition-all duration-700 select-none ${
        userData?.tier === 'Platinum' ? 'bg-[#0a192f] border-cyan-500/30 shadow-cyan-500/10' : 
        userData?.tier === 'Gold' ? 'bg-[#1a140a] border-amber-500/30 shadow-amber-500/10' : 
        'bg-[#0f0f0f] border-white/10'
    }`}>
        
        {/* --- DYNAMIC MESH GLOWS --- */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[100px] opacity-40 rounded-full transition-colors duration-1000 ${
            userData?.tier === 'Platinum' ? 'bg-cyan-500' : 
            userData?.tier === 'Gold' ? 'bg-amber-500' : 'bg-[#BC002D]'
        }`}></div>
        <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-[80px] opacity-20 rounded-full transition-colors duration-1000 ${
            userData?.tier === 'Platinum' ? 'bg-blue-600' : 
            userData?.tier === 'Gold' ? 'bg-orange-600' : 'bg-gray-600'
        }`}></div>

        {/* --- TIER ACTION BUTTON --- */}
        <button 
            onClick={() => setShowTierBenefits(true)}
            className='relative z-20 w-full mb-8 flex items-center justify-center gap-2 py-2.5 border border-white/5 hover:border-white/20 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all bg-white/5 backdrop-blur-sm group'
        >
            <Zap size={14} className={`transition-transform group-hover:scale-125 ${
                userData?.tier === 'Platinum' ? 'text-cyan-400' : 
                userData?.tier === 'Gold' ? 'text-amber-400' : 'text-amber-500'
            }`} />
            Access Tier Privileges
        </button>
        
        <div className='relative z-10 flex flex-col items-center gap-6 mb-10'>
            {/* TIER WRAPPED AVATAR WITH BREATHING EFFECT */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black relative transition-all duration-700 ${
                userData?.tier === 'Platinum' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 
                userData?.tier === 'Gold' ? 'bg-gradient-to-br from-amber-300 to-yellow-700 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 
                'bg-gradient-to-br from-gray-700 to-black shadow-lg border border-white/10'
            }`}>
                <span className="drop-shadow-md">{name?.charAt(0)}</span>
                
                {/* SMALL TIER ICON OVERLAY */}
                <div className='absolute -bottom-1 -right-1 bg-[#121212] p-2 rounded-full border border-white/10 shadow-xl'>
                    <Award size={14} className={
                        userData?.tier === 'Platinum' ? 'text-cyan-400' : 
                        userData?.tier === 'Gold' ? 'text-amber-400' : 'text-gray-400'
                    } />
                </div>
            </div>

            <div className='text-center w-full group'>
                <div className='flex flex-col items-center gap-2 mb-3'>
                    <p className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-500'>
                        Authenticated Collector
                    </p>
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors duration-700 ${
                        userData?.tier === 'Platinum' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 
                        userData?.tier === 'Gold' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 
                        'bg-white/5 border-white/10 text-gray-400'
                    }`}>
                        {userData?.tier || 'Silver'} Registry
                    </span>
                </div>
                
                {isEditingName ? (
                    <div className='flex items-center gap-2 justify-center max-w-[200px] mx-auto'>
                        <input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className='bg-transparent border-b border-[#BC002D] text-center text-2xl font-bold tracking-tight outline-none w-full text-white'
                            autoFocus
                        />
                        <X size={18} className='cursor-pointer text-gray-500 hover:text-white shrink-0' onClick={() => {setIsEditingName(false); setName(userData.name)}} />
                    </div>
                ) : (
                    <div className='flex items-center gap-2 justify-center cursor-pointer group/name' onClick={() => setIsEditingName(true)}>
                        <h3 className='text-2xl font-bold tracking-tight border-b border-transparent group-hover/name:border-white/20 transition-all'>{name}</h3>
                        <Edit3 size={16} className='text-gray-500 opacity-0 group-hover/name:opacity-100 transition-all' />
                    </div>
                )}
            </div>
        </div>

        {/* --- TIER PROGRESS PROTOCOL --- */}
        <div className='relative z-10 mb-8 px-2'>
            <div className='flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3'>
                <span>Registry Progress</span>
                <span className={userData?.tier === 'Platinum' ? 'text-cyan-400' : ''}>
                    {userData?.tier === 'Platinum' ? 'LEGENDARY STATUS' : 
                     userData?.tier === 'Gold' ? 'NEXT: PLATINUM' : 'NEXT: GOLD'}
                </span>
            </div>
            <div className='h-2 w-full bg-white/5 rounded-full p-[2px] border border-white/5'>
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.1)] ${
                        userData?.tier === 'Platinum' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 w-full' : 
                        userData?.tier === 'Gold' ? 'bg-gradient-to-r from-amber-400 to-orange-500 w-[60%]' : 
                        'bg-[#BC002D] w-[20%]'
                    }`}
                ></div>
            </div>
        </div>

        <div className='relative z-10 space-y-4 pt-8 border-t border-white/5'>
            <div className='flex justify-between items-center bg-white/[0.03] p-5 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors'>
                <div>
                    <p className='text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1'>Vault Balance</p>
                    <p className={`font-mono text-xl font-bold ${
                         userData?.tier === 'Platinum' ? 'text-cyan-400' : 
                         userData?.tier === 'Gold' ? 'text-amber-400' : 'text-[#BC002D]'
                    }`}>{userData?.totalRewardPoints || 0} <span className="text-[10px] opacity-60">PTS</span></p>
                </div>
                <div className="relative group/tooltip">
    <button 
        onClick={() => navigate('/rewards')}
        className='h-12 w-12 bg-white/5 hover:bg-[#BC002D] hover:text-white text-gray-400 transition-all rounded-full flex items-center justify-center border border-white/10 group'
    >
        <History size={18} className="group-hover:rotate-[-45deg] transition-transform" />
    </button>

    {/* --- ARCHIVE TOOLTIP --- */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black border border-white/10 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl z-50">
        <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#BC002D] animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                View Points History
            </span>
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-white/10 rotate-45 -mt-1"></div>
    </div>
</div>
                
            </div>

            <div className='flex justify-between items-center px-5 py-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 hover:border-[#BC002D]/30 transition-all group/ref shadow-inner'>
    <div className="flex items-center gap-3">
        <Users size={14} className="text-gray-500 group-hover/ref:text-[#BC002D] transition-colors" />
        <span className='text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover/ref:text-gray-300 transition-colors'>
            Referral Identity
        </span>
    </div>
    
    <Link to={'/referral'} className="relative group/ref block w-fit">
    <span className={`font-mono text-[11px] text-white bg-white/5 px-4 py-2 rounded-lg tracking-wider border border-white/10 group-hover/ref:bg-white/10 transition-all duration-500 shadow-2xl whitespace-nowrap flex items-center justify-center min-w-[140px] ${
        userData?.tier === 'Platinum' ? 'group-hover/ref:border-cyan-500/50 group-hover/ref:shadow-cyan-500/20' : 
        userData?.tier === 'Gold' ? 'group-hover/ref:border-amber-500/50 group-hover/ref:shadow-amber-500/20' : 
        'group-hover/ref:border-[#BC002D]/50 group-hover/ref:shadow-[#BC002D]/20'
    }`}>
        {userData?.referralCode || 'PHILA-Q9HAA0'}
    </span>

    {/* Dynamic Tooltip */}
    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover/ref:opacity-100 transition-all duration-300 pointer-events-none border whitespace-nowrap shadow-lg ${
        userData?.tier === 'Platinum' ? 'bg-cyan-950 text-cyan-400 border-cyan-500/30' : 
        userData?.tier === 'Gold' ? 'bg-amber-950 text-amber-400 border-amber-500/30' : 
        'bg-red-950 text-red-400 border-red-500/30'
    }`}>
        View Network
    </div>
</Link>
</div>
        </div>
    </div>
</div>

                {/* --- Shipping Credentials Form --- */}
                <div className='lg:col-span-2'>
                    <div className='bg-white p-8 border border-black/5 rounded-sm shadow-sm'>
                        <div className='flex items-center gap-3 mb-8'>
                            <MapPin size={18} className='text-[#BC002D]' />
                            <h4 className='text-[10px] font-black uppercase tracking-[0.3em] text-black'>
                                Shipping Registry
                            </h4>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='md:col-span-2'>
                                <p className='text-[9px] uppercase font-bold text-gray-400 mb-2 ml-1'>Street & Landmark</p>
                                <input 
                                    value={address.street} 
                                    onChange={(e)=>setAddress({...address, street: e.target.value})} 
                                    className='w-full p-4 bg-gray-50 border border-black/5 rounded-sm text-sm text-black font-medium outline-none focus:border-[#BC002D]/30 transition-all placeholder-gray-400' 
                                    placeholder="Enter street address..." 
                                />
                            </div>

                            <div className='relative'>
                                <p className='text-[9px] uppercase font-bold text-gray-400 mb-2 ml-1'>Postal Pincode</p>
                                <input 
                                    value={address.zipCode} 
                                    onChange={handlePincodeChange} 
                                    className='w-full p-4 bg-white border border-[#BC002D]/20 rounded-sm text-sm text-black font-mono font-bold outline-none focus:border-[#BC002D] transition-all placeholder-gray-400' 
                                    placeholder="6-digit code" 
                                    type="number" 
                                />
                                {isVerifying && <Loader2 size={16} className='absolute right-4 bottom-4 animate-spin text-[#BC002D]' />}
                            </div>

                            <div>
                                <p className='text-[9px] uppercase font-bold text-gray-400 mb-2 ml-1'>Contact Number</p>
                                <input 
                                    value={address.phone} 
                                    onChange={(e)=>setAddress({...address, phone: e.target.value})} 
                                    className='w-full p-4 bg-gray-50 border border-black/5 rounded-sm text-sm text-black font-medium outline-none focus:border-[#BC002D]/30 transition-all placeholder-gray-400' 
                                    placeholder="Phone number" 
                                    type="number" 
                                />
                            </div>

                            <div>
                                <p className='text-[9px] uppercase font-bold text-gray-400 mb-2 ml-1'>City (Verified)</p>
                                <input 
                                    readOnly 
                                    value={address.city} 
                                    className='w-full p-4 bg-gray-100 border border-black/5 rounded-sm text-sm text-black font-bold outline-none cursor-not-allowed' 
                                    placeholder="Verified City" 
                                />
                            </div>

                            <div>
                                <p className='text-[9px] uppercase font-bold text-gray-400 mb-2 ml-1'>State (Verified)</p>
                                <input 
                                    readOnly 
                                    value={address.state} 
                                    className='w-full p-4 bg-gray-100 border border-black/5 rounded-sm text-sm text-black font-bold outline-none cursor-not-allowed' 
                                    placeholder="Verified State" 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={updateProfile} 
                            disabled={loading || isVerifying}
                            className={`mt-10 w-full md:w-fit px-10 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-3 ${
                                loading ? 'bg-gray-400' : 'bg-black text-white hover:bg-[#BC002D]'
                            }`}
                        >
                            {loading ? <Loader2 size={14} className='animate-spin' /> : <ShieldCheck size={14} />}
                            {loading ? 'Synchronizing...' : 'Save Registry Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TIER BENEFITS MODAL --- */}
{showTierBenefits && (
    <div className='fixed inset-0 z-[1000] flex items-center justify-center p-6'>
        <div className='absolute inset-0 bg-black/80 backdrop-blur-sm' onClick={() => setShowTierBenefits(false)}></div>
        <div className='bg-white w-full max-w-2xl relative z-10 p-8 rounded-sm shadow-2xl animate-in zoom-in duration-300'>
            <div className='flex justify-between items-center mb-8 border-b pb-4'>
                <h3 className='font-black uppercase tracking-widest text-sm text-black'>Collector Privilege Protocol</h3>
                <X className='cursor-pointer text-gray-400 hover:text-black' onClick={() => setShowTierBenefits(false)} />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {[
                    { 
                        title: 'Silver', 
                        color: 'bg-gray-100', 
                        border: 'border-gray-200',
                        perks: ['10% Reward Earning', 'Standard Support', 'Registry Access']
                    },
                    { 
                        title: 'Gold', 
                        color: 'bg-amber-50', 
                        border: 'border-amber-200',
                        perks: ['15% Reward Earning', 'Priority Shipping', 'Early Archive Access', 'Birthday Specimens']
                    },
                    { 
                        title: 'Platinum', 
                        color: 'bg-cyan-50', 
                        border: 'border-cyan-200',
                        perks: ['20% Reward Earning', 'Free Domestic Shipping', 'Curator Assistance', 'Limited Specimen Invites']
                    }
                ].map((tier) => (
                    <div key={tier.title} className={`${tier.color} ${tier.border} border p-5 rounded-sm flex flex-col h-full`}>
                        <h4 className='font-black uppercase tracking-widest text-xs mb-4 text-black'>{tier.title}</h4>
                        <ul className='space-y-3 flex-grow'>
                            {tier.perks.map((perk, i) => (
                                <li key={i} className='flex items-start gap-2 text-[9px] font-bold text-gray-600 uppercase leading-tight'>
                                    <ShieldCheck size={10} className='text-[#BC002D] mt-0.5 shrink-0' />
                                    {perk}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => setShowTierBenefits(false)}
                className='w-full mt-8 bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#BC002D] transition-all'
            >
                Acknowledge
            </button>
        </div>
    </div>
)}
        </div>
    );
};

export default Profile;