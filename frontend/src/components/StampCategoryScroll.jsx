import React, { useRef, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

const StampCategoryScroll = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  
  const { products, backendUrl } = useContext(ShopContext);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const DEFAULT_IMAGE = "https://res.cloudinary.com/dvsdithxh/image/upload/v1770344955/Logo-5_nqnyl4.png";

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/category/list');
        if (response.data.success) {
          const featured = response.data.categories.filter(cat => cat.featured);
          setFeaturedCategories(featured);
        }
      } catch (error) {
        console.error("Registry Sync Error:", error);
      }
    };
    if (backendUrl) fetchFeatured();
  }, [backendUrl]);

  /**
   * Auto-Fallback Logic: 
   * Runs only if the Admin has not manually set an image for the category.
   */
  const getAutoFallbackImage = (categoryName) => {
    if (!products || !products.length) return DEFAULT_IMAGE;
    const searchName = categoryName.trim().toLowerCase();

    const matchingProduct = products.find(item => {
        if (!item.category) return false;
        const productCats = Array.isArray(item.category) 
            ? item.category.join(' ').toLowerCase() 
            : String(item.category).toLowerCase();

        return productCats.includes(searchName) && 
               item.image && item.image.some(img => img && img !== DEFAULT_IMAGE);
    });

    if (matchingProduct) {
        const realSpecimen = matchingProduct.image.find(img => img && img !== DEFAULT_IMAGE);
        return realSpecimen || DEFAULT_IMAGE;
    }
    return DEFAULT_IMAGE;
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 400 : scrollLeft + 400;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/collection?category=${encodeURIComponent(categoryName)}`);
    window.scrollTo(0, 0);
  };

  if (featuredCategories.length === 0) return null;

  return (
    <div className='my-5'>
        <div className='px-4 sm:px-[5vw] mb-4'>
            <h2 className='text-xl font-bold text-gray-800 uppercase tracking-tighter'>
                Featured <span className='text-[#BC002D]'>Specimens</span>
            </h2>
        </div>

      <div className='relative group mt-5'>
        {/* Navigation Arrows */}
        <button onClick={() => scroll('left')} className='absolute left-2 sm:left-5 top-1/2 z-20 bg-white/90 p-2 rounded-full shadow-lg hidden group-hover:flex items-center justify-center -translate-y-1/2 border border-gray-100 hover:bg-black hover:invert transition-all'>
          <img src={assets.dropdown_icon} className='w-3 rotate-180' alt="prev" />
        </button>

        <div ref={scrollRef} className='flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar px-4 sm:px-[5vw] py-4 scroll-smooth'>
          {featuredCategories.map((cat, index) => {
            
            // PRIORITY 1: Manual Admin-defined image
            // PRIORITY 2: Auto-detected specimen from product list
            // PRIORITY 3: Default Logo
            const displayImage = cat.image || getAutoFallbackImage(cat.name);
            
            return (
              <div 
                key={cat._id || index} 
                onClick={() => handleCategoryClick(cat.name)}
                className='flex flex-col items-center gap-3 cursor-pointer group/item shrink-0'
              >
                <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[3px] border-[#BC002D] p-1 transition-all duration-300 group-hover/item:shadow-xl group-hover/item:scale-105'>
                  <div className='w-full h-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center'>
                    <img 
                      src={displayImage} 
                      alt={cat.name} 
                      className='w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110'
                      onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                    />
                  </div>
                </div>
                <div className='w-24 sm:w-32'>
                  <p className='text-[10px] sm:text-xs font-bold text-gray-700 text-center uppercase tracking-wider leading-tight truncate px-1'>
                    {cat.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => scroll('right')} className='absolute right-2 sm:right-5 top-1/2 z-20 bg-white/90 p-2 rounded-full shadow-lg hidden group-hover:flex items-center justify-center -translate-y-1/2 border border-gray-100 hover:bg-black hover:invert transition-all'>
          <img src={assets.dropdown_icon} className='w-3 -rotate-360' alt="next" />
        </button>
      </div>
    </div>
  );
};

export default StampCategoryScroll;