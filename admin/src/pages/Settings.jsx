import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Landmark, Globe, IndianRupee, Save, Clock } from 'lucide-react';
import { backendUrl } from '../App'


const Settings = ({ token}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ rate: 83, indiaFee: 125, globalFee: 750 });
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(backendUrl + '/api/admin/settings');
            if (res.data.success) {
                setFormData(res.data.settings);
                setLastUpdate(res.data.settings.updatedAt);
            }
        } catch (error) { toast.error("Failed to load Registry Protocols"); }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        // 1. Ensure data types are strictly Numeric for the Registry
        const payload = {
            rate: Number(formData.rate),
            indiaFee: Number(formData.indiaFee),
            globalFee: Number(formData.globalFee)
        };
    
        try {
            // 2. Defensive URL construction
            const targetUrl = `${backendUrl.replace(/\/$/, "")}/api/admin/update-settings`;
            
            const res = await axios.post(
                targetUrl, 
                payload, 
                { headers: { token } }
            );
    
            if (res.data.success) {
                toast.success(res.data.message);
                fetchSettings(); 
            } else {
                toast.error(res.data.message || "Registry Update Denied");
            }
        } catch (error) {
            // 3. Detailed Trace to identify the exact point of failure
            console.error("Technical Trace:", {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                message: error.message
            });
            
            const errorMsg = error.response?.data?.message || "Connection to Registry lost";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchSettings(); }, []);

    return (
        <form onSubmit={onSubmitHandler} className='font-["Nunito",sans-serif] flex flex-col w-full items-start gap-8 p-8 bg-[#FCF9F4] min-h-screen'>
            <div className='flex flex-col gap-2'>
                <h2 className='text-xl font-black uppercase tracking-widest text-gray-900'>Financial Protocols</h2>
                <div className='flex items-center gap-2 text-gray-400'>
                    <p className='text-[10px] font-bold uppercase tracking-widest'>Update global exchange rates and delivery tier valuations.</p>
                    {lastUpdate && <div className='flex items-center gap-1.5 ml-4 bg-gray-100 px-3 py-1 rounded-full'>
                        <Clock size={10} /><span className='text-[9px] font-black uppercase'>Last Sync: {new Date(lastUpdate).toLocaleString()}</span>
                    </div>}
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl'>
                {/* Exchange Rate Card */}
                <div className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-2 mb-4 text-[#BC002D]'><Landmark size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Exchange Rate (1 USD)</p></div>
                    <input onChange={(e)=>setFormData({...formData, rate: parseFloat(e.target.value)})} value={formData.rate} className='w-full px-3 py-3 bg-gray-50 border-none outline-none focus:ring-1 ring-[#BC002D]/30 font-mono text-lg rounded-lg' type="number" step="0.01" required />
                </div>

                {/* Domestic Fee Card */}
                <div className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-2 mb-4 text-[#BC002D]'><IndianRupee size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Domestic Fee (India)</p></div>
                    <input onChange={(e)=>setFormData({...formData, indiaFee: parseInt(e.target.value)})} value={formData.indiaFee} className='w-full px-3 py-3 bg-gray-50 border-none outline-none focus:ring-1 ring-[#BC002D]/30 font-mono text-lg rounded-lg' type="number" required />
                </div>

                {/* Global Fee Card */}
                <div className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                    <div className='flex items-center gap-2 mb-4 text-[#BC002D]'><Globe size={16}/><p className='text-[10px] font-black uppercase tracking-widest'>Global Fee (ROW)</p></div>
                    <input onChange={(e)=>setFormData({...formData, globalFee: parseInt(e.target.value)})} value={formData.globalFee} className='w-full px-3 py-3 bg-gray-50 border-none outline-none focus:ring-1 ring-[#BC002D]/30 font-mono text-lg rounded-lg' type="number" required />
                </div>
            </div>

            <button type="submit" disabled={loading} className='bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-[#BC002D] transition-all rounded-xl shadow-lg active:scale-95'>
                <Save size={14}/> {loading ? 'DEPLOYING...' : 'DEPLOY PROTOCOLS'}
            </button>
        </form>
    );
};

export default Settings;