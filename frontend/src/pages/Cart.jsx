import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Plus, Minus, ShieldCheck, Star, X ,Globe,Landmark} from 'lucide-react';

const Cart = () => {
  // Added userData to context imports
  const { products, cartItems, updateQuantity, navigate, formatPrice, toggleWishlist, wishlist, currency, userData } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const valuationSymbol = currency === 'USD' ? '$' : '₹';

  useEffect(() => {
    if (products.length > 0) {
        const tempData = [];
        const missingItems = [];

        for (const itemId in cartItems) {
            // Only process items with quantity > 0
            if (cartItems[itemId] > 0) {
                // FORCE STRING COMPARISON
                const productFound = products.find((product) => String(product._id) === String(itemId));
                
                if (productFound) {
                    tempData.push({
                        _id: itemId,
                        quantity: cartItems[itemId]
                    });
                } else {
                    missingItems.push(itemId);
                }
            }
        }
        setCartData(tempData);

        if (missingItems.length > 0) {
            missingItems.forEach(id => updateQuantity(id, 0));
            toast.info("Registry updated: Unavailable specimens removed.");
        }
    }
}, [cartItems, products]);

  // Handler to move item to wishlist when clicking "X"
  const handleRemoveAndWishlist = (id) => {
    if (!wishlist.includes(id)) {
      toggleWishlist(id);
    }
    updateQuantity(id, 0);
  };

  return (
    <div className='bg-white min-h-screen pt-4 pb-20 px-4 md:px-10 lg:px-16 text-black select-none animate-fade-in'>

      {/* REWARDS BANNER - Now displays dynamic user points */}
      <div className='mb-6 bg-[#BC002D] text-white px-6 py-3 flex items-center gap-3 rounded-sm shadow-sm'>
        <Star size={14} className='fill-white text-white flex-shrink-0 animate-pulse' />
        <p className='text-[10px] font-black uppercase tracking-[0.25em]'>
          Registry Status: You have <span className='underline decoration-white/40 underline-offset-4'>{(userData?.totalRewardPoints || 0).toLocaleString()}</span> points earned
        </p>
        <button 
          onClick={() => navigate('/rewards')}
          className='ml-auto text-[9px] font-black uppercase tracking-widest border border-white/40 px-4 py-1.5 hover:bg-white hover:text-[#BC002D] transition-all rounded-sm whitespace-nowrap'
        >
          Rewards
        </button>
      </div>

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4'>
        <div>
          <div className='flex items-center gap-3 mb-2'>
            <span className='h-[1.5px] w-8 bg-[#BC002D]'></span>
            <p className='text-[9px] tracking-[0.5em] text-[#BC002D] uppercase font-black'>Acquisition Pending</p>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-gray-900 tracking-tighter leading-none uppercase italic'>
            MY <span className='text-[#BC002D]'>Cart.</span>
          </h2>
        </div>
        <div className='border-l-2 border-[#BC002D] bg-gray-50 px-5 py-3'>
          <p className='text-[10px] font-black text-black uppercase tracking-[0.2em]'>
            {cartData.length} <span className='text-[#BC002D]'>Records</span> in Session
          </p>
        </div>
      </div>

      {cartData.length === 0 ? (
        /* EMPTY STATE */
        <div className='flex flex-col items-center justify-center py-32 border border-dashed border-gray-200'>
          <div className='w-20 h-20 border border-black/5 flex items-center justify-center bg-gray-50 mb-6'>
            <img src={assets.logo} className='w-10 opacity-10 grayscale' alt="" />
          </div>
          <h2 className='text-3xl font-bold text-gray-900 tracking-tighter uppercase mb-2'>Cart Empty</h2>
          <p className='text-[9px] text-black/40 uppercase tracking-[0.3em] font-black mb-10'>No Stamps  found </p>
          <Link to='/collection' className='bg-black text-white px-12 py-4 text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#BC002D] transition-all'>
            Explore Archive
          </Link>
        </div>
      ) : (
        <div className='flex flex-col xl:flex-row gap-10'>

          {/* TABLE SECTION */}
          <div className='flex-1 overflow-x-auto custom-scrollbar'>
            <table className='w-full border-collapse' style={{ minWidth: '650px' }}>
              <thead>
                <tr className='border-b-2 border-black'>
                  <th className='text-left pb-4 text-[9px] font-black uppercase tracking-[0.35em] text-black w-[50%]'>Specimen Details</th>
                  <th className='text-right pb-4 text-[9px] font-black uppercase tracking-[0.35em] text-black'>Valuation</th>
                  <th className='text-center pb-4 text-[9px] font-black uppercase tracking-[0.35em] text-black'>Qty</th>
                  <th className='text-right pb-4 text-[9px] font-black uppercase tracking-[0.35em] text-black'>Statement</th>
                </tr>
              </thead>

              <tbody className='divide-y divide-black/5'>
                {cartData.map((item, index) => {
                  const productData = products.find((product) => product._id === item._id);
                  if (!productData) {
                      console.warn(`Registry Alert: Specimen ${item._id} found in cart but missing from Archive.`);
                      return null;
                  }
                  if (!productData) return null;
                  const subtotal = productData.price * item.quantity;

                  return (
                    <tr key={index} className='hover:bg-gray-50/50 transition-colors group'>
                      {/* PRODUCT CELL */}
                      <td className='py-6 pr-4'>
                        <div className='flex items-center gap-5'>
                          {/* Updated: Move to wishlist on click */}
                          <button
                            onClick={() => handleRemoveAndWishlist(item._id)}
                            className='w-6 h-6 border border-black/10 flex items-center justify-center text-black/30 hover:bg-[#BC002D] hover:border-[#BC002D] hover:text-white transition-all flex-shrink-0 rounded-full'
                            title='Move to Wishlist & Remove'
                          >
                            <X size={12} />
                          </button>
                          {/* Image */}
                          <div className='w-16 h-16 bg-[#F9F9F9] border border-black/5 flex items-center justify-center flex-shrink-0 p-1 group-hover:border-black/20 transition-all'>
                            <img className='max-w-full max-h-full object-contain mix-blend-multiply' src={productData.image[0]} alt="" />
                          </div>
                          {/* Name & meta */}
                          <div>
                            <div className='flex items-center gap-2 mb-1'>
                                <Globe size={10} className='text-[#BC002D]' />
                                <p className='text-[8px] font-black text-[#BC002D] uppercase tracking-widest'>{productData.country}</p>
                            </div>
                            <p className='text-[12px] font-bold text-gray-900 leading-snug uppercase max-w-xs'>{productData.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* PRICE CELL */}
                      <td className='py-6 text-right align-middle'>
                        <div className='flex flex-col items-end'>
                          {productData.marketPrice > productData.price && (
                            <p className='text-[10px] font-bold text-black/20 line-through tabular-nums'>
                              {valuationSymbol}{formatPrice(productData.marketPrice)}
                            </p>
                          )}
                          <p className='text-[14px] font-black text-black tabular-nums'>
                            <span className='text-[10px] text-[#BC002D] mr-0.5 font-mono'>{valuationSymbol}</span>{formatPrice(productData.price)}
                          </p>
                        </div>
                      </td>

                      {/* QUANTITY CELL */}
                      <td className='py-6 align-middle'>
                        <div className='flex items-center justify-center'>
                          <div className='flex border border-black/10 bg-white rounded-sm overflow-hidden'>
                            <button
                                onClick={() => item.quantity > 1 && updateQuantity(item._id, item.quantity - 1)}
                                className='w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all text-black'
                            >
                                <Minus size={10} />
                            </button>
                            <div className='w-10 h-8 border-x border-black/5 flex items-center justify-center bg-gray-50/50'>
                                <span className='text-[11px] font-black text-black tabular-nums'>{item.quantity}</span>
                            </div>
                            <button
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                className='w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all text-black'
                            >
                                <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* SUBTOTAL CELL */}
                      <td className='py-6 text-right align-middle'>
                        <p className='text-[14px] font-black text-black tabular-nums'>
                          <span className='text-[10px] text-[#BC002D] mr-0.5 font-mono'>{valuationSymbol}</span>{formatPrice(subtotal)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* CONTINUE SHOPPING */}
            <div className='mt-8 pt-6 border-t border-black/5 flex justify-between items-center'>
              <Link
                to='/collection'
                className='text-[10px] font-black uppercase tracking-[0.3em] text-black hover:text-[#BC002D] transition-all flex items-center gap-3 group'
              >
                <span className='text-[#BC002D] transition-transform group-hover:-translate-x-1'>←</span> Continue Browsing Archive
              </Link>
              <div className='flex items-center gap-2 opacity-30'>
                 <ShieldCheck size={14} />
                 <span className='text-[8px] font-black uppercase tracking-widest'>End-to-End Encryption</span>
              </div>
            </div>
          </div>

          {/* TOTALS PANEL */}
          <div className='w-full xl:w-[380px] flex-shrink-0'>
            <div className='bg-[#FBFBFB] p-8 border border-black/5 rounded-sm shadow-sm'>
              <div className='flex items-center gap-3 mb-8 pb-4 border-b border-black/10'>
                <Landmark size={15} className='text-[#BC002D]' />
                <p className='text-[10px] font-black uppercase tracking-[0.35em] text-black'>Ledger Summary</p>
              </div>

              <CartTotal />

              <button
                onClick={() => navigate('/place-order')}
                className='w-full mt-8 bg-black text-white text-[10px] py-4 uppercase tracking-[0.5em] font-black hover:bg-[#BC002D] transition-all active:scale-95 shadow-lg shadow-black/10'
              >
                Proceed to Pay
              </button>

              <div className='mt-8 pt-6 border-t border-black/10 space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-[8px] font-bold text-black/30 uppercase tracking-[0.2em]'>Protocol Status</span>
                  <span className='text-[8px] font-black uppercase text-green-600 px-2 py-0.5 bg-green-50'>Verified</span>
                </div>
                {/* <div className='flex justify-between items-center'>
                  <span className='text-[8px] font-bold text-black/30 uppercase tracking-[0.2em]'>Auth Code</span>
                  <span className='text-[9px] font-mono font-black uppercase text-black'>SEC-8842-P</span>
                </div> */}
              </div>
            </div>
          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC002D; }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default Cart;