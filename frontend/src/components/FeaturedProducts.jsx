import React, { useContext, useEffect, useState, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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

    const scrollRegistry = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 400; 
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
            setScrollProgress(progress);
        }
    };

    const navigateToProduct = (item) => {
        const slug = item.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        navigate(`/product/${item._id}/${slug}`);
        window.scrollTo(0, 0);
    };

    if (featured.length === 0) return null;

    // ... (keep the logic above the return the same)

return (
    <section className="bg-white py-8 md:py-12 overflow-hidden select-none relative border-t border-black/[0.03]">
        <div className="absolute -left-[10vw] top-[10%] h-[80%] w-[40%] bg-[#bd002d]/5 rounded-r-[600px] pointer-events-none"></div>

        <div className='px-6 md:px-16 lg:px-24 relative z-10'>
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-8">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="h-[1.5px] w-12 bg-[#BC002D]"></span>
                        <span className="text-[10px] tracking-[0.4em] text-[#BC002D] uppercase font-black">
                            Curated Selection
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter leading-none uppercase">
                        Featured <span className="text-[#bd002d] ml-1">Registry.</span>
                    </h2>
                </div>

                <button 
                    onClick={() => navigate('/collection')}
                    className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border-b border-black pb-1 text-[#BC002D] hover:border-[#BC002D] transition-all'
                >
                    Explore Global Archive <ArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                </button>
            </div>

            {/* --- CAROUSEL CONTAINER --- */}
            <div className='relative group/nav'>
                
                {/* Scroll Buttons */}
                <button onClick={() => scrollRegistry('left')} className="hidden  text-black lg:flex absolute -left-12 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full items-center justify-center bg-white border border-gray-100 shadow-xl opacity-0 group-hover/nav:opacity-100 transition-all"><ChevronLeft size={18} /></button>
                <button onClick={() => scrollRegistry('right')} className="hidden text-black lg:flex absolute -right-12 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full items-center justify-center bg-white border border-gray-100 shadow-xl opacity-0 group-hover/nav:opacity-100 transition-all"><ChevronRight size={18} /></button>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className='flex overflow-x-auto gap-6 pb-10 pt-4 mobile-scrollbar snap-x snap-mandatory scroll-smooth'
                >
                    {featured.map((item) => (
                        <div 
                            key={item._id} 
                            /* REDUCED WIDTHS: 
                               Mobile: 75% -> 40%
                               Desktop: lg:min-w-[30px] -> 22% 
                            */
                            className='min-w-[65%] sm:min-w-[40%] lg:min-w-[22%] max-w-[280px] snap-center group relative'
                        >
                            {/* Pick Badge */}
                            <div className="absolute -top-2 -left-2 z-20 pointer-events-none scale-75 md:scale-100">
                                <div className="bg-black text-white w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-white">
                                    <Sparkles size={10} className="text-amber-400" />
                                    <span className="text-[5px] font-black uppercase">Pick</span>
                                </div>
                            </div>

                            <div className='h-full'>
                                <div 
                                    onClick={() => navigateToProduct(item)}
                                    className="flex flex-col h-full bg-white border border-gray-100 shadow-md cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl rounded-br-[40px] md:rounded-br-[50px] overflow-hidden"
                                >
                                    {/* Image Container with fixed Aspect Ratio */}
                                    <div className="p-1 aspect-square md:aspect-[4/5] bg-[#f8f8f8]">
                                        <div className="w-full h-full flex items-center justify-center rounded-br-[35px] md:rounded-br-[45px] overflow-hidden">
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
            </div>

            {/* --- PROGRESS BAR --- */}
            <div className='hidden lg:flex mt-2 flex items-center gap-4 max-w-[200px] mx-auto opacity-30'>
                <div className='relative h-[2px] flex-1 bg-gray-100 rounded-full overflow-hidden'>
                    <div 
                        className='absolute left-0 top-0 h-full bg-[#BC002D] transition-all duration-300'
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>
            </div>
        </div>
    </section>
);
};

export default FeaturedProducts;