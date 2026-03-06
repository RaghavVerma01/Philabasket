import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';

const CartTotal = ({ country = 'India' }) => {

    const { currency, getDeliveryFee, getCartAmount, formatPrice } = useContext(ShopContext);

    const subtotal = getCartAmount();
    
    // --- FINANCIAL PROTOCOLS ---
    const gstAmount = subtotal * 0.05;
    const philabasketDiscount = subtotal * 0.05; 

    // Threshold logic: Free shipping for orders > ₹4999 (Registry Standard)
    const FREE_SHIPPING_THRESHOLD = 4999;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const currentDeliveryFee = isFreeShipping ? 0 : getDeliveryFee(country); 
    
    const currencySymbol = currency === 'USD' ? '$' : '₹';

    return (
        <div className='w-full'>
            <div className='text-2xl'>
                <Title text1={'TOTAL'} text2={'VALUATION'} />
            </div>

            <div className='flex flex-col gap-3 mt-4 text-sm'>
                {/* Asset Subtotal */}
                <div className='flex justify-between'>
                    <p className='text-gray-400 font-black uppercase tracking-widest text-[9px]'>Asset Subtotal</p>
                    <p className='font-black text-black'>
                        {currencySymbol} {formatPrice(subtotal.toFixed(2))}
                    </p>
                </div>
                
                <hr className='border-black/5' />

                {/* GST Protocol */}
                <div className='flex justify-between'>
                    <p className='text-gray-400 font-black uppercase tracking-widest text-[9px]'>GST Protocol (5%)</p>
                    <p className='font-black text-black'>
                        {currencySymbol} {formatPrice(gstAmount.toFixed(2))}
                    </p>
                </div>

                <hr className='border-black/5' />

                {/* Exclusive Discount */}
                <div className='flex justify-between bg-green-50/50 p-1.5 rounded-sm border border-green-100/50'>
                    <p className='text-green-600 font-black uppercase tracking-widest text-[9px]'>Exclusive PB Discount (5%)</p>
                    <p className='font-black text-green-600'>
                        - {currencySymbol} {formatPrice(philabasketDiscount.toFixed(2))}
                    </p>
                </div>

                <hr className='border-black/5' />

                {/* Shipping Fee with Free Delivery Protocol */}
                <div className='flex justify-between items-center'>
                    <p className='text-gray-400 font-black uppercase tracking-widest text-[9px]'>Registry Shipping Fee ({country})</p>
                    <div className='text-right'>
                        {isFreeShipping ? (
                            <span className='text-[8px] font-black bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest'>Complimentary</span>
                        ) : (
                            <p className='font-black text-black'>
                                {currencySymbol} {formatPrice(currentDeliveryFee.toFixed(2))}
                            </p>
                        )}
                    </div>
                </div>

                <hr className='border-black/10' />

                {/* Final Total */}
                <div className='flex justify-between mt-2'>
                    <div>
                        <p className='text-black font-black uppercase tracking-[0.2em] text-[10px]'>Total Acquisition</p>
                        <p className='text-[8px] text-gray-400 font-bold italic uppercase tracking-tighter'>Verified Archive Valuation</p>
                    </div>
                    <b className='font-black text-[#BC002D] text-lg tracking-tighter'>
                        {currencySymbol} {subtotal === 0 ? "0.00" : formatPrice((subtotal + gstAmount - philabasketDiscount + currentDeliveryFee).toFixed(2))}
                    </b>
                </div>
            </div>
        </div>
    )
}

export default CartTotal