import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ArrowRight, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';

const BlogRegistry = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { backendUrl } = useContext(ShopContext);
    const navigate = useNavigate();

    const fetchBlogs = async () => {
        try {
            if (!backendUrl) return; 
            const response = await axios.get(`${backendUrl}/api/blog/list`);
            if (response.data.success) {
                setBlogs(response.data.blogs);
            }
        } catch (error) {
            console.error("Archive Retrieval Error:", error);
            toast.error("Failed to sync with blog registry");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, [backendUrl]);

    if (loading) return (
        <div className='py-24 flex justify-center items-center bg-white'>
            <Loader2 className='animate-spin text-[#BC002D]' size={30} />
        </div>
    );

    return (
        <section className="py-12 md:py-4 bg-white relative overflow-hidden">
            {/* Background Aesthetic */}
            <div className="absolute -right-[10vw] top-0 h-[40vh] w-[30vw] bg-[#BC002D]/5 rounded-bl-[400px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* Section Header - Adjusted padding for mobile */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-16 gap-6 ">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                            <div className="w-8 md:w-10 h-[1.5px] bg-[#BC002D]"></div>
                            <span className="text-[9px] md:text-[10px] font-black text-[#BC002D] uppercase tracking-[0.4em]">
                                INTEL BRIEFINGS
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-bold text-gray-900 tracking-tighter leading-none">
                            THE <span className='text-[#BC002D] italic font-light'>ARCHIVE.</span>
                        </h2>
                    </div>
                    <p className="max-w-sm text-[11px] md:text-[12px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed border-l-2 border-gray-100 pl-4 md:pl-6">
                        Historical provenance and rarity analysis.
                    </p>
                </div>

                {/* --- MOBILE SCROLLABLE / DESKTOP GRID --- */}
                {/* Added: 
                    1. flex overflow-x-auto for mobile
                    2. snap-x snap-mandatory for smooth snapping
                    3. md:grid to revert to 3 columns on desktop 
                */}
                <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-12 px-4 pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                    {blogs.map((blog) => (
                        <article 
                            key={blog._id} 
                            className="group flex flex-col min-w-[85vw] md:min-w-0 snap-center cursor-pointer"
                            onClick={() => navigate(`/blog/${blog._id}`)}
                        >
                            {/* Image Frame */}
                            <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 mb-6 border border-black/[0.03] group-hover:border-[#BC002D]/20 transition-all duration-700">
                                <img 
                                    src={blog.image} 
                                    alt={blog.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out"
                                />
                                
                                <div className="absolute bottom-0 left-0 bg-black text-white px-3 py-1.5 text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em]">
                                    {blog.category || 'Classified'}
                                </div>

                                {/* Desktop-only Icon */}
                                <div className="absolute top-4 right-4 hidden md:flex translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                    <div className="w-10 h-10 rounded-full bg-[#BC002D] text-white items-center justify-center shadow-xl flex">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Meta Data */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                    <Calendar size={10} />
                                    {new Date(blog.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <span className='w-4 h-[1px] bg-gray-100'></span>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-[1.2] mb-3 uppercase tracking-tighter group-hover:text-[#BC002D] transition-colors duration-300">
                                {blog.title}
                            </h3>
                            <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed line-clamp-2 font-medium uppercase tracking-tight mb-6">
                                {blog.description || (blog.content && blog.content.replace(/<[^>]*>?/gm, '').slice(0, 100) + "...")}
                            </p>

                            <div className='mt-auto pt-4 border-t border-black/[0.03]'>
                                <p className='text-[8px] font-black uppercase tracking-[0.3em] text-[#BC002D] flex items-center gap-2'>
                                    Access Analysis <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                </p>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-12 md:mt-20 text-center px-4">
                    <button 
                        onClick={() => {navigate('/blogs'); window.scroll(0,0)}}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-[#BC002D] transition-colors group py-4 border-t md:border-t-0 md:border-b-2 border-gray-100"
                    >
                        View Full Archive <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* CSS to hide scrollbar while keeping functionality */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
};

export default BlogRegistry;