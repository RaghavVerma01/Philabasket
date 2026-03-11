import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const NewsletterBox = () => {
  // Use the environment variable or fallback to your local port
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
        // We pass { email } which is the state variable
        const response = await axios.post(backendUrl + '/api/newsletter/subscribe', { email });
        
        if (response.data.success) {
            toast.success(response.data.message);
            setEmail(""); // Reset field on success
        } else {
            toast.error(response.data.message);
        }
    } catch (error) {
        toast.error("Registry connection failed");
        console.error("Newsletter Error:", error);
    } finally {
        setLoading(false);
    }
};

  return (
    <div className='bg-white py-5 px-6 relative overflow-hidden border-t border-black/[0.03]  lg:mt-[-27vh]'>
      
      {/* NewHero Curved Accent */}
      <div className="absolute -right-[15vw] top-1/2 -translate-y-1/2 h-[80%] w-[40%] bg-[#bd002d]/5 rounded-l-[600px] pointer-events-none"></div>

      <div className='relative z-10 text-center'>
        <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[1.5px] w-10 bg-[#BC002D]"></div>
            <span className="text-[10px] tracking-[0.5em] text-[#BC002D] uppercase font-black">Registry Intel</span>
            <div className="h-[1.5px] w-10 bg-[#BC002D]"></div>
        </div>

        <h2 className='text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tighter'>
          JOIN THE <span className='text-[#BC002D]'>INNER CIRCLE.</span>
        </h2>
        
        <p className='text-[#DC5F00] max-w-lg mx-auto text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed mb-12'>
          Receive priority intelligence on <span className='text-black'>rare acquisitions</span> and private philatelic ledger updates.
        </p>

        <form onSubmit={onSubmitHandler} className='max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-0 shadow-2xl'>
            <input 
              // --- CRITICAL FIX: LINKING STATE TO INPUT ---
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // --------------------------------------------
              className='w-full bg-[#f8f8f8] border border-gray-100 px-8 py-6 text-black outline-none focus:bg-white focus:border-[#BC002D]/30 transition-all duration-500 placeholder:text-gray-500 text-xs font-bold uppercase tracking-widest' 
              type="email" 
              placeholder='Enter Email Address' 
              required
            />
          <button 
            disabled={loading}
            type='submit' 
            className='bg-[#BC002D] hover:bg-black text-white text-[10px] font-black tracking-[0.4em] px-12 py-6 transition-all duration-500 whitespace-nowrap uppercase disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {loading ? "Syncing..." : "Request Access"}
          </button>
        </form>

        <p className='mt-10 text-[9px] text-gray-300 uppercase tracking-[0.6em] font-black'>
          Sovereign Data Protection Guaranteed
        </p>
      </div>
    </div>
  )
}

export default NewsletterBox