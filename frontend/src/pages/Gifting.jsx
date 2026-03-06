import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import { Gift, Truck, Sparkles, Phone, Mail, CheckCircle2 } from 'lucide-react';

const Gifting = () => {
  const { products, navigate } = useContext(ShopContext);
  const [giftItems, setGiftItems] = useState([]);

  useEffect(() => {
    // Filtering products specifically categorized under 'Gifting'
    if (products.length > 0) {
      const filtered = products.filter(item => 
        item.category.some(cat => cat.toLowerCase().includes('gifting'))
      );
      setGiftItems(filtered);
    }
  }, [products]);

  const serviceFeatures = [
    { icon: <Sparkles size={20}/>, title: 'Customized Gift Hampers', desc: 'Curated philatelic sets for special occasions.' },
    { icon: <Truck size={20}/>, title: 'PAN India Delivery', desc: 'Secure transit for delicate archival specimens.' },
    { icon: <Gift size={20}/>, title: 'Special Festive Combos', desc: 'Exclusive year-end and thematic bundles.' },
  ];

  return (
    <div className='bg-white min-h-screen text-black pt-10 pb-24 px-6 md:px-16 lg:px-24 select-none animate-fade-in'>
      
      {/* HEADER SECTION */}
      <div className='flex flex-col items-center text-center mb-16'>
        <div className='flex items-center gap-3 mb-4'>
          <Gift size={16} className='text-[#BC002D]' />
          <p className='text-[10px] tracking-[0.5em] text-[#BC002D] uppercase font-black'>The Art of Gifting</p>
        </div>
        <h2 className='text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter uppercase italic mb-6'>
          Gift a <span className='text-[#BC002D]'>Smile.</span>
        </h2>
        <p className='text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] max-w-lg'>
          Celebrate every occasion with curated historical specimens from the Healthy Master collection.
        </p>
      </div>

      {/* SERVICE FEATURES GRID */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-20'>
        {serviceFeatures.map((feature, index) => (
          <div key={index} className='border border-gray-100 p-8 flex flex-col items-center text-center hover:border-[#BC002D]/30 transition-all rounded-sm'>
            <div className='text-[#BC002D] mb-4'>{feature.icon}</div>
            <h3 className='text-[12px] font-black uppercase tracking-widest mb-2'>{feature.title}</h3>
            <p className='text-[10px] text-gray-400 font-medium leading-relaxed'>{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* DYNAMIC PRODUCT LISTING */}
      <div className='mb-20'>
        <div className='flex items-center justify-between mb-10 border-b border-gray-100 pb-6'>
           <h3 className='text-[11px] font-black uppercase tracking-[0.3em]'>Gifting Registry Index</h3>
           <p className='text-[10px] font-bold text-[#BC002D]'>{giftItems.length} Specimens Available</p>
        </div>
        
        {giftItems.length > 0 ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12'>
            {giftItems.map((item) => (
              <ProductItem key={item._id} id={item._id} {...item} isPriorityMode={true} />
            ))}
          </div>
        ) : (
          <div className='py-20 text-center bg-gray-50 border border-dashed rounded-sm'>
            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>No specimens currently allocated to Gifting</p>
          </div>
        )}
      </div>

      {/* FLOW SECTION */}
      <div className='bg-[#FBFBFB] border border-gray-100 p-10 md:p-16 rounded-sm'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-12'>
          <div className='flex flex-col items-center text-center'>
            <span className='text-3xl font-black text-[#BC002D]/20 mb-4'>1</span>
            <div className='flex flex-col gap-1'>
              <p className='text-[10px] font-black uppercase flex items-center justify-center gap-2'><Phone size={10}/> +91 9999167799</p>
              <p className='text-[10px] font-black uppercase flex items-center justify-center gap-2'><Mail size={10}/> admin@philabasket.com</p>
            </div>
          </div>
          <div className='flex flex-col items-center text-center'>
            <span className='text-3xl font-black text-[#BC002D]/20 mb-4'>2</span>
            <p className='text-[10px] font-black uppercase tracking-widest'>Our gifting expert will share the best proposal</p>
          </div>
          <div className='flex flex-col items-center text-center'>
            <span className='text-3xl font-black text-[#BC002D]/20 mb-4'>3</span>
            <p className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2'>
               <CheckCircle2 size={12} className='text-green-600'/> Finalize & Secure Specimen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gifting;