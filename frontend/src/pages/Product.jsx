import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import { Heart, Loader2, Minus, Plus, PlayCircle, X, Zap, CreditCard, ShoppingBag, ChevronLeft, ChevronRight ,Calendar,Tag} from 'lucide-react';
import { ShieldCheck, Database, Globe, Layers, AlertCircle } from 'lucide-react';
import AIHistorian from '../components/AIhistorian';

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
    const watermarkTransform = 'l_Logo-5_asqxkr,fl_relative,w_0.7,c_scale,o_80,a_-45';
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
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });

const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    // Calculate percentage position of mouse relative to image
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y, show: true });
};

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

  const formatDate = (dateString) => {
    if (!dateString || dateString === "Historical Issue") return dateString;

    // Split the dd/mm/yyyy string
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;

    const day = parts[0];
    const monthIndex = parseInt(parts[1]) - 1;
    const year = parts[2];

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return `${day} ${months[monthIndex]} ${year}`;
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
    <div className='bg-white min-h-screen pt-2 md:pt-4 pb-16 select-none animate-fade-in relative overflow-x-hidden'>

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
          <div className='w-full lg:w-[38%] md:w-[70%] lg:sticky lg:top-18 flex flex-col gap-4'>

            {/* MAIN VIEWER */}
            <div className='relative w-full bg-[#F7F7F7] rounded-3xl overflow-hidden group shadow-sm' style={{ 
      /* Mobile/Tablet: 16:10 or 4:3 Ratio | Desktop: 1:1 Square */
      aspectRatio: window.innerWidth < 1024 ? '16/10' : '1/1' 
    }}>
              <div className='absolute inset-0 flex items-center justify-center p-2 md:p-3'>

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
                  

// ... inside your return/render block

<div 
    className="relative w-full h-full  overflow-hidden cursor-zoom-in group "
    onMouseMove={handleMouseMove}
    onMouseLeave={() => setZoomPos({ ...zoomPos, show: false })}
>
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

    {/* MAGNIFIER LENS */}
    {isMainLoaded && zoomPos.show && (
        <div 
            className="pointer-events-none absolute hidden lg:block border-2 border-white/50 shadow-2xl rounded-full"
            style={{
                width: '200px',
                height: '200px',
                left: `${zoomPos.x}%`,
                top: `${zoomPos.y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundImage: `url(${allImages[activeIndex]})`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundSize: '600%', // Adjust this for zoom level (e.g., 400% = 4x zoom)
                backgroundRepeat: 'no-repeat',
                zIndex: 20
            }}
        />
    )}
</div>
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
                    className={`shrink-0 w-16 h-16 md:w-13 md:h-13 rounded-2xl border-2 transition-all duration-200 bg-[#F7F7F7] overflow-hidden p-1.5 ${activeIndex === i ? 'border-[#BC002D] shadow-md shadow-[#BC002D]/20' : 'border-transparent opacity-50 hover:opacity-90'}`}
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

{/* 1. Header Tags (Matching "Reveal Radiant Eyes | HOT") */}

{/* 2. Product Name & Description */}
<div className='flex flex-col justify-between items-start gap-2 mb-6'>
  <div className='flex-1'>
    <h1 className='text-2xl md:text-3xl font-semibold text-gray-900 leading-tight tracking-tight mb-4'>
      {productData.name}
    </h1>
    <p className='text-[13px] text-gray-800 leading-relaxed font-medium'>
      {productData.description}
    </p>
    <p className='text-[13px] text-gray-800 leading-relaxed font-medium'>
      {productData.description2}
    </p>
  </div>
</div>

{/* 3. Pricing Block (Moved below Description) */}
<div className='flex flex-col items-start mb-8'>
  <div className='flex items-baseline gap-3'>
    {/* Current Price */}
    <span className='text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter'>
      {valuationSymbol}{String(formatPrice(productData.price * quantity)).replace(/[₹$]/g, '').trim()}
    </span>
    
    {/* Market Price Reference */}
    {productData.marketPrice > productData.price && (
      <span className='text-sm font-bold text-gray-300 line-through'>
        {valuationSymbol}{String(formatPrice(productData.marketPrice * quantity)).replace(/[₹$]/g, '').trim()}
      </span>
    )}

    {/* Savings Badge */}
    {discount > 0 && (
      <span className='text-[11px] font-black text-[#BC002D] uppercase tracking-widest bg-[#BC002D]/5 px-2 py-1 rounded-md'>
        SAVE {discount}%
      </span>
    )}
  </div>
</div>

{/* 6. Classification Grid */}
<div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10'>
  {/* CONDITION */}
  <div className='flex flex-col gap-2 p-4 bg-[#BC002D]/5 rounded-2xl border border-[#BC002D]/10 hover:bg-[#BC002D]/8 transition-all'>
    <div className='flex items-center gap-2'>
      <ShieldCheck size={14} className='text-[#BC002D]' strokeWidth={2.5} />
      <span className='text-[9px] font-black text-[#BC002D] uppercase tracking-widest'>Condition</span>
    </div>
    <span className='text-[11px] font-black text-gray-900 leading-none ml-[22px]'>
      {productData.condition}
    </span>
  </div>

  {/* AVAILABILITY */}
  <div className='flex flex-col gap-2 p-4 bg-[#BC002D]/5 rounded-2xl border border-[#BC002D]/10 hover:bg-[#BC002D]/8 transition-all'>
    <div className='flex items-center gap-2'>
      <Database size={14} className='text-[#BC002D]' strokeWidth={2.5} />
      <span className='text-[9px] font-black text-[#BC002D] uppercase tracking-widest'>Availability</span>
    </div>
    <span className='text-[11px] font-black text-gray-900 leading-none ml-[22px]'>
      {productData.stock} Quantity left
    </span>
  </div>

  {/* RELEASE DATE */}
  <div className='flex flex-col gap-2 p-4 bg-[#BC002D]/5 rounded-2xl border border-[#BC002D]/10 hover:bg-[#BC002D]/8 transition-all'>
    <div className='flex items-center gap-2'>
      <Calendar size={14} className='text-[#BC002D]' strokeWidth={2.5} />
      <span className='text-[9px] font-black text-[#BC002D] uppercase tracking-widest'>Release Date</span>
    </div>
    <span className='text-[11px] font-black text-gray-900 leading-none ml-[22px]'>
    {productData.releaseDate 
        ? formatDate(productData.releaseDate) 
        : "Historical Issue"}
</span>
  </div>

  {/* PRODUCED COUNT */}
  <div className='flex flex-col gap-2 p-4 bg-[#BC002D]/5 rounded-2xl border border-[#BC002D]/10 hover:bg-[#BC002D]/8 transition-all'>
    <div className='flex items-center gap-2'>
      <Layers size={14} className='text-[#BC002D]' strokeWidth={2.5} />
      <span className='text-[9px] font-black text-[#BC002D] uppercase tracking-widest'>Produced</span>
    </div>
    <span className='text-[11px] font-black text-gray-900 leading-none ml-[22px]'>
      {productData.producedCount || 'Limited'} Units
    </span>
  </div>

  {/* VARIETY / CLASSIFICATION */}
  <div className='flex flex-col gap-2 p-4 bg-[#BC002D]/5 rounded-2xl border border-[#BC002D]/10 hover:bg-[#BC002D]/8 transition-all'>
    <div className='flex items-center gap-2'>
      <Tag size={14} className='text-[#BC002D]' strokeWidth={2.5} />
      <span className='text-[9px] font-black text-[#BC002D] uppercase tracking-widest'>Variety</span>
    </div>
    <div className='flex flex-wrap gap-1 ml-[22px]'>
      {productData.category && productData.category.slice(0, 2).map((cat, i) => (
        <span key={i} className='text-[10px] font-black text-gray-900 capitalize truncate'>
          {cat}{i < productData.category.slice(0, 2).length - 1 ? ',' : ''}
        </span>
      ))}
    </div>
  </div>

  {/* ORIGIN */}
  <div className='flex flex-col gap-2 p-4 bg-[#BC002D]/5 rounded-2xl border border-[#BC002D]/10 hover:bg-[#BC002D]/8 transition-all'>
    <div className='flex items-center gap-2'>
      <Globe size={14} className='text-[#BC002D]' strokeWidth={2.5} />
      <span className='text-[9px] font-black text-[#BC002D] uppercase tracking-widest'>Origin</span>
    </div>
    <span className='text-[11px] font-black text-gray-900 leading-none capitalize ml-[22px]'>
      {productData.country}
    </span>
  </div>
</div>

{/* 7. Action Buttons */}
<div className='flex gap-3'>
  {productData.stock > 0 ? (
    <>
      <button
        onClick={handleInstantCheckout}
        className='w-full bg-[#BC002D] text-white py-5 rounded-2xl text-[11px] font-black tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3'
      >
        <Zap size={14} fill="white" />
        Buy It Now
      </button>
      <button
        onClick={handleAddToCart}
        className='w-full border-2 border-gray-100 text-gray-900 py-4 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase hover:bg-gray-50 transition-all'
      >
        Add to Cart
      </button>
    </>
  ) : (
    <button
      disabled
      className='w-full bg-gray-100 text-gray-400 py-5 rounded-2xl text-[11px] font-black tracking-[0.3em] uppercase flex items-center justify-center gap-3 cursor-not-allowed border border-gray-200'
    >
      <X size={14} />
      Sold Out
    </button>
  )}

  <button
    onClick={() => toggleWishlist(productData._id)}
    className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-center shadow-sm
    ${wishlist.includes(productData._id)
        ? 'bg-[#BC002D]/5 border-[#BC002D]/20 text-[#BC002D]'
        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
      }`}
    title="Secure to Vault"
  >
    <Heart
      size={20}
      fill={wishlist.includes(productData._id) ? "#BC002D" : "none"}
      className={wishlist.includes(productData._id) ? "animate-pulse" : ""}
    />
  </button>
</div>

{/* Interactive & Resource Section */}
<div className='flex flex-col md:flex-row gap-8 items-start mt-10 pt-8 border-t border-gray-100'>
  {productData.blogLink && (
    <div className='w-full md:w-[350px] shrink-0'>
      <div className='bg-gray-50/50 rounded-3xl p-6 border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 group/blog'>
        <p className='text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase mb-6 flex items-center gap-2'>
          <span className='w-1 h-1 bg-[#BC002D] rounded-full'></span>
          Philatelic Insight
        </p>
        <a
          href={productData.blogLink}
          target="_blank"
          rel="noopener noreferrer"
          className='flex items-center justify-between w-full px-5 py-4 bg-[#BC002D] text-white rounded-2xl shadow-lg shadow-red-100 hover:bg-black transition-all group'
        >
          <div className='flex flex-col items-start'>
            <span className='text-[10px] font-black uppercase tracking-widest'>Read Full Blog</span>
            <span className='text-[8px] opacity-70 font-bold uppercase tracking-tighter'>Explore Stamp's History</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:translate-x-1 transition-transform"
          >
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )}

  <div className='w-full md:flex-1'>
    <AIHistorian
      productId={productData._id}
      productName={productData.name}
    />
  </div>
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