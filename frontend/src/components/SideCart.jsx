import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { X, Trash2, ArrowRight } from 'lucide-react';

const SideCart = () => {
    const { cartItems, products, updateQuantity, navigate, showSideCart, setShowSideCart, formatPrice, currency } = useContext(ShopContext);
    const valuationSymbol = currency === 'USD' ? '$' : '₹';

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo && cartItems[items] > 0) {
                totalAmount += itemInfo.price * cartItems[items];
            }
        }
        return totalAmount;
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-500 ${showSideCart ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowSideCart(false)}
            />

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[101] shadow-2xl transition-transform duration-500 ease-in-out transform ${showSideCart ? 'translate-x-0' : 'translate-x-full'}`}>
                
                <div className='flex flex-col h-full'>
                    {/* Header */}
                    <div className='p-6 border-b border-gray-100 flex justify-between items-center bg-black text-white'>
                        <h2 className='text-[12px] font-black uppercase tracking-[0.3em]'>Shopping Cart</h2>
                        <button onClick={() => setShowSideCart(false)} className='flex items-center gap-2 text-[10px] uppercase font-bold opacity-70 hover:opacity-100'>
                            Close <X size={14} />
                        </button>
                    </div>

                    {/* Cart Items List */}
                    <div className='flex-1 overflow-y-auto p-6 custom-scrollbar'>
                        {Object.keys(cartItems).filter(id => cartItems[id] > 0).length === 0 ? (
                            <div className='h-full flex flex-col items-center justify-center opacity-30'>
                                <p className='text-[10px] font-black uppercase tracking-widest'>Ledger is Empty</p>
                            </div>
                        ) : (
                            <div className='space-y-6'>
                                {Object.keys(cartItems).map((id, index) => {
                                    const item = products.find(p => p._id === id);
                                    if (!item || cartItems[id] <= 0) return null;
                                    return (
                                        <div key={index} className='flex gap-4 border-b border-gray-50 pb-6'>
                                            <div className='w-20 h-20 bg-gray-50 p-2 border border-gray-100'>
                                                <img src={item.image[0]} className='w-full h-full object-contain mix-blend-multiply' alt="" />
                                            </div>
                                            <div className='flex-1'>
                                                <p className='text-[10px] font-bold text-gray-900 uppercase leading-tight mb-1'>{item.name}</p>
                                                <p className='text-[11px] font-black text-[#BC002D]'>
                                                    {cartItems[id]} × {valuationSymbol}{formatPrice(item.price)}
                                                </p>
                                                <button 
                                                    onClick={() => updateQuantity(id, 0)}
                                                    className='mt-2 text-[9px] uppercase font-black text-gray-400 hover:text-red-600 flex items-center gap-1'
                                                >
                                                    <Trash2 size={10} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer / Subtotal */}
                    <div className='p-8 bg-gray-50 border-t border-gray-100'>
                        <div className='flex justify-between items-center mb-6'>
                            <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Subtotal:</p>
                            <p className='text-xl font-black text-black'>{valuationSymbol}{formatPrice(getCartAmount())}</p>
                        </div>
                        
                        <div className='space-y-3'>
                            <button 
                                onClick={() => { navigate('/cart'); window.scroll(0,0); setShowSideCart(false); }}
                                className='w-full py-4 border border-black text-[10px] font-black uppercase tracking-[0.2em] bg-black text-white transition-all'
                            >
                                View  Cart
                            </button>
                            <button 
                                onClick={() => { navigate('/place-order');window.scroll(0,0); setShowSideCart(false); }}
                                className='w-full py-4 bg-[#BC002D] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#BC002D]/20'
                            >
                                Checkout <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SideCart;