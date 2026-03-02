import React from 'react'
import { ShieldCheck, Truck, Headphones } from 'lucide-react'

const OurPolicy = () => {
  return (
    <div className='bg-white py-20 border-y border-black/[0.03] select-none overflow-hidden relative'>
      
      {/* Subtle Background Mark */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10vw] font-black text-black/[0.01] tracking-[0.5em] pointer-events-none uppercase">
        Sovereign
      </div>

      <div className='max-w-7xl mx-auto px-6 grid grid-cols-3 md:grid-cols-3 gap-12 relative z-10'>
        
        {/* Policy Item 1: Authenticity */}
        <div className='group flex flex-col items-center text-center'>
          <div className='mb-6 w-16 h-16 flex items-center justify-center relative'>
            <div className='absolute inset-0 bg-[#BC002D]/5 rounded-xl rotate-45 group-hover:rotate-90 transition-transform duration-700'></div>
            <ShieldCheck size={28} strokeWidth={1.5} className='text-[#BC002D] relative z-10' />
          </div>

          <h4 className='text-gray-900 font-black text-[10px] tracking-[0.3em] uppercase mb-3'>
            Verified <span className='text-[#BC002D]'>Provenance</span>
          </h4>
          <p className='text-[#DC5F00] text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[200px]'>
            Lifetime guarantee of <br/> authenticity on all specimens.
          </p>
        </div>

        {/* Policy Item 2: Logistics */}
        <div className='group flex flex-col items-center text-center'>
          <div className='mb-6 w-16 h-16 flex items-center justify-center relative'>
            <div className='absolute inset-0 bg-[#BC002D]/5 rounded-xl rotate-45 group-hover:rotate-90 transition-transform duration-700'></div>
            <Truck size={28} strokeWidth={1.5} className='text-[#BC002D] relative z-10' />
          </div>

          <h4 className='text-gray-900 font-black text-[10px] tracking-[0.3em] uppercase mb-3'>
            Insured <span className='text-[#BC002D]'>Logistics</span>
          </h4>
          <p className='text-[#DC5F00] text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[200px]'>
            White-glove transit to <br/> over 140 global corridors.
          </p>
        </div>

        {/* Policy Item 3: Support */}
        <div className='group flex flex-col items-center text-center'>
          <div className='mb-6 w-16 h-16 flex items-center justify-center relative'>
            <div className='absolute inset-0 bg-[#BC002D]/5 rounded-xl rotate-45 group-hover:rotate-90 transition-transform duration-700'></div>
            <Headphones size={28} strokeWidth={1.5} className='text-[#BC002D] relative z-10' />
          </div>

          <h4 className='text-gray-900 font-black text-[10px] tracking-[0.3em] uppercase mb-3'>
            Expert <span className='text-[#BC002D]'>Curators</span>
          </h4>
          <p className='text-[#DC5F00] text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[200px]'>
            Direct access to dedicated <br/> philatelic guidance.
          </p>
        </div>

      </div>

      {/* Decorative Branding */}
      <div className='mt-16 flex flex-col items-center opacity-30'>
          <div className='h-[1px] w-12 bg-[#BC002D] mb-4'></div>
          <p className='text-[7px] tracking-[1em] text-black uppercase font-black'>Registry Protocols • MMXXVI</p>
      </div>
    </div>
  )
}

export default OurPolicy