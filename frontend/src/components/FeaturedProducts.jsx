import React, { useContext, useEffect, useState, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import { Award, ArrowRight } from 'lucide-react';

const FeaturedProducts = () => {
    const { products, navigate } = useContext(ShopContext);
    const [featured, setFeatured] = useState([]);
    const [scrollProgress, setScrollProgress] = useState(0);
    const scrollRef = useRef(null);

    // 1. Filter logic remains consistent with registry integrity
    useEffect(() => {
        if (products.length > 0) {
            const filtered = products
                .filter(item => item.isFeatured === true && item.stock > 0)
                .slice(0, 20);
            setFeatured(filtered);
        }
    }, [products]);

    // 2. Scroll tracking logic to update the slider progress
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
            setScrollProgress(progress);
        }
    };

    if (featured.length === 0) return null;

    return (
        <section className="bg-white py-16 md:py-24 overflow-hidden select-none">
            <div className='px-6 md:px-16 lg:px-24'>
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                    <div>
                        <h2 className='text-3xl font-bold tracking-tighter uppercase text-gray-900'>
                            Featured <span className='text-[#BC002D]'>Products.</span>
                        </h2>
                    </div>
                    <button 
                        onClick={() => navigate('/collection')}
                        className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border-b border-black pb-1 text-[#BC002D] hover:border-[#BC002D] transition-all'
                    >
                        Explore Global Archive <ArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                    </button>
                </div>

                {/* SCROLLABLE AREA */}
                <div className='relative'>
                    <div 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className='flex overflow-x-auto gap-6 pb-8 pt-4 hide-scrollbar cursor-grab active:cursor-grabbing snap-x snap-mandatory'
                    >
                        {featured.map((item) => (
                            <div key={item._id} className='min-w-[280px] md:min-w-[320px] lg:min-w-[280px] snap-start transition-all duration-500 hover:translate-y-[-8px]'>
                                <div className="flex flex-col h-full relative group">
                                    <div className="absolute top-0 right-0 z-20 overflow-hidden w-16 h-16 pointer-events-none">
                                        <div className="absolute top-[15%] -right-[35%] bg-black text-white text-[6px] font-black py-1 w-[140%] text-center transform rotate-45 shadow-sm uppercase tracking-tighter">
                                            Featured
                                        </div>
                                    </div>
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
                        ))}
                    </div>

                    {/* Fading Edge Hint */}
                    <div className='absolute right-0 top-0 bottom-8 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none hidden lg:block'></div>
                </div>

                {/* --- CUSTOM REGISTRY SLIDER --- */}
                <div className='mt-8 flex items-center gap-4 max-w-xs mx-auto md:mx-0'>
                    <span className='text-[8px] font-black text-gray-300 uppercase tracking-widest'>Start</span>
                    <div className='relative h-[2px] flex-1 bg-gray-100 rounded-full overflow-hidden'>
                        <div 
                            className='absolute left-0 top-0 h-full bg-[#BC002D] transition-all duration-200 ease-out'
                            style={{ width: `${scrollProgress}%` }}
                        />
                    </div>
                    <span className='text-[8px] font-black text-gray-300 uppercase tracking-widest'>End</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </section>
    );
};

export default FeaturedProducts;