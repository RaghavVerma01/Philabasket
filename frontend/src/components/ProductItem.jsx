import React, { useContext, useEffect, useState, useMemo } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Zap, Award, Ban } from 'lucide-react' 
import { toast } from 'react-toastify'

const ProductItem = ({ id, _id, image, name, price, marketPrice, category, stock, isPriorityMode = false }) => {
    
  const { formatPrice, currency, addToCart, wishlist, toggleWishlist,userData } = useContext(ShopContext);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const productId = _id || id;
  
  // Logic check for availability
  const isOutOfStock = stock <= 0;
  

  const potentialPoints = useMemo(() => {
    const userTier = userData?.tier || 'Silver';
    let multiplier = 0.10; // Default Silver

    if (userTier === 'Gold') multiplier = 0.30;
    if (userTier === 'Platinum') multiplier = 0.50;

    return Math.floor(price * multiplier);
  }, [price, userData?.tier]);

  const createSeoSlug = (text) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').trim();
  };

  const optimizedImage = useMemo(() => {
    const rawUrl = image && image[0] ? image[0] : "";
    if (!rawUrl || !rawUrl.includes('cloudinary')) return rawUrl;

    //
    const watermarkTransform = 'l_Logo-5_go95bd,fl_relative,w_0.7,c_scale,o_90,a_-45';
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
    if (isOutOfStock) return; // Prevention logic
    addToCart(productId, 1);
    // toast.success("Added to Registry", { position: "bottom-right", autoClose: 1500 });
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation(); 
    if (isOutOfStock) return;
    await addToCart(productId, 1);
    navigate('/cart');
    window.scrollTo(0,0);
  };

  const symbol = currency === 'USD' ? '$' : '₹';

  return (
      <div className={`relative block group select-none transition-all duration-700 w-full bg-white ${isOutOfStock ? 'opacity-80' : ''}`}>
          {/* IMAGE CONTAINER */}
          <div className='relative aspect-square overflow-hidden bg-[#FDFDFD] border border-black/[0.03] group-hover:border-[#BC002D]/40 transition-all duration-500' onClick={handleNavigation}>
              
              {/* POINTS BADGE */}
              {!isOutOfStock && (
                <div className='absolute top-2 left-2 z-30 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10'>
                  <Award size={10} className='text-amber-400' />
                  <span className='text-[8px] font-black text-white uppercase tracking-tighter'>Earn {potentialPoints} PTS</span>
                </div>
              )}

              {/* SOLD OUT OVERLAY */}
              {isOutOfStock && (
                <div className='absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center'>
                    <span className='bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-xl'>Sold Out</span>
                </div>
              )}

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
                        isLoaded ? 'opacity-100 scale-100 group-hover:scale-110' : 'opacity-90 scale-95'
                      } ${isOutOfStock ? '' : ''}`} 
                      src={optimizedImage} 
                      alt={name} 
                  />
              </div>
          </div>
          
          <div className='py-4 px-1'>
            <div className='flex flex-col gap-2'>
                {/* NAME - FULL WIDTH */}
                <p className='text-[10px] lg:text-[13px] font-semibold tracking-tight text-gray-900 group-hover:text-[#BC002D] transition-colors leading-[1.2] line-clamp-3 min-h-[2.4em] overflow-hidden cursor-pointer w-full' onClick={handleNavigation}>
                    {name || "Untitled Specimen"}
                </p>

                {/* PRICE - MOVED BELOW NAME */}
                <div className='flex items-center gap-3'>
                    <p className='text-[12px] lg:text-[18px] font-black text-gray-900 tabular-nums leading-none'>
                        <span className='text-[10px] lg:text-[12px] mr-0.5 text-[#BC002D]'>{symbol}</span>
                        {formatPrice(price)}
                    </p>
                    {marketPrice > price && (
                        <p className='text-[9px] lg:text-[11px] font-bold text-gray-400 tabular-nums line-through decoration-[#BC002D]/50'>
                            {symbol}{formatPrice(marketPrice)}
                        </p>
                    )}
                </div>

                {/* --- ACTION BUTTONS --- */}
                <div className='mt-2'> {/* Removed grid-cols-2 to allow full width */}
    {isOutOfStock ? (
        /* SOLD OUT STATE */
        <button 
            disabled
            className='w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed border border-gray-200'
        >
            <Ban size={13} />
            <span className='text-[9px] font-black uppercase tracking-widest'>Sold Out</span>
        </button>
    ) : (
        /* ACTIVE STATE - Full Width Add to Cart */
        <button 
            onClick={handleAddToCart}
            className='w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl hover:bg-[#BC002D] transition-all duration-300 shadow-md shadow-black/5'
        >
            <ShoppingCart size={14} />
            <span className='text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]'>
                Add to Cart
            </span>
        </button>
    )}
</div>
            </div>
          </div>
      </div>
  )
}

export default ProductItem;