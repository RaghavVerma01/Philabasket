import React, { useState, useEffect, useTransition } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Send, Search, UserMinus, CheckCircle2, ImagePlus, Layout, 
    Link as LinkIcon, Upload, X, Eye, RefreshCw, Users, Loader2 
} from 'lucide-react';
import { backendUrl } from '../App';

const CustomerMail = ({ token }) => {
    const [customers, setCustomers] = useState([]);
    const [excluded, setExcluded] = useState([]); // Now strictly stores _id
    const [searchTerm, setSearchTerm] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [bannerImage, setBannerImage] = useState(""); 
    const [uploading, setUploading] = useState(false);
    const [imageMode, setImageMode] = useState("url"); 
    const [templateType, setTemplateType] = useState("light");
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // High Performance States
    const [isPending, startTransition] = useTransition();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(backendUrl + '/api/user/list', { headers: { token } });
                if (res.data.success) setCustomers(res.data.users || []);
            } catch (error) { toast.error("Registry connection failed"); }
        };
        if (token) fetchCustomers();
    }, [token]);

    // --- FIXED BULK ACTIONS ---
    const handleSelectAll = () => {
        setIsProcessing(true);
        setTimeout(() => {
            startTransition(() => {
                setExcluded([]); // Clearing exclusion = Select All
                setIsProcessing(false);
                toast.info("Targeting all active registrants");
            });
        }, 50);
    };

    const handleUnselectAll = () => {
        setIsProcessing(true);
        setTimeout(() => {
            startTransition(() => {
                const allIds = customers.map(c => c._id); // Unified to _id
                setExcluded(allIds); // Excluding everyone = Unselect All
                setIsProcessing(false);
                toast.warning("All registrants removed from dispatch");
            });
        }, 50);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image1', file); 
        setUploading(true);
        try {
            const res = await axios.post(backendUrl + '/api/product/upload-single', formData, { 
                headers: { token, 'Content-Type': 'multipart/form-data' } 
            });
            if (res.data.success) {
                setBannerImage(res.data.imageUrl); 
                toast.success("Asset verified and staged");
            }
        } catch (error) { toast.error("File sync rejected."); }
        finally { setUploading(false); }
    };

    const handleSend = async () => {
        if (!subject || !message) return toast.warning("Briefing incomplete.");
        
        const netReach = customers.length - excluded.length;
        if (netReach === 0) return toast.error("No recipients targeted.");
    
        // OPTIMIZATION: If we only selected a few people, it's better to send
        // a list of 'included' IDs rather than 9,000+ 'excluded' IDs.
        const selectedIds = customers
            .filter(c => !excluded.includes(c._id))
            .map(c => c._id);
    
        setLoading(true);
        try {
            const res = await axios.post(backendUrl + '/api/mail/send-bulk', 
                { 
                    target: 'customers', 
                    subject, 
                    message, 
                    // Only send the IDs of people we WANT to mail
                    selectedIds: selectedIds, 
                    bannerImage, 
                    templateType 
                },
                { headers: { token } }
            );
            if(res.data.success) {
                toast.success("Intelligence Dispatched");
                setSubject(""); setMessage(""); setBannerImage(""); setExcluded([]);
            }
        } catch (error) { 
            toast.error(error.response?.data?.message || "Transmission failed."); 
        }
        finally { setLoading(false); }
    };

    const filteredCustomers = customers.filter(c => 
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className='p-8 bg-white min-h-screen font-sans relative'>
            
            <div className='mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4'>
                <div>
                    <h2 className='text-3xl font-black uppercase tracking-tighter'>Intelligence Dispatch</h2>
                    <p className='text-[10px] font-black text-[#BC002D] uppercase tracking-[0.4em]'>Curation & Creative Console</p>
                </div>
                <div className='flex gap-4 w-full md:w-auto'>
                    <button onClick={() => setShowPreview(!showPreview)} className='flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all'>
                        {showPreview ? <><X size={14}/> Edit Draft</> : <><Eye size={14}/> Live Preview</>}
                    </button>
                    <div className='flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#BC002D] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100'>
                        Reach: {customers.length - excluded.length}
                    </div>
                </div>
            </div>
            
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
                
                {/* Audience Selection Sidebar */}
                <div className='xl:col-span-1 border border-gray-100 rounded-3xl bg-gray-50 flex flex-col overflow-hidden h-[fit-content] max-h-[700px] shadow-sm relative'>
                    
                    {(isProcessing || isPending) && (
                        <div className='absolute inset-0 z-[60] bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center transition-all'>
                            <Loader2 size={24} className='text-[#BC002D] animate-spin mb-2' />
                            <p className='text-[8px] font-black uppercase tracking-widest text-gray-500'>Updating Audience...</p>
                        </div>
                    )}

                    <div className='p-5 bg-white border-b border-gray-100 flex items-center gap-3'>
                        <Search size={16} className='text-gray-300' />
                        <input onChange={(e)=>setSearchTerm(e.target.value)} type="text" placeholder="Search Registrants..." className='text-[11px] font-bold outline-none w-full bg-transparent placeholder:text-gray-300' />
                    </div>

                    <div className='flex p-2 bg-white border-b border-gray-100 gap-2'>
                        <button onClick={handleSelectAll} disabled={isProcessing} className='flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest hover:bg-green-100 border border-green-100 transition-all'>
                            <Users size={12}/> Select All
                        </button>
                        <button onClick={handleUnselectAll} disabled={isProcessing} className='flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-widest hover:bg-red-100 border border-red-100 transition-all'>
                            <UserMinus size={12}/> Unselect All
                        </button>
                    </div>

                    <div className='overflow-y-auto custom-scrollbar'>
                        {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                            <div key={c._id} onClick={() => setExcluded(prev => prev.includes(c._id) ? prev.filter(e => e !== c._id) : [...prev, c._id])}
                                 className={`p-5 border-b border-gray-100 cursor-pointer flex justify-between items-center transition-all ${excluded.includes(c._id) ? 'bg-red-50/40' : 'hover:bg-white'}`}>
                                <div className={excluded.includes(c._id) ? 'opacity-40' : ''}>
                                    <p className='text-[11px] font-black uppercase tracking-tight'>{c.name || 'Anonymous User'}</p>
                                    <p className='text-[9px] text-gray-400 font-mono tracking-tighter'>{c.email}</p>
                                </div>
                                {excluded.includes(c._id) ? <UserMinus size={16} className='text-red-500' /> : <CheckCircle2 size={16} className='text-green-500' />}
                            </div>
                        )) : (
                            <div className='p-10 text-center text-gray-400 text-[10px] font-black uppercase'>No matches found</div>
                        )}
                    </div>
                </div>

                {/* Dispatch Builder */}
                <div className='xl:col-span-2 space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='p-5 bg-gray-50 rounded-3xl border border-gray-100'>
                            <p className='text-[9px] font-black uppercase text-gray-400 mb-3 flex items-center gap-2'><Layout size={12}/> Email Palette</p>
                            <div className='flex gap-2 bg-white p-1 rounded-2xl border border-gray-200'>
                                <button onClick={()=>setTemplateType('light')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${templateType==='light' ? 'bg-[#BC002D] text-white shadow-lg' : 'text-gray-300 hover:text-black'}`}>Light</button>
                                <button onClick={()=>setTemplateType('dark')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${templateType==='dark' ? 'bg-black text-white shadow-lg' : 'text-gray-300 hover:text-black'}`}>Dark</button>
                            </div>
                        </div>

                        <div className='p-5 bg-gray-50 rounded-3xl border border-gray-100'>
                             <div className='flex justify-between items-center mb-3'>
                                <p className='text-[9px] font-black uppercase text-gray-400 flex items-center gap-2'><ImagePlus size={12}/> Briefing Banner</p>
                            </div>
                            <label className={`flex items-center justify-center gap-3 w-full py-3 border border-dashed rounded-xl cursor-pointer transition-all ${bannerImage ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-[#BC002D]'}`}>
                                {uploading ? <RefreshCw size={14} className='animate-spin text-gray-400'/> : <Upload size={14} className={bannerImage ? 'text-green-500' : 'text-gray-400'}/>}
                                <span className={`text-[10px] font-black uppercase ${bannerImage ? 'text-green-600' : 'text-gray-400'}`}>{uploading ? "Uploading..." : bannerImage ? "Asset Secured" : "Browse Files"}</span>
                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                            </label>
                        </div>
                    </div>

                    {showPreview ? (
                        <div className={`p-10 border rounded-[40px] transition-all shadow-2xl relative overflow-hidden ${templateType === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
                            {bannerImage && <img src={bannerImage} className='w-full aspect-[21/9] object-cover rounded-2xl mb-8 shadow-2xl' alt="Preview" />}
                            <h3 className='text-3xl font-black uppercase tracking-tighter mb-6'>{subject || "Mission Subject Pending"}</h3>
                            <div className='text-[13px] leading-relaxed whitespace-pre-wrap font-medium'>{message || "No briefing content established..."}</div>
                        </div>
                    ) : (
                        <div className='bg-white p-8 border border-gray-100 rounded-[40px] space-y-6 shadow-sm relative overflow-hidden'>
                            {loading && (
                                <div className='absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center'>
                                    <RefreshCw size={40} className='text-[#BC002D] animate-spin mb-4' />
                                    <p className='text-[11px] font-black uppercase tracking-[0.4em] text-[#BC002D]'>Dispatching Intelligence...</p>
                                </div>
                            )}
                            <input value={subject} onChange={e=>setSubject(e.target.value)} className='w-full p-4 border-b-2 text-2xl font-black uppercase tracking-tighter outline-none focus:border-[#BC002D] placeholder-gray-100' placeholder="Briefing Subject..." />
                            <textarea value={message} onChange={e=>setMessage(e.target.value)} className='w-full h-96 p-6 bg-gray-50 rounded-3xl outline-none border-2 border-transparent focus:border-[#BC002D] transition-all text-sm font-bold leading-relaxed' placeholder="Type your strategic message here..." />
                            <button onClick={handleSend} disabled={loading || uploading} className='w-full py-5 bg-black text-white font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[#BC002D] transition-all disabled:bg-gray-100 flex items-center justify-center gap-4 shadow-xl active:scale-95'>
                                {loading ? <RefreshCw size={18} className='animate-spin'/> : <Send size={18}/>}
                                {loading ? "TRANSMITTING..." : "EXECUTE DISPATCH"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default CustomerMail;