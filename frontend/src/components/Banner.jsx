import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../assets/assets';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

const Banner = () => {
  const { backendUrl } = useContext(ShopContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // 1. Hardcoded first image for "Instant Load"
  const [banners, setBanners] = useState([
    { image: '/banner.png', title: "FDC Festival", isStatic: true }
  ]);

  // 2. Fetch Admin-defined banners
  const fetchBanners = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/banner/list');
      if (response.data.success && response.data.banners.length > 0) {
        // Keep the static first image and append new ones from DB
        setBanners([
          { image: '/banner.png', title: "FDC Festival", isStatic: true },
          ...response.data.banners
        ]);
      }
    } catch (error) {
      console.error("Banner Sync Error:", error);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  useEffect(() => {
    fetchBanners();
  }, []); // Fetch once on mount

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [banners.length]); // Reset timer if banners list updates

  return (
    <div className='relative w-full overflow-hidden select-none bg-white group
        h-[15vh] sm:h-[25vh] md:h-[50vh] lg:h-[55vh] xl:h-[60vh]
    '>
      
      {/* Slide Content */}
      {banners.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img 
              // LCP Optimization: Eager load the first static image
              loading={index === 0 ? "eager" : "lazy"}
              draggable="false" 
              className='w-full h-full object-contain object-center sm:object-fill lg:object-contain md:object-contain' 
              src={slide.image}
              alt={slide.title} 
          />
          
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-transparent pointer-events-none"></div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <div className='absolute inset-0 flex items-center justify-between px-2 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none'>
        <button 
          onClick={prevSlide} 
          className='pointer-events-auto p-1.5 md:p-3 bg-black/20 hover:bg-[#BC002D] backdrop-blur-sm rounded-full text-white transition-all transform hover:scale-110'
        >
            <ChevronLeft className='w-5 h-5 md:w-8 md:h-8' />
        </button>
        <button 
          onClick={nextSlide} 
          className='pointer-events-auto p-1.5 md:p-3 bg-black/20 hover:bg-[#BC002D] backdrop-blur-sm rounded-full text-white transition-all transform hover:scale-110'
        >
            <ChevronRight className='w-5 h-5 md:w-8 md:h-8' />
        </button>
      </div>

      {/* Pagination Indicators */}
      <div className='absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-3 z-30'>
        {banners.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`cursor-pointer transition-all duration-500 h-1 rounded-full ${
              i === currentSlide ? 'w-6 md:w-12 bg-[#BC002D]' : 'w-2 md:w-3 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;