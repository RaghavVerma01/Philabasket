import React, { useContext, useEffect, useState, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import { ArrowRight, Sparkles } from 'lucide-react';

const FeaturedProducts = () => {
    const { products, navigate } = useContext(ShopContext);
    const [featured, setFeatured] = useState([]);
    const [scrollProgress, setScrollProgress] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (products.length > 0) {
            const filtered = products
                .filter(item => item.isFeatured === true && item.stock > 0)
                .slice(0, 15);
            setFeatured(filtered);
        }
    }, [products]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
            setScrollProgress(progress);
        }
    };

    // SEO Slug Generator consistent with your BestSeller logic
    const navigateToProduct = (item) => {
        const slug = item.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        navigate(`/product/${item._id}/${slug}`);
        window.scrollTo(0, 0);
    };

    if (featured.length === 0) return null;

    return (
        <section className="bg-white py-20 md:py-32 overflow-hidden select-none relative border-t border-black/[0.03]">
            {/* Background Decorative Accent - Mirrored from BestSeller */}
            <div className="absolute -left-[10vw] top-[10%] h-[80%] w-[40%] bg-[#bd002d]/5 rounded-r-[600px] pointer-events-none"></div>

            <div className='px-6 md:px-16 lg:px-24 relative z-10'>
                
                {/* Header Section - Matches BestSeller Typography */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="h-[1px] w-12 bg-[#BC002D]"></span>
                            <span className="text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black">
                                Curated Selection
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 gap-4 tracking-tighter leading-none uppercase">
                            Featured 
                            <span className="text-[#bd002d] ml-3">Registry.</span>
                        </h2>
                    </div>

                    <button 
                        onClick={() => navigate('/collection')}
                        className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border-b border-black pb-1 text-[#BC002D] hover:border-[#BC002D] transition-all mb-2'
                    >
                        Explore Global Archive <ArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                    </button>
                </div>

                {/* SCROLLABLE AREA - Styled like BestSeller Mobile/Tablet view */}
                <div className='relative'>
                    <div 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className='flex overflow-x-auto gap-8 pb-12 pt-8 mobile-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing'
                    >
                        {featured.map((item, index) => (
                            <div 
                                key={item._id} 
                                className='min-w-[65%] sm:min-w-[45vw] lg:min-w-[220px] snap-center group relative transition-all duration-700'
                            >
                                {/* Sovereign Featured Badge */}
                                <div className="absolute -top-3 -left-3 z-20 pointer-events-none">
                                    <div className="bg-black text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center shadow-lg transform group-hover:-rotate-12 transition-transform duration-500 border-2 border-white">
                                        <Sparkles size={12} className="text-amber-400 mb-0.5" />
                                        <span className="text-[6px] font-black leading-none opacity-60 uppercase">Pick</span>
                                    </div>
                                </div>

                                <div className='pt-4 h-full'>
                                    <div 
                                        onClick={() => navigateToProduct(item)}
                                        className="flex flex-col h-full relative bg-white border border-gray-100 shadow-lg cursor-pointer transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-2xl group-hover:border-[#bd002d]/20 overflow-hidden rounded-br-[40px] md:rounded-br-[60px]"
                                    >
                                        {/* Status Indicator */}
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                                            <div className="w-1.5 h-1.5 bg-[#BC002D] rounded-full animate-pulse shadow-[0_0_5px_#BC002D]"></div>
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Premium Grade</span>
                                        </div>

                                        <div className="flex-grow p-2 md:p-2">
                                            <div className="w-full h-full bg-[#f8f8f8] flex items-center justify-center p-4 md:p-3 rounded-br-[35px] md:rounded-br-[40px]">
                                                <ProductItem 
                                                    id={item._id} 
                                                    _id={item._id} 
                                                    image={item.image} 
                                                    name={item.name} 
                                                    price={item.price} 
                                                    marketPrice={item.marketPrice} 
                                                    category={item.category ? item.category[0] : ""} 
                                                    stock={item.stock} 
                                                    isPriorityMode={true} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Gradient Fade - Hidden on mobile, active on desktop */}
                    <div className='absolute right-0 top-0 bottom-12 w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none hidden lg:block'></div>
                </div>

                {/* --- REGISTRY SLIDER PROGRESS --- */}
                <div className='mt-4 flex items-center gap-6 max-w-sm'>
                    <span className='text-[8px] font-black text-gray-300 uppercase tracking-widest'>Registry Start</span>
                    <div className='relative h-[3px] flex-1 bg-gray-100 rounded-full overflow-hidden'>
                        <div 
                            className='absolute left-0 top-0 h-full bg-[#BC002D] transition-all duration-300 ease-out'
                            style={{ width: `${scrollProgress}%` }}
                        />
                    </div>
                    <span className='text-[8px] font-black text-gray-300 uppercase tracking-widest'>Archive End</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .mobile-scrollbar::-webkit-scrollbar { display: none; }
                @media (max-width: 1023px) {
                    .mobile-scrollbar::-webkit-scrollbar { display: block; height: 3px; }
                    .mobile-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; margin: 0 10vw; border-radius: 10px; }
                    .mobile-scrollbar::-webkit-scrollbar-thumb { background: #bd002d; border-radius: 10px; }
                }
            `}} />
        </section>
    );
};

export default FeaturedProducts;