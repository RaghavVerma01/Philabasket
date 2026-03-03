import React, { useEffect, useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import axios from 'axios';
import { RefreshCcw, Clock, History, ChevronRight } from 'lucide-react';

const Updates = () => {
    const { backendUrl } = useContext(ShopContext);
    const [recentProducts, setRecentProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            const response = await axios.get(backendUrl + '/api/product/latest-updates');
            if (response.data.success) {
                setRecentProducts(response.data.products);
            }
        } catch (error) {
            console.error("Update Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUpdates(); }, []);

    // Helper to calculate time ago
    const getTimeAgo = (dateString) => {
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 864000;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    };

    return (
        <div className='bg-white min-h-screen pt-10 md:pt-20 pb-24 px-6 md:px-16 lg:px-24 select-none animate-fade-in'>
            
            {/* --- HEADER SECTION --- */}
            <div className='max-w-7xl mx-auto mb-16'>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 border border-[#BC002D] rounded-full flex items-center justify-center">
                                <History size={16} className="text-[#BC002D]" />
                            </div>
                            <span className="text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black">Activity Log</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter leading-none uppercase">
                            Registry <span className="text-[#BC002D]">Updates.</span>
                        </h2>
                        <p className='text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] mt-6 flex items-center gap-2'>
                            <Clock size={12} /> Real-time sync with central philatelic archive
                        </p>
                    </div>
                    <button 
                        onClick={fetchUpdates}
                        className='group flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl hover:bg-[#BC002D] transition-all duration-500 active:scale-95'
                    >
                        <span className='text-[10px] font-black uppercase tracking-widest'>Refresh Log</span>
                        <RefreshCcw size={14} className={`group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* --- UPDATES GRID --- */}
           {/* --- UPDATES GRID --- */}
<div className='max-w-7xl mx-auto'>
    {loading ? (
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12'>
            {[...Array(10)].map((_, i) => (
                <div key={i} className='aspect-[3/4] bg-gray-50 animate-pulse rounded-br-[60px]'></div>
            ))}
        </div>
    ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12'>
            {/* Filter to only show items with stock > 0 */}
            {recentProducts
                .filter(item => item.stock > 0) 
                .map((item) => {
                    const createdTime = new Date(item.createdAt).getTime();
                    const updatedTime = new Date(item.updatedAt).getTime();
                    const isNew = Math.abs(updatedTime - createdTime) < 60000;

                    return (
                        <div key={item._id} className='group flex flex-col'>
                            {/* ... (Rest of your mapping code remains the same) */}
                            <div className='flex items-center justify-between mb-3 px-1'>
                                <div className='flex items-center gap-1.5'>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isNew ? 'bg-green-50 animate-pulse' : 'bg-amber-500'}`}></div>
                                    <span className='text-[8px] font-black uppercase tracking-widest text-gray-500'>
                                        {isNew ? 'Newly Added' : 'Restocked'}
                                    </span>
                                </div>
                                <span className='text-[8px] font-mono text-gray-300'>{getTimeAgo(item.updatedAt)}</span>
                            </div>

                            <div className='relative'>
                                <ProductItem {...item} />
                            </div>
                        </div>
                    );
                })}
        </div>
    )}
</div>

            {/* Empty State */}
            {!loading && recentProducts.length === 0 && (
                <div className='py-40 text-center'>
                    <p className='text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]'>No Recent Changes Detected</p>
                </div>
            )}
        </div>
    );
};

export default Updates;