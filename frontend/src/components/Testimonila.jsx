import React, { useEffect, useState, useContext } from 'react';
import { Star, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import Avatar, { genConfig } from 'react-nice-avatar'; // Import react-nice-avatar
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const Testimonials = () => {
  const { backendUrl } = useContext(ShopContext);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/feedback/featured`);
        if (response.data.success) {
          setFeaturedReviews(response.data.testimonials);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
    if (backendUrl) fetchFeatured();
  }, [backendUrl]);

  if (!loading && featuredReviews.length === 0) return null;

  const marqueeItems = [...featuredReviews, ...featuredReviews];

  return (
    <section className='bg-[#FCF9F4] py-24 overflow-hidden select-none relative'>
      <div className="absolute right-[-5vw] top-0 h-full w-[20%] bg-[#bd002d]/5 rounded-l-[600px] pointer-events-none"></div>

      <div className='relative z-10'>
        {/* Section Header */}
        <div className='px-6 md:px-16 lg:px-24 mb-16'>
          <div className='flex items-center gap-4 mb-4'>
            <div className="w-10 h-10 border border-[#BC002D] rounded-full flex items-center justify-center">
                <MessageSquareQuote size={16} className="text-[#BC002D]" />
            </div>
            <span className='text-[10px] tracking-[0.5em] text-[#BC002D] uppercase font-black'>Registry Feedback</span>
          </div>
          <h2 className='text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter uppercase leading-none'>
            Collector <span className='text-[#BC002D]'>Voices.</span>
          </h2>
        </div>

        {/* --- MARQUEE CONTAINER --- */}
        <div className='flex relative w-full overflow-hidden group'>
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-[#FCF9F4] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-[#FCF9F4] to-transparent z-20 pointer-events-none"></div>

          <div className='flex gap-6 animate-marquee group-hover:pause'>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className='min-w-[350px] bg-white/50 h-48 rounded-br-[40px] animate-pulse border border-black/5'></div>
              ))
            ) : (
              marqueeItems.map((review, index) => {
                // Generate a unique configuration based on the username
                const config = genConfig(review.userName || "Collector");

                return (
                  <div 
                    key={index} 
                    className='min-w-[320px] md:min-w-[450px] bg-white p-8 rounded-br-[40px] md:rounded-br-[60px] border border-black/[0.03] shadow-sm hover:shadow-2xl transition-all duration-700 hover:border-[#BC002D]/20 flex flex-col justify-between'
                  >
                    <div>
                      <div className='flex justify-between items-center mb-6'>
                        <div className='flex gap-1'>
                          {[...Array(review.rating || 5)].map((_, i) => (
                            <Star key={i} size={12} className='fill-[#BC002D] text-[#BC002D]' />
                          ))}
                        </div>
                        <div className='flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full'>
                           <CheckCircle2 size={10} className='text-green-600' />
                           <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Verified Collector</span>
                        </div>
                      </div>
                      
                      <p className='text-gray-700 text-[13px] md:text-[14px] leading-relaxed font-medium italic mb-8'>
                        "{review.text || "Exceptional service and specimen quality."}"
                      </p>
                    </div>

                    {/* --- AVATAR & USER DATA SECTION --- */}
                    <div className='flex items-center justify-between pt-6 border-t border-gray-50'>
                      <div className='flex items-center gap-4'>
                        
                        {/* --- REACT-NICE-AVATAR AREA --- */}
                        <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-[#BC002D]/10 bg-[#FCF9F4] flex items-center justify-center shrink-0'>
                          {review.userAvatar ? (
                            <img src={review.userAvatar} alt={review.userName} className='w-full h-full object-cover' />
                          ) : (
                            // Nice Avatar implementation
                            <Avatar className="w-full h-full" {...config} />
                          ) }
                        </div>

                        <div>
                          <div className='flex items-center gap-1.5'>
                            <p className='text-[12px] font-black uppercase tracking-widest text-gray-900'>{review.userName}</p>
                          </div>
                          <p className='text-[9px] font-bold uppercase tracking-widest text-[#BC002D]'>Premium Member</p>
                        </div>
                      </div>

                      <div className='text-right'>
                          <p className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>
                              {review.date ? new Date(review.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'March 2026'}
                          </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 12px)); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          display: flex;
          width: max-content;
        }
        .pause {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
};

export default Testimonials;