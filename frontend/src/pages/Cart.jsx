import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Plus, Minus, ShieldCheck } from 'lucide-react';

const Cart = () => {
  const { products, cartItems, updateQuantity, navigate, formatPrice, toggleWishlist, wishlist ,currency} = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const valuationSymbol = currency === 'USD' ? '$' : '₹';

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const itemId in cartItems) {
        if (cartItems[itemId] > 0) {
          tempData.push({
            _id: itemId,
            quantity: cartItems[itemId]
          });
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  return (
    <div className='bg-white min-h-screen pt-24 pb-20 px-6 md:px-16 lg:px-24 text-black select-none animate-fade-in'>
      
      {/* HEADER SECTION */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6'>
          <div className='max-w-2xl'>
              <div className='flex items-center gap-4 mb-4'>
                  <span className='h-[1.5px] w-12 bg-[#BC002D]'></span>
                  <p className='text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black'>Acquisition Pending</p>
              </div>
              <h2 className='text-5xl md:text-6xl font-bold text-gray-900 tracking-tighter leading-none uppercase'>
                  MY <span className='text-[#BC002D]'>Cart.</span>
              </h2>
          </div>
          <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100'>
             {cartData.length} Specimens in Session
          </p>
      </div>

      <div className='max-w-6xl mx-auto'>
        {cartData.length === 0 ? (
          /* --- THEMED EMPTY VAULT STATE --- */
          <div className='flex flex-col items-center justify-center py-32'>
            <div className='relative mb-8'>
              <div className='w-24 h-24 border border-black/5 rounded-full flex items-center justify-center bg-gray-50'>
                 <img src={assets.logo} className='w-10 opacity-10 grayscale' alt="" />
              </div>
            </div>
            <h2 className='text-3xl font-bold text-gray-900 tracking-tighter uppercase mb-2'>Vault Empty</h2>
            <p className='text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black mb-10'>No registry records found for acquisition</p>
            <Link to='/collection' className='bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#BC002D] transition-all rounded-sm'>
              Explore Archive
            </Link>
          </div>
        ) : (
          /* --- ACTIVE CART ITEMS --- */
          <div className='flex flex-col lg:flex-row gap-16'>
            
            <div className='flex-1 space-y-3'>
                {cartData.map((item, index) => {
                const productData = products.find((product) => product._id === item._id);
                if (!productData) return null;

                return (
                    <div key={index} className='p-4 border border-black/5 bg-white flex items-center gap-6 rounded-sm transition-all hover:border-[#BC002D]/20 group'>
                        {/* Image Frame */}
                        <div className='w-20 sm:w-28 aspect-square bg-[#F9F9F9] p-3 flex items-center justify-center border border-black/5'>
                            <img className='max-w-full max-h-full object-contain drop-shadow-md' src={productData.image[0]} alt="" />
                        </div>
                        
                        {/* Info Section */}
                        <div className='flex-1'>
                            <div className='flex justify-between items-start mb-2'>
                                <div>
                                    <p className='text-[8px] font-black text-[#BC002D] uppercase tracking-widest mb-1'>{productData.country}</p>
                                    <h3 className='text-sm sm:text-base font-bold text-gray-900 leading-tight uppercase'>{productData.name}</h3>
                                </div>
                                <div className='flex flex-col items-end'>
                                    {/* Market Price / Strike-through (Optional) */}
    {productData.marketPrice > productData.price && (
        <p className='text-[10px] lg:text-[12px] font-bold text-gray-400 tabular-nums line-through decoration-[#BC002D]/40 mb-1'>
            <span className='mr-0.5'>{valuationSymbol}</span>
            {formatPrice(productData.marketPrice)}
        </p>
    )}

    {/* Main Price Display */}
    <p className='text-sm sm:text-xl font-black text-gray-900 tabular-nums leading-none'>
        <span className='text-[10px] mr-1 text-[#BC002D] font-black'>{valuationSymbol}</span>
        {formatPrice(productData.price)}
    </p>
                                </div>
                            </div>

                            {/* Actions bar */}
                            <div className='flex items-center justify-between mt-4 pt-4 border-t border-black/[0.03]'>
                                <div className='flex items-center gap-3 bg-gray-50 p-1 rounded-sm'>
                                    <button onClick={() => item.quantity > 1 && updateQuantity(item._id, item.quantity - 1)} className='p-1.5 hover:bg-white rounded-sm transition-all'><Minus size={12}/></button>
                                    <span className='text-xs font-black w-6 text-center'>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className='p-1.5 hover:bg-white rounded-sm transition-all'><Plus size={12}/></button>
                                </div>

                                <div className='flex items-center gap-4'>
                                    <button 
                                        onClick={() => { toggleWishlist(item._id); updateQuantity(item._id, 0); }}
                                        className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-widest transition-all ${wishlist.includes(item._id) ? 'text-[#BC002D]' : 'text-gray-400 hover:text-[#BC002D]'}`}
                                    >
                                        <Heart size={14} className={wishlist.includes(item._id) ? 'fill-[#BC002D]' : ''} />
                                        <span className='hidden sm:inline'>Move to Wishlist</span>
                                    </button>
                                    <button 
                                        onClick={() => updateQuantity(item._id, 0)}
                                        className='flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all'
                                    >
                                        <Trash2 size={14} />
                                        <span className='hidden sm:inline'>Remove </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>

            {/* TOTALS PANEL (Registry Receipt Style) */}
            <div className='w-full lg:w-[400px]'>
  {/* REMOVED: sticky and top-32 classes */}
  <div className='p-8 bg-[#FBFBFB] border-t-2 border-[#BC002D] shadow-sm'>
    <div className='flex items-center gap-3 mb-8'>
        <ShieldCheck size={18} className='text-[#BC002D]' />
        <p className='text-[10px] font-black uppercase tracking-[0.3em]'>Proceed to Pay</p>
    </div>

    <CartTotal />
    
    <button onClick={() => navigate('/place-order')} className='w-full mt-10 bg-black text-white text-[10px] py-5 uppercase tracking-[0.5em] font-black hover:bg-[#BC002D] transition-all rounded-sm shadow-xl active:scale-95'>
        Proceed To pay
    </button>
    
    <div className='mt-8 pt-6 border-t border-black/5 flex flex-col gap-3'>
        <div className='flex justify-between items-center'>
            <span className='text-[8px] font-bold text-gray-400 uppercase tracking-widest'>Logistics</span>
            <span className='text-[8px] font-black uppercase text-green-600'>Insured</span>
        </div>
        <div className='flex justify-between items-center'>
            <span className='text-[8px] font-bold text-gray-400 uppercase tracking-widest'>Ref. Protocol</span>
            <span className='text-[8px] font-black uppercase text-gray-900'>PB-77490</span>
        </div>
    </div>
  </div>
</div>

          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default Cart;