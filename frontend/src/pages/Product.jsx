import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import { Heart, Loader2, Minus, Plus, PlayCircle, X, Zap, CreditCard, ShoppingBag, ChevronLeft, ChevronRight ,Calendar,Tag} from 'lucide-react';
import { ShieldCheck, Database, Globe, Layers, AlertCircle } from 'lucide-react';

import { toast } from 'react-toastify';
import axios from 'axios';

const Product = () => {
  const { productId } = useParams();
  const { products, addToCart, formatPrice, currency, navigate, wishlist, toggleWishlist, backendUrl } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [isMainLoaded, setIsMainLoaded] = useState(false);

  const getWatermarkedUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return url;

    //w->width,0->opacity , a--->angle 
    const watermarkTransform = 'l_Logo-5_tagline_yaxuag,fl_relative,w_0.7,c_scale,o_80,a_-45';
    return url.includes('f_auto,q_auto')
      ? url.replace('/f_auto,q_auto/', `/f_auto,q_auto,${watermarkTransform}/`)
      : url.replace('/upload/', `/upload/f_auto,q_auto,${watermarkTransform}/`);
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : null;
  };

  const fetchProductData = useCallback(async () => {
    try {
      // 1. Always attempt to get the freshest data from the Registry first
      const response = await axios.get(`${backendUrl}/api/product/single`, { 
        params: { productId } 
      });
  
      if (response.data.success) {
        setProductData(response.data.product);
      } else {
        // 2. If API fails, check local context as a fallback
        let item = products.find((item) => item._id === productId);
        if (item) {
          setProductData(item);
        } else {
          toast.error("Specimen not found in Registry");
          navigate('/collection');
        }
      }
    } catch (error) {
      console.error("Archive Sync Error:", error);
      // Fallback if the server is unreachable
      let item = products.find((item) => item._id === productId);
      if (item) setProductData(item);
    }
  }, [productId, products, backendUrl, navigate]);

  useEffect(() => {
    setProductData(false);
    setActiveIndex(0);
    setActiveVideo(false);
    fetchProductData();
  }, [productId, products, fetchProductData]);

  const allImages = productData ? productData.image.map(getWatermarkedUrl) : [];
  const hasVideo = productData && productData.youtubeUrl;
  const totalMedia = allImages.length + (hasVideo ? 1 : 0);
  const isVideoActive = hasVideo && activeIndex === allImages.length;

  const goTo = (index) => {
    setActiveIndex(index);
    setIsMainLoaded(false);
    if (hasVideo && index === allImages.length) {
      setActiveVideo(true);
    } else {
      setActiveVideo(false);
    }

  };
  const prev = () => goTo((activeIndex - 1 + totalMedia) % totalMedia);
  const next = () => goTo((activeIndex + 1) % totalMedia);

  const updateQuantity = (val) => {
    if (val < 1) return;
    if (productData && val > productData.stock) {
      toast.error(`Only ${productData.stock} specimens in registry`);
      return;
    }
    setQuantity(val);
  };

  const handleAddToCart = () => {
    addToCart(productData._id, quantity);
    setShowPopup(true);
    toast.success("Registry Updated", { position: "bottom-right", autoClose: 2000, hideProgressBar: true });
    setTimeout(() => setShowPopup(false), 4000);
  };

  const handleInstantCheckout = async () => {
    try {
      await addToCart(productData._id, quantity);
      navigate('/cart');
      window.scrollTo(0, 0);
    } catch (error) {
      toast.error("Checkout failed");
    }
  };

  const valuationSymbol = currency === 'USD' ? '$' : '₹';
  const discount = productData && productData.marketPrice > productData.price
    ? Math.round(100 - (productData.price / productData.marketPrice) * 100)
    : 0;

  if (!productData) return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-white'>
      <Loader2 size={40} className='text-[#BC002D] animate-spin mb-5' />
      <p className='text-[10px] font-black tracking-[0.6em] text-gray-300 uppercase'>Initializing Archive...</p>
    </div>
  );

  const potentialPoints = Math.floor(productData.price * quantity * 0.1);

  return (
    <div className='bg-white min-h-screen pt-4 md:pt-10 pb-16 select-none animate-fade-in relative overflow-x-hidden'>

      {/* ── ADD TO CART POPUP ──────────────────────────── */}
      {showPopup && (
        <div className='fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[90vw] max-w-sm animate-slide-down'>
          <div className='bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl p-4 flex items-center gap-4'>
            <div className='w-14 h-14 bg-[#F5F5F5] rounded-xl flex items-center justify-center p-2 shrink-0'>
              <img src={productData.image[0]} className='w-full h-full object-contain' alt="" />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0'></div>
                <p className='text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase'>Specimen Secured</p>
              </div>
              <p className='text-[11px] font-black text-gray-900 truncate'>{productData.name}</p>
              <p className='text-[9px] font-bold text-[#BC002D] mt-0.5'>Qty: {quantity} • Synced</p>
            </div>
            <button onClick={() => setShowPopup(false)} className='p-1.5 hover:bg-gray-100 rounded-full shrink-0 transition-colors text-gray-400'>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className='relative z-10 max-w-[1400px] mx-auto px-4 md:px-12 lg:px-16'>

        {/* ── MAIN PRODUCT AREA ─────────────────────────── */}
        {/* Changed flex-col to flex-col-reverse is NOT needed because image section is placed before info section in JSX */}
        <div className='flex flex-col lg:flex-row gap-10 lg:gap-16 items-start'>

          {/* ════════════════════════════════════════════
              IMAGE SECTION — NOW PLACED FIRST IN SOURCE
              ════════════════════════════════════════════ */}
          <div className='w-full lg:w-[48%] lg:sticky lg:top-28 flex flex-col gap-4'>

            {/* MAIN VIEWER */}
            <div className='relative w-full bg-[#F7F7F7] rounded-3xl overflow-hidden group shadow-sm' style={{ paddingBottom: '100%' }}>
              <div className='absolute inset-0 flex items-center justify-center p-4 md:p-10'>

                {isVideoActive && activeVideo ? (
                  <div className='absolute inset-0 bg-black z-20 animate-fade-in'>
                    <button onClick={() => { setActiveVideo(false); }} className='absolute top-4 right-4 z-30 bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-[#BC002D] transition-colors'>
                      <X size={18} />
                    </button>
                    <iframe className='w-full h-full' src={getEmbedUrl(productData.youtubeUrl)} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                  </div>
                ) : isVideoActive ? (
                  <div onClick={() => setActiveVideo(true)} className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 cursor-pointer group/vid'>
                    <div className='w-16 h-16 rounded-full bg-[#BC002D] flex items-center justify-center shadow-2xl group-hover/vid:scale-110 transition-transform'>
                      <PlayCircle size={32} className='text-white' />
                    </div>
                    <p className='text-[10px] font-black text-white/60 uppercase tracking-widest'>Play Archive Film</p>
                  </div>
                ) : (
                  <>
                    {!isMainLoaded && (
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='w-8 h-8 border-2 border-[#BC002D]/30 border-t-[#BC002D] rounded-full animate-spin'></div>
                      </div>
                    )}
                    <img
                      key={allImages[activeIndex]}
                      onLoad={() => setIsMainLoaded(true)}
                      className={`max-w-full max-h-full w-full h-full object-contain drop-shadow-xl transition-all duration-700 ${isMainLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'}`}
                      src={allImages[activeIndex]}
                      alt={productData.name}
                    />
                  </>
                )}

                <span className='absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#BC002D]/10 rounded-tl-lg pointer-events-none'></span>
                <span className='absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#BC002D]/10 rounded-tr-lg pointer-events-none'></span>
                <span className='absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#BC002D]/10 rounded-bl-lg pointer-events-none'></span>
                <span className='absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#BC002D]/10 rounded-br-lg pointer-events-none'></span>
              </div>

              {totalMedia > 1 && (
                <>
                  <button onClick={prev} className='absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white active:scale-95'>
                    <ChevronLeft size={16} className='text-gray-800' />
                  </button>
                  <button onClick={next} className='absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white active:scale-95'>
                    <ChevronRight size={16} className='text-gray-800' />
                  </button>
                </>
              )}

              {discount > 0 && (
                <div className='absolute top-4 left-4 bg-[#BC002D] text-white text-[9px] font-black px-2.5 py-1.5 rounded-full tracking-widest z-10'>
                  -{discount}% Discount
                </div>
              )}
            </div>

            <div className='flex items-center justify-center py-1.5 border-y border-gray-50 bg-gray-50/50 rounded-lg'>
                   <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5'>
                     Purchase and earn <span className='text-[#BC002D] font-black'>{potentialPoints} Rewards Points</span>
                   </p>
                </div>

            {/* THUMBNAIL STRIP */}
            {totalMedia > 1 && (
              <div className='flex gap-2.5 overflow-x-auto hide-scrollbar pb-1'>
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 transition-all duration-200 bg-[#F7F7F7] overflow-hidden p-1.5 ${activeIndex === i ? 'border-[#BC002D] shadow-md shadow-[#BC002D]/20' : 'border-transparent opacity-50 hover:opacity-90'}`}
                  >
                    <img src={img} className='w-full h-full object-contain' alt="" />
                  </button>
                ))}
                
                {/* VIDEO THUMBNAIL - Direct Play onClick */}
                {hasVideo && (
                  <button
                    onClick={() => goTo(allImages.length)}
                    className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col items-center justify-center gap-1 ${isVideoActive ? 'border-[#BC002D] bg-gray-900 shadow-md shadow-[#BC002D]/20' : 'border-transparent bg-gray-900 opacity-50 hover:opacity-90'}`}
                  >
                    <PlayCircle size={18} className='text-white' />
                    <span className='text-[7px] font-black text-white/70 uppercase'>Video</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════
              INFO SECTION
              ════════════════════════════════════════════ */}
          <div className='w-full lg:w-[52%] flex flex-col gap-0'>

            {/* Country + Year tags */}
            <div className='flex items-center gap-2.5 flex-wrap mb-5'>
              <span className='text-[#BC002D] text-[9px] font-black tracking-[0.4em] uppercase px-3.5 py-1.5 bg-[#BC002D]/8 rounded-full border border-[#BC002D]/10'>
                {productData.country}
              </span>
              <span className='text-gray-400 text-[9px] font-bold tracking-[0.4em] uppercase px-3.5 py-1.5 bg-gray-50 rounded-full'>
                {productData.year} Archive
              </span>
            </div>

            {/* Product Name */}
            <h1 className='text-xl md:text-2xl font-semibold lg:text-2xl font-black text-gray-900 leading-tight mb-6 capitalize tracking-tight'>
              {productData.name}
            </h1>

            {/* Price Block */}
            <div className='flex items-end gap-4 mb-6 pb-6 border-b border-gray-100'>
              <div className='flex items-baseline gap-1.5'>
                <span className='text-2xl font-serif text-[#BC002D] leading-none'>{valuationSymbol}</span>
                <p className='text-4xl md:text-4xl font-black text-gray-900 tracking-tighter tabular-nums leading-none'>
                  {String(formatPrice(productData.price * quantity)).replace(/[₹$]/g, '').trim()}
                </p>
              </div>
              {productData.marketPrice > productData.price && (
                <div className='flex items-baseline gap-1 mb-1 opacity-40'>
                  <span className='text-sm font-serif text-gray-500'>{valuationSymbol}</span>
                  <p className='text-xl font-bold text-gray-500 line-through tabular-nums'>
                    {String(formatPrice(productData.marketPrice * quantity)).replace(/[₹$]/g, '').trim()}
                  </p>
                </div>
              )}
            </div>

            {/* Condition + Availability */}



<div className='grid grid-cols-2 gap-4 mb-6'>
    {/* CONDITION */}
    {/* CONDITION BLOCK */}
<div className='bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
    <div className='flex items-center gap-2 mb-1.5'>
        <ShieldCheck size={12} className='text-[#BC002D]' />
        <p className='text-[8px] font-black text-[#BC002D] tracking-widest uppercase'>Condition</p>
    </div>
    {/* FIX: Bind strictly to the database value */}
    <p className='text-[11px] font-black text-gray-900'>
      {productData.condition}
    </p>
</div>

    {/* STOCK */}
    <div className='bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
        <div className='flex items-center gap-2 mb-1.5'>
            {productData.stock > 0 ? (
                <Database size={12} className='text-[#BC002D]' />
            ) : (
                <AlertCircle size={12} className='text-[#BC002D]' />
            )}
            <p className='text-[8px] font-black text-[#BC002D] tracking-widest uppercase'>Stock</p>
        </div>
        <p className={`text-[11px] font-black ${productData.stock < 5 ? 'text-[#BC002D]' : 'text-green-600'}`}>
            {productData.stock > 0 ? `${productData.stock} Specimens` : 'Exhausted / Sold'}
        </p>
    </div>

    {/* ORIGIN */}
    <div className='bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
        <div className='flex items-center gap-2 mb-1.5'>
            <Globe size={12} className='text-[#BC002D]' />
            <p className='text-[8px] font-black text-[#BC002D] tracking-widest uppercase'>Origin</p>
        </div>
        <p className='text-[11px] font-black text-gray-900 capitalize'>{productData.country || 'India'}</p>
    </div>

    {/* PRODUCED COUNT */}
    <div className='bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
        <div className='flex items-center gap-2 mb-1.5'>
            <Layers size={12} className='text-[#BC002D]' />
            <p className='text-[8px] font-black text-[#BC002D] tracking-widest uppercase'>Produced Count</p>
        </div>
        <p className='text-[11px] font-black text-gray-900'>{productData.producedCount || 'Limited Edition'}</p>
    </div>
    <div className='bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
        <div className='flex items-center gap-2 mb-1.5'>
            <Calendar size={12} className='text-[#BC002D]' />
            <p className='text-[8px] font-black text-[#BC002D] tracking-widest uppercase'>Release Date</p>
        </div>
        <p className='text-[11px] font-black text-gray-900'>
            {productData.releaseDate || 'Historical Issue'}
        </p>
    </div>

    {/* TOP CATEGORIES */}
    <div className='bg-gray-50 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
        <div className='flex items-center gap-2 mb-1.5'>
            <Tag size={12} className='text-[#BC002D]' />
            <p className='text-[8px] font-black text-[#BC002D] tracking-widest uppercase'>Classifications</p>
        </div>
        <div className='flex flex-wrap gap-1'>
            {productData.category && productData.category.length > 0 ? (
                productData.category.slice(0, 3).map((cat, index) => (
                    <span key={index} className='text-[10px] font-black text-gray-900 bg-gray-200/50 px-1.5 py-0.5 rounded-md capitalize'>
                        {cat}
                    </span>
                ))
            ) : (
                <p className='text-[11px] font-black text-gray-900'>General</p>
            )}
        </div>
    </div>
</div>

            {/* Specs */}


            {/* Description */}
            <div className='mb-8'>
  <p className='text-[9px] font-black text-[#BC002D] tracking-[0.3em] uppercase mb-3'>Description</p>
  <p className='text-[13px] text-gray-800 leading-relaxed font-medium'>
    {productData.description.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ))}
  </p>
  {/* <p className='text-[13px] text-gray-800 leading-relaxed font-medium'>
    Please Note that due to multiple listing we can not specify the place of cancellation ,also the position of stamp on FDC and Cancellation may differ from the image .Kindly treat the image as reference only not actual product 
  </p> */}
</div>


            

            {/* Quantity */}
            <div className='flex items-center gap-5 mb-6'>
              <p className='text-[9px] font-black text-gray-900 tracking-widest uppercase'>Volume:</p>
              <div className='flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden'>
                <button onClick={() => updateQuantity(quantity - 1)} className='px-4 py-3 text-gray-500 hover:text-[#BC002D] hover:bg-gray-100 transition-colors active:scale-90'>
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className='w-10 text-center text-sm font-black text-gray-900 tabular-nums'>{quantity}</span>
                <button onClick={() => updateQuantity(quantity + 1)} className='px-4 py-3 text-gray-500 hover:text-[#BC002D] hover:bg-gray-100 transition-colors active:scale-90'>
                  <Plus size={13} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 items-stretch'>
              {productData.stock > 0 ? (
                <>
                  <div className='flex gap-3 flex-1'>
                    <button
                        onClick={() => toggleWishlist(productData._id)}
                        className='w-14 h-14 shrink-0 border border-gray-100 rounded-2xl flex items-center justify-center hover:border-[#BC002D]/30 hover:bg-[#BC002D]/5 transition-all active:scale-95'
                    >
                        <Heart size={20} className={wishlist.includes(productData._id) ? 'fill-[#BC002D] text-[#BC002D]' : 'text-gray-300'} />
                    </button>
                    <button
                        onClick={handleAddToCart}
                        className='flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[9px] font-black tracking-[0.4em] uppercase hover:bg-black transition-all active:scale-[0.98] shadow-lg'
                    >
                        Add to Cart
                    </button>
                  </div>
                  <button
                    onClick={handleInstantCheckout}
                    className='flex-1 bg-[#BC002D] text-white py-4 rounded-2xl text-[9px] font-black tracking-[0.4em] uppercase hover:bg-[#a00025] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#BC002D]/25'
                  >
                    <Zap size={14} fill="white" />
                    Buy Now
                  </button>
                </>
              ) : (
                <button disabled className='w-full bg-gray-100 text-gray-400 py-5 rounded-2xl text-[10px] font-black tracking-[0.5em] uppercase cursor-not-allowed'>
                  Archive Fully Acquired
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RELATED PRODUCTS ──────────────────────────── */}
        <div className='mt-24 md:mt-32 pt-16 border-t border-gray-100'>
          <RelatedProducts category={productData.category[0]} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default Product;