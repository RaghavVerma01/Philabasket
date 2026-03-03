import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { assets } from '../assets/assets';
import { Trash2, Zap, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Wishlist = () => {
    const { products, wishlist, toggleWishlist, addToCart } = useContext(ShopContext);
    const navigate = useNavigate();
    
    // Filter products to show only saved specimens
    const wishlistProducts = products.filter(item => wishlist.includes(item._id));

    const handleBuyNow = async (id) => {
        await addToCart(id, 1);
        navigate('/cart');
        window.scroll(0,0);
    };

    return (
        <div className='pt-24 px-6 md:px-16 lg:px-24 min-h-screen bg-white select-none animate-fade-in'>
            
            {/* --- BACKGROUND DECOR --- */}
            <div className="absolute -left-[10vw] top-0 h-[50vh] w-[40vw] bg-[#BC002D]/5 rounded-br-[600px] pointer-events-none z-0"></div>

            <div className='relative z-10 text-2xl mb-16'>
                <Title text1={'MY'} text2={'WISHLIST'} />
                <div className='flex items-center gap-3 mt-2'>
                    <div className='w-1 h-1 bg-[#BC002D] rounded-full animate-pulse'></div>
                    <p className='text-[10px] tracking-[0.5em] text-gray-800 uppercase font-black'>
                        {wishlistProducts.length} Specimens secured in vault
                    </p>
                </div>
            </div>

            {/* --- WISHLIST GRID --- */}
            <div className='relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16 mt-10'>
                {wishlistProducts.map((item, index) => (
                    <div key={index} className='flex flex-col group bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700 rounded-br-[40px] lg:rounded-br-[60px] overflow-hidden h-full'>
                        
                        {/* --- PRODUCT CONTENT --- */}
                        <div className='flex-grow relative'>
                            {/* --- REMOVE ACTION (Overlay) --- */}
                            {/* <button 
                                onClick={() => {
                                    toggleWishlist(item._id);
                                    toast.info("Specimen removed from archive");
                                }}
                                className='absolute top-4 right-4 z-30 p-2 bg-white/80 backdrop-blur-md rounded-full border border-black/5 text-gray-400 hover:text-[#BC002D] hover:bg-white transition-all shadow-sm'
                                title="Purge from Archive"
                            >
                                <Trash2 size={14} />
                            </button> */}

                            <ProductItem 
                                id={item._id} 
                                _id={item._id}
                                image={item.image} 
                                name={item.name} 
                                price={item.price} 
                                marketPrice={item.marketPrice}
                            />
                        </div>

                        {/* --- FIXED ACTIONS SECTION --- */}

                    </div>
                ))}
            </div>

            {/* --- EMPTY STATE --- */}
            {wishlistProducts.length === 0 && (
                <div className='relative z-10 flex flex-col items-center justify-center py-48 text-center'>
                    <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-8 border border-gray-100'>
                        <img src={assets.parcel_icon} className='w-8 opacity-20 grayscale' alt="" />
                    </div>
                    <p className='text-[11px] tracking-[0.6em] text-gray-400 uppercase font-black'>
                        Your private vault is currently empty
                    </p>
                    <button 
                        onClick={() => navigate('/collection')}
                        className='mt-10 px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-[#BC002D] transition-all shadow-xl'
                    >
                        Explore the Gallery
                    </button>
                </div>
            )}
        </div>
    );
};

export default Wishlist;