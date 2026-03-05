import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { ImagePlus, Trash2, Plus, Edit3, Save, X, Loader2, Link as LinkIcon, Search, CheckCircle2 } from 'lucide-react';

const BannerManager = ({ token }) => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ image: '', title: '', link: '' });
    
    // Media Library States
    const [allMedia, setAllMedia] = useState([]);
    const [imageSearch, setImageSearch] = useState("");
    const [showMediaDropdown, setShowMediaDropdown] = useState(false);

    // 1. Fetch banners on mount
    const fetchBanners = async () => {
        const res = await axios.get(backendUrl + '/api/banner/list');
        if (res.data.success) setBanners(res.data.banners);
    };

    // 2. Fetch all media from registry
    const fetchMedia = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/media/all`, { headers: { token } });
            if (res.data.success) {
                // Adjust based on your API response structure
                setAllMedia(res.data.media || res.data.files || []);
            }
        } catch (err) { console.error("Media sync error", err); }
    };

    // 3. Filter media as user types
    const filteredMedia = useMemo(() => {
        if (!imageSearch) return [];
        return allMedia.filter(m => 
            m.originalName.toLowerCase().includes(imageSearch.toLowerCase())
        ).slice(0, 5);
    }, [allMedia, imageSearch]);

    useEffect(() => { 
        fetchBanners(); 
        fetchMedia();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.image) return toast.error("Please select an image specimen");
        
        setLoading(true);
        try {
            const endpoint = editId ? '/api/banner/update' : '/api/banner/add';
            const payload = editId ? { ...formData, id: editId } : formData;
            
            const res = await axios.post(backendUrl + endpoint, payload, { headers: { token } });
            if (res.data.success) {
                toast.success(res.data.message);
                setFormData({ image: '', title: '', link: '' });
                setImageSearch("");
                setEditId(null);
                fetchBanners();
            }
        } catch (error) { toast.error("Operation Failed"); }
        finally { setLoading(false); }
    };
    const deleteBanner = async (id) => {
        // Professional registry confirmation
        if (!window.confirm("Are you sure you want to purge this specimen from the Hero Archive?")) return;
        
        try {
            const res = await axios.post(
                backendUrl + '/api/banner/remove', 
                { id }, 
                { headers: { token } }
            );
            
            if (res.data.success) {
                toast.success("Specimen Purged Successfully");
                fetchBanners(); // Refresh the grid
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Archive Deletion Failed");
        }
    };

    const selectImage = (media) => {
        // Using media.imageUrl to match your mediaModel
        setFormData({ ...formData, image: media.imageUrl }); 
        setImageSearch(media.originalName);
        setShowMediaDropdown(false);
    };

    const startEdit = (banner) => {
        setEditId(banner._id);
        setFormData({ image: banner.image, title: banner.title, link: banner.link });
        setImageSearch("Current Image Selected");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className='p-6 bg-[#FCF9F4] min-h-screen font-serif pb-20'>
            <div className='mb-10'>
                <h2 className='text-2xl font-black uppercase tracking-tighter'>Hero <span className='text-[#BC002D]'>Banners</span></h2>
                <p className='text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]'>Manage Homepage Visual Strategy</p>
            </div>

            {/* FORM PANEL */}
            <div className='bg-white p-8 border border-gray-100 rounded-sm shadow-sm mb-12 max-w-4xl'>
                <div className='flex items-center gap-3 mb-6'>
                    {editId ? <Edit3 className='text-[#BC002D]' size={18}/> : <ImagePlus className='text-[#BC002D]' size={18}/>}
                    <h3 className='font-black uppercase text-xs tracking-widest'>{editId ? 'Modify Slide' : 'Register New Slide'}</h3>
                </div>
                
                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* MEDIA SEARCH INPUT */}
                    <div className='relative'>
                        <div className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                            <Search size={14}/>
                        </div>
                        <input 
                            value={imageSearch} 
                            onChange={(e) => {
                                setImageSearch(e.target.value);
                                setShowMediaDropdown(true);
                            }}
                            onFocus={() => setShowMediaDropdown(true)}
                            placeholder="Search Image from Registry..." 
                            className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 text-xs outline-none focus:border-[#BC002D]'
                        />
                        
                        {/* DROPDOWN RESULTS */}
                        {/* DROPDOWN RESULTS */}
{showMediaDropdown && filteredMedia.length > 0 && (
    <div className='absolute z-50 w-full mt-1 bg-white border border-gray-100 shadow-xl max-h-60 overflow-y-auto'>
        {filteredMedia.map((m) => (
            <div 
                key={m._id} 
                onClick={() => selectImage(m)}
                className='flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50'
            >
                {/* FIX: Changed m.url to m.imageUrl */}
                <img src={m.imageUrl} className='w-10 h-10 object-cover rounded-sm' alt={m.originalName} />
                
                <div className='flex flex-col'>
                    <span className='text-[10px] font-bold uppercase truncate max-w-[200px]'>{m.originalName}</span>
                    <span className='text-[8px] text-gray-400 uppercase tracking-tighter'>ID: {m.public_id}</span>
                </div>
                {/* Use m.imageUrl for the checkmark logic as well */}
                {formData.image === m.imageUrl && <CheckCircle2 size={14} className='ml-auto text-green-500'/>}
            </div>
        ))}
    </div>
)}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <input value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} placeholder="Title (e.g. Winter Sale)" className='px-4 py-3 bg-gray-50 border border-gray-100 text-xs outline-none focus:border-[#BC002D]' />
                        <input value={formData.link} onChange={(e)=>setFormData({...formData, link: e.target.value})} placeholder="Redirect Link (e.g. /collection)" className='px-4 py-3 bg-gray-50 border border-gray-100 text-xs outline-none focus:border-[#BC002D]' />
                    </div>

                    <div className='flex gap-2 pt-2'>
                        <button type='submit' className='bg-black text-white px-10 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#BC002D] transition-all flex items-center gap-2'>
                            {loading ? <Loader2 className='animate-spin' size={14}/> : (editId ? <Save size={14}/> : <Plus size={14}/>)}
                            {editId ? 'Update Banner' : 'Publish Banner'}
                        </button>
                        {editId && <button onClick={() => {setEditId(null); setFormData({image:'', title:'', link:''}); setImageSearch("")}} className='bg-gray-100 px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200'>Cancel</button>}
                    </div>
                </form>
            </div>

            {/* PREVIEW GRID */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {banners.map(b => (
                    <div key={b._id} className='group relative bg-white border border-gray-100 p-2 shadow-sm hover:shadow-xl transition-all duration-500'>
                        <div className='relative h-56 overflow-hidden bg-gray-100'>
                            <img src={b.image} className='w-full h-full object-cover transition-all duration-700' alt="" />
                            <div className='absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                <button onClick={() => startEdit(b)} className='p-2 bg-white text-black hover:bg-black hover:text-white rounded-full shadow-lg transition-all'><Edit3 size={14}/></button>
                                <button onClick={() => deleteBanner(b._id)} className='p-2 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded-full shadow-lg transition-all'><Trash2 size={14}/></button>
                            </div>
                        </div>
                        <div className='p-4 border-t border-gray-50'>
                            <div className='flex justify-between items-center'>
                                <p className='text-[11px] font-black uppercase tracking-tighter'>{b.title || 'Untitled Banner'}</p>
                                {b.link && <div className='flex items-center gap-1 text-[9px] font-bold text-[#BC002D] uppercase tracking-widest'><LinkIcon size={10}/> {b.link}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Click outside to close dropdown */}
            {showMediaDropdown && <div className='fixed inset-0 z-40' onClick={() => setShowMediaDropdown(false)}></div>}
        </div>
    );
};

export default BannerManager;