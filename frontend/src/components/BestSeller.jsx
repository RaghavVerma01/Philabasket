import React, { useContext, useEffect, useState, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Added icons

const BestSeller = () => {
    const { products } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);
    const [scrollProgress, setScrollProgress] = useState(0);
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const curatedBestsellers = products
            .filter(item => item.bestseller === true || item.bestseller === "true")
            .sort((a, b) => b.date - a.date);
        setBestSeller(curatedBestsellers);
    }, [products]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
            setScrollProgress(progress);
        }
    };

    const scrollRegistry = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 400; 
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // --- NAVIGATION LOGIC ---
    

   // ... (keep logic above the return the same)

return (
    <div className='bg-white py-12 md:py-20 lg:mt-[-5vh] overflow-hidden select-none relative border-t border-black/[0.03]'>
        <div className="absolute -right-[15vw] top-[20%] h-[70%] w-[45%] bg-[#bd002d]/5 rounded-l-[600px] pointer-events-none"></div>

        <div className='px-6  md:px-16 lg:px-7 relative z-10'>
            {/* --- HEADER --- */}
            <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-8'>
                <div className="max-w-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="h-[1.5px] w-12 bg-[#BC002D]"></span>
                        <span className="text-[10px] tracking-[0.4em] text-[#BC002D] uppercase font-black">Archive Top Picks</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter leading-none uppercase">
                        Best <span className="text-[#bd002d] ml-1">Selling.</span>
                    </h2>
                </div>
            </div>

            <div className='relative group/nav'>
                {/* Navigation Buttons */}
                <button 
                    onClick={() => scrollRegistry('left')}
                    className="hidden text-black lg:flex absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full items-center justify-center bg-white border border-gray-100 shadow-xl opacity-0 group-hover/nav:opacity-100 transition-all hover:bg-black hover:text-white"
                >
                    <ChevronLeft size={18} />
                </button>

                <button 
                    onClick={() => scrollRegistry('right')}
                    className="hidden text-black  lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full items-center justify-center bg-white border border-gray-100 shadow-xl opacity-0 group-hover/nav:opacity-100 transition-all hover:bg-black hover:text-white"
                >
                    <ChevronRight size={18} />
                </button>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className='flex overflow-x-auto gap-6 pb-10 pt-4 p-4 hide-scrollbar snap-x snap-mandatory scroll-smooth'
                >
                    {bestSeller.length > 0 ? bestSeller.map((item, index) => (
                        <div 
                            key={index} 
                            /* FIXED WIDTHS: 
                               Mobile: 65% (gives a peek of the next card)
                               Desktop: 22% (shows 4.5 cards)
                               Max-width: 280px (prevents oversized cards on wide screens)
                            */
                            className="min-w-[85%] sm:min-w-[40%] lg:min-w-[19%] max-w-[200px] snap-center group relative"
                        >
                            {/* RANK BADGE - Scaled for smaller cards */}
                            <div className="absolute pt-5 -top-6 -left-4 z-20 pointer-events-none">
                                <div className="bg-[#bd002d] text-white w-10 h-10 md:w-10 md:h-10 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-white transform group-hover:rotate-12 transition-all">
                                    <span className="text-[5px] font-black leading-none opacity-60">RANK</span>
                                    <span className="text-sm md:text-lg font-black leading-none">{index + 1}</span>
                                </div>
                            </div>
                            
                            <div className='h-full px-1'>
                                <div 
                                    onClick={() => {
                                        const seed = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                        navigate(`/product/${item._id}/${seed}`); 
                                        window.scrollTo(0, 0); 
                                    }}
                                    className="flex flex-col h-full bg-white border border-gray-100 shadow-md cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl rounded-br-[40px] md:rounded-br-[50px] overflow-hidden"
                                > 
                                    {/* High Demand Tag */}
                                    {/* <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                                        <div className="w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_5px_#D4AF37]"></div>
                                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">High Demand</span>
                                    </div> */}
                
                                    {/* Image Container with Fixed Aspect Ratio */}
                                    <div className="p-1 aspect-square md:aspect-[4/5] bg-[#f8f8f8]">
                                        <div className="w-full h-full flex items-center justify-center rounded-br-[35px] md:rounded-br-[45px] overflow-hidden">
                                            <ProductItem 
                                                id={item._id} 
                                                _id={item._id}
                                                name={item.name} 
                                                image={item.image} 
                                                price={item.price} 
                                                marketPrice={item.marketPrice}
                                                category={item.category[0]}
                                                linkToFilter={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : null}
                </div>
            </div>

            {/* Verification Footer */}
            <div className="mt-10 flex flex-col items-center gap-4">
                <div className='h-10 w-[1px] bg-gradient-to-b from-[#bd002d] to-transparent'></div>
                
            </div>
        </div>
    </div>
)
}

export default BestSeller;