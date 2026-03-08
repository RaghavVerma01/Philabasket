import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App'; // Importing directly from App.js
import { Landmark, Globe, IndianRupee, Save, Clock, Zap } from 'lucide-react';

const Settings = ({ token }) => {
    const [loading, setLoading] = useState(false);
    
    // Initialize with all 7 fields matching your Mongoose Schema
    const [formData, setFormData] = useState({ 
        rate: 83, 
        indiaFee: 125, 
        indiaFeeFast: 250,
        globalFee: 750, 
        globalFeeFast: 1500,
        isIndiaFastActive: true,
        isGlobalFastActive: true
    });
    const [lastUpdate, setLastUpdate] = useState(null);

    // FETCH PROTOCOLS
    const fetchSettings = async () => {
        try {
            // FIX: Removed curly braces around backendUrl and used backticks
            const res = await axios.get(`${backendUrl}/api/admin/settings`);
            if (res.data.success) {
                setFormData(res.data.settings);
                setLastUpdate(res.data.settings.updatedAt);
            }
        } catch (error) { 
            console.error("Fetch Error:", error);
            toast.error("Failed to load Registry Protocols from Backend"); 
        }
    };

    // DEPLOY PROTOCOLS
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        // Construct the payload strictly matching the Backend Controller expectations
        const payload = {
            rate: Number(formData.rate),
            indiaFee: Number(formData.indiaFee),
            indiaFeeFast: Number(formData.indiaFeeFast),
            globalFee: Number(formData.globalFee),
            globalFeeFast: Number(formData.globalFeeFast),
            isIndiaFastActive: Boolean(formData.isIndiaFastActive),
            isGlobalFastActive: Boolean(formData.isGlobalFastActive)
        };
    
        try {
            // FIX: Direct string construction for the API endpoint
            const targetUrl = `${backendUrl}/api/admin/update-settings`;
            
            const res = await axios.post(targetUrl, payload, { 
                headers: { token } 
            });
    
            if (res.data.success) {
                toast.success("Registry Protocols Deployed Successfully");
                fetchSettings(); // Refresh to show the latest sync time
            } else {
                toast.error(res.data.message || "Registry Update Denied");
            }
        } catch (error) {
            console.error("Submission Error Trace:", error);
            // If error.response is undefined, the server is likely unreachable
            const errorMsg = error.response?.data?.message || "Registry Connection Failed";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        if (backendUrl) fetchSettings(); 
    }, []);

    return (
        <form onSubmit={onSubmitHandler} className='font-["Nunito",sans-serif] flex flex-col w-full items-start gap-8 p-8 bg-[#FCF9F4] min-h-screen'>
            <div className='flex flex-col gap-2'>
                <h2 className='text-xl font-black uppercase tracking-widest text-gray-900'>Financial Protocols</h2>
                <div className='flex items-center gap-2 text-gray-400'>
                    <p className='text-[10px] font-bold uppercase tracking-widest'>Configure multi-tier delivery valuations and active status.</p>
                    {lastUpdate && (
                        <div className='flex items-center gap-1.5 ml-4 bg-white px-3 py-1 rounded-full border border-gray-100'>
                            <Clock size={10} /><span className='text-[9px] font-black uppercase'>Sync: {new Date(lastUpdate).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl'>
                {/* 1. Exchange Rate */}
                <div className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm'>
                    <div className='flex items-center gap-2 mb-4 text-[#BC002D]'><Landmark size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Exchange Rate (USD)</p></div>
                    <input onChange={(e)=>setFormData({...formData, rate: e.target.value})} value={formData.rate} className='w-full px-3 py-3 bg-gray-50 border-none font-mono text-lg rounded-lg outline-none ring-1 ring-gray-100 focus:ring-[#BC002D]/30' type="number" step="0.01" required />
                </div>

                {/* 2. India Standard */}
                <div className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm'>
                    <div className='flex items-center gap-2 mb-4 text-[#BC002D]'><IndianRupee size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Standard Fee (India)</p></div>
                    <input onChange={(e)=>setFormData({...formData, indiaFee: e.target.value})} value={formData.indiaFee} className='w-full px-3 py-3 bg-gray-50 border-none font-mono text-lg rounded-lg outline-none ring-1 ring-gray-100 focus:ring-[#BC002D]/30' type="number" required />
                </div>

                {/* 3. Global Standard */}
                <div className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm'>
                    <div className='flex items-center gap-2 mb-4 text-[#BC002D]'><Globe size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Standard Fee (Global)</p></div>
                    <input onChange={(e)=>setFormData({...formData, globalFee: e.target.value})} value={formData.globalFee} className='w-full px-3 py-3 bg-gray-50 border-none font-mono text-lg rounded-lg outline-none ring-1 ring-gray-100 focus:ring-[#BC002D]/30' type="number" required />
                </div>

                {/* 4. India Fast */}
                <div className='bg-white p-6 border-2 border-[#BC002D]/10 rounded-xl shadow-sm relative'>
                    <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-2 text-[#BC002D]'><Zap size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Fast Delivery (India)</p></div>
                        <input type="checkbox" checked={formData.isIndiaFastActive} onChange={(e)=>setFormData({...formData, isIndiaFastActive: e.target.checked})} className='w-4 h-4 accent-[#BC002D] cursor-pointer' />
                    </div>
                    <input onChange={(e)=>setFormData({...formData, indiaFeeFast: e.target.value})} value={formData.indiaFeeFast} className={`w-full px-3 py-3 bg-gray-50 border-none font-mono text-lg rounded-lg outline-none ${!formData.isIndiaFastActive && 'opacity-30'}`} type="number" required />
                </div>

                {/* 5. Global Fast */}
                <div className='bg-white p-6 border-2 border-[#BC002D]/10 rounded-xl shadow-sm relative'>
                    <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-2 text-[#BC002D]'><Zap size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Fast Delivery (Global)</p></div>
                        <input type="checkbox" checked={formData.isGlobalFastActive} onChange={(e)=>setFormData({...formData, isGlobalFastActive: e.target.checked})} className='w-4 h-4 accent-[#BC002D] cursor-pointer' />
                    </div>
                    <input onChange={(e)=>setFormData({...formData, globalFeeFast: e.target.value})} value={formData.globalFeeFast} className={`w-full px-3 py-3 bg-gray-50 border-none font-mono text-lg rounded-lg outline-none ${!formData.isGlobalFastActive && 'opacity-30'}`} type="number" required />
                </div>
            </div>

            <button type="submit" disabled={loading} className='bg-black text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-[#BC002D] transition-all rounded-xl shadow-xl active:scale-95'>
                <Save size={14}/> {loading ? 'DEPLOYING...' : 'DEPLOY FINANCIAL REGISTRY'}
            </button>
        </form>
    );
};

export default Settings;