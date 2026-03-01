import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'react-toastify';

const BestSeller = () => {
    const { products, addToCart } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // --- UPDATED LOGIC: Filter by the 'bestseller' boolean flag ---
        // 1. Filter products where bestseller property is true
        // 2. Sort by date so the most recently added bestsellers appear first
        // 3. Slice to take the top 4 for the grid
        const curatedBestsellers = products
            .filter(item => item.bestseller === true || item.bestseller === "true")
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);
        
        setBestSeller(curatedBestsellers);
    }, [products]);

    // --- LOGISTICS HANDLERS ---
    const onAddToCart = (e, productId) => {
        e.stopPropagation();
        addToCart(productId, 1);
        toast.success("Added to Registry", { position: "bottom-right", autoClose: 1000 });
    };

    const onBuyNow = async (e, productId) => {
        e.stopPropagation();
        await addToCart(productId, 1);
        navigate('/cart');
        window.scrollTo(0, 0);
    };

    return (
        <div className='bg-white py-22 md:py-32 lg:mt-[-14vh] overflow-hidden select-none relative border-t border-black/[0.03]'>
            
            {/* Background Decorative Accent */}
            <div className="absolute -right-[15vw] top-[20%] h-[70%] w-[45%] bg-[#bd002d]/5 rounded-l-[600px] pointer-events-none"></div>

            <div className='px-6 md:px-16 lg:px-24 relative z-10'>
                
                {/* Section Header */}
                <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8'>
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="h-[1px] w-12 bg-[#BC002D]"></span>
                            <span className="text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black">
                                Acquisition Rank
                            </span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-bold text-gray-900 tracking-tighter leading-none">
                            TOP <br />
                            <span className="text-[#bd002d]">SELLING.</span>
                        </h2>
                    </div>
                    
                    <div className="hidden md:block text-right max-w-xs">
                        <p className='text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed'>
                            The top specimens defining the <span className='text-black'>PhilaBasket Legacy</span>, manually curated for their historical significance.
                        </p>
                    </div>
                </div>

                {/* Ranked Product Grid */}
                <div className='flex overflow-x-auto gap-6 md:gap-x-12 snap-x snap-mandatory mobile-scrollbar lg:grid lg:grid-cols-5 lg:gap-y-20 lg:overflow-visible pb-10 lg:pb-0 px-2'>
                    {
                        bestSeller.length > 0 ? bestSeller.map((item, index) => (
                            <div 
                                key={index} 
                                className="min-w-[85%] sm:min-w-[45vw] lg:min-w-0 snap-center group relative transition-all duration-700"
                            >
                                {/* Sovereign Rank Badge */}
                                <div className="absolute -top-2 -left-2 z-20 pointer-events-none">
                                    <div className="bg-[#bd002d] text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500 border-2 border-white">
                                        <span className="text-[6px] md:text-[8px] font-black leading-none opacity-60">RANK</span>
                                        <span className="text-sm md:text-xl font-black leading-none">0{index + 1}</span>
                                    </div>
                                </div>
                                
                                <div className='pt-4 md:pt-6 h-full'>
                                    <div 
                                        onClick={() => {
                                            const seed = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                            navigate(`/product/${item._id}/${seed}`); 
                                            window.scrollTo(0, 0); 
                                        }}
                                        className="flex flex-col h-full relative bg-white border border-gray-100 shadow-lg cursor-pointer transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-2xl group-hover:border-[#bd002d]/20 overflow-hidden rounded-br-[40px] md:rounded-br-[60px]"
                                    > 
                                        {/* High Demand Status */}
                                        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                                            <div className="w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_5px_#D4AF37]"></div>
                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">High Demand</span>
                                        </div>
                    
                                        <div className="flex-grow p-1 md:p-3">
                                            <div className="w-full h-full bg-[#f8f8f8] flex items-center justify-center p-1 md:p-4 rounded-br-[35px] md:rounded-br-[40px]">
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

                                        {/* <div className="flex flex-col gap-2 p-3 lg:p-4 bg-white border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={(e) => onAddToCart(e, item._id)} className="bg-gray-50 text-gray-900 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all duration-300">
                                                    <ShoppingCart size={14} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Add</span>
                                                </button>
                                                <button onClick={(e) => onBuyNow(e, item._id)} className="bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#bd002d] transition-all duration-300 shadow-lg shadow-black/10">
                                                    <Zap size={14} className="fill-amber-400 text-amber-400" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Buy Now</span>
                                                </button>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-4 py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">No Specimens Ranked for Bestseller Status</p>
                            </div>
                        )
                    }
                </div>

                {/* Footer Hallmark */}
                <div className="mt-16 md:mt-32 flex flex-col items-center gap-6">
                    <div className='h-12 md:h-16 w-[1px] bg-gradient-to-b from-[#bd002d] to-transparent'></div>
                    <p className='text-[8px] tracking-[0.8em] text-black/20 uppercase font-black'>
                        Verified Philatelic Provenance
                    </p>
                </div>
            </div>

            {/* Custom Styles remains same */}
            <style dangerouslySetInnerHTML={{ __html: `
                .mobile-scrollbar::-webkit-scrollbar { display: none; }
                @media (max-width: 1023px) {
                    .mobile-scrollbar::-webkit-scrollbar { display: block; height: 3px; }
                    .mobile-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; margin: 0 10vw; border-radius: 10px; }
                    .mobile-scrollbar::-webkit-scrollbar-thumb { background: #bd002d; border-radius: 10px; }
                }
            `}} />
        </div>
    )
}

export default BestSeller;