import React, { useContext, useEffect, useState, useMemo } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Zap, Award } from 'lucide-react' 
import { toast } from 'react-toastify'

const ProductItem = ({ id, _id, image, name, price, marketPrice, category, isPriorityMode = false }) => {
    
  const { formatPrice, currency, addToCart, wishlist, toggleWishlist } = useContext(ShopContext);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const productId = _id || id;
  
  // Calculate potential points (1 point per 100 units of currency)
  const potentialPoints = Math.floor(price / 10);

  const createSeoSlug = (text) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').trim();
  };

  const optimizedImage = useMemo(() => {
    const rawUrl = image && image[0] ? image[0] : "";
    if (!rawUrl || !rawUrl.includes('cloudinary')) return rawUrl;
    const watermarkTransform = 'l_Logo-5_go95bd,fl_relative,w_0.5,c_scale,o_70,a_-45';
    if (rawUrl.includes('f_auto,q_auto')) {
        return rawUrl.replace('/f_auto,q_auto/', `/f_auto,q_auto,${watermarkTransform}/`);
    }
    return rawUrl.replace('/upload/', `/upload/f_auto,q_auto,w_600,${watermarkTransform}/`);
  }, [image]);

  const handleNavigation = (e) => {
    if (isPriorityMode) return; 
    if (e) {
        e.preventDefault();
        e.stopPropagation(); 
    }
    const slug = createSeoSlug(name || "specimen");
    navigate(`/product/${productId}/${slug}`);
    window.scrollTo(0,0);
  };

  const onToggleWishlist = (e) => {
    e.stopPropagation(); 
    toggleWishlist(productId);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); 
    addToCart(productId, 1);
    toast.success("Added to Registry", { position: "bottom-right", autoClose: 1500 });
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation(); 
    await addToCart(productId, 1);
    navigate('/cart');
    window.scrollTo(0,0);
  };

  const symbol = currency === 'USD' ? '$' : '₹';

  return (
      <div className='relative block group select-none transition-all duration-700 w-full bg-white'>
          {/* IMAGE CONTAINER */}
          <div className='relative aspect-square overflow-hidden bg-[#FDFDFD] border border-black/[0.03] group-hover:border-[#BC002D]/40 transition-all duration-500' onClick={handleNavigation}>
              
              {/* POINTS BADGE */}
              <div className='absolute top-2 left-2 z-30 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10'>
                <Award size={10} className='text-amber-400' />
                <span className='text-[8px] font-black text-white uppercase tracking-tighter'>Earn {potentialPoints} PTS</span>
              </div>

              <button 
                onClick={onToggleWishlist}
                className='absolute top-2 right-2 z-30 p-1.5 bg-white/80 backdrop-blur-md rounded-full border border-black/10 hover:bg-[#BC002D] hover:text-white transition-all shadow-sm'
              >
                <Heart 
                  size={14} 
                  className={`${wishlist.includes(productId) ? 'fill-[#BC002D] text-[#BC002D]' : 'text-black'} transition-colors`} 
                />
              </button>

              <div className='w-full h-full flex items-center justify-center'>
                  <img 
                      onLoad={() => setIsLoaded(true)}
                      className={`z-10 w-full h-full object-contain p-2 transition-all duration-1000 ease-in-out ${
                        isLoaded ? 'opacity-100 scale-100 group-hover:scale-110' : 'opacity-0 scale-95'
                      }`} 
                      src={optimizedImage} 
                      alt={name} 
                  />
                  <div className='absolute inset-0 bg-[#BC002D]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>
              </div>
          </div>
          
          <div className='py-4 px-1'>
            <div className='flex flex-col gap-3'>
                <div className='flex justify-between items-start gap-4'>
                    <p className='text-[10px] lg:text-[13px] font-semibold tracking-tight text-gray-900 group-hover:text-[#BC002D] transition-colors leading-[1.2] line-clamp-3 min-h-[2.4em] overflow-hidden cursor-pointer' onClick={handleNavigation}>
                        {name || "Untitled Specimen"}
                    </p>
                  
                    <div className='flex flex-col items-end shrink-0 pt-0.5'>
                        {marketPrice > price && (
                            <p className='text-[8px] lg:text-[10px] font-bold text-gray-400 tabular-nums line-through decoration-[#BC002D]/50'>
                                {symbol}{formatPrice(marketPrice)}
                            </p>
                        )}
                        <p className='text-[11px] lg:text-[16px] font-black text-gray-900 tabular-nums leading-none'>
                            <span className='text-[9px] lg:text-[11px] mr-0.5 text-[#BC002D]'>{symbol}</span>
                            {formatPrice(price)}
                        </p>
                    </div>
                </div>

                {/* --- REWARD INFO --- */}
                {/* <div className='flex items-center justify-center py-1.5 border-y border-gray-50 bg-gray-50/50 rounded-lg'>
                   <p className='text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5'>
                     Purchase and earn <span className='text-[#BC002D] font-black'>{potentialPoints} Rewards Points</span>
                   </p>
                </div> */}

                {/* --- ACTION BUTTONS --- */}
                <div className='grid grid-cols-2 gap-2 mt-1'>
                    <button 
                        onClick={handleAddToCart}
                        className='flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-900 rounded-xl hover:bg-black hover:text-white transition-all duration-300'
                    >
                        <ShoppingCart size={13} />
                        <span className='text-[8px] lg:text-[9px] font-black uppercase tracking-widest'>Add</span>
                    </button>
                    <button 
                        onClick={handleBuyNow}
                        className='flex items-center justify-center gap-1.5 py-2.5 bg-black text-white rounded-xl hover:bg-[#BC002D] transition-all duration-300 shadow-md shadow-black/5'
                    >
                        <Zap size={13} className='fill-amber-400 text-amber-400 border-none' />
                        <span className='text-[8px] lg:text-[9px] font-black uppercase tracking-widest'>Buy</span>
                    </button>
                </div>
            </div>
          </div>
      </div>
  )
}

export default ProductItem;