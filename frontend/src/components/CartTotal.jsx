import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import Title from './Title';

const CartTotal = ({ country = 'India', deliveryMethod = 'standard' }) => {
    // Keep currency and pricing logic in context, but fetch fees directly
    const { currency, backendUrl, getCartAmount, formatPrice } = useContext(ShopContext);
    const [adminFees, setAdminFees] = useState(null);

    const subtotal = getCartAmount();
    
    // --- FINANCIAL PROTOCOLS ---
    const gstAmount = subtotal * 0.05;
    const philabasketDiscount = subtotal * 0.05; 

    // --- DIRECT DATABASE FETCH FOR FEES ---
    useEffect(() => {
        const fetchFees = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/admin/settings');
                if (response.data.success) {
                    setAdminFees(response.data.settings);
                }
            } catch (error) {
                console.error("Registry Settings Offline:", error);
            }
        };
        fetchFees();
    }, [backendUrl]);

    // --- DYNAMIC SHIPPING LOGIC ---
    const calculateShipping = () => {
        const isIndia = country?.toLowerCase().trim() === 'india';
        const FREE_SHIPPING_THRESHOLD = 4999;
        
        // Protocol: Free shipping only for Standard India orders >= 4999
        if (isIndia && deliveryMethod === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) {
            return 0;
        }

        // Use AdminFees from direct state with fallback values provided
        if (isIndia) {
            return deliveryMethod === 'fast' 
                ? (adminFees?.indiaFeeFast || 250) 
                : (adminFees?.indiaFee || 125);
        } else {
            return deliveryMethod === 'fast' 
                ? (adminFees?.globalFeeFast || 1500) 
                : (adminFees?.globalFee || 749);
        }
    };

    const currentDeliveryFee = calculateShipping();
    const isFreeShipping = currentDeliveryFee === 0 && subtotal > 0;
    const currencySymbol = currency === 'USD' ? '$' : '₹';
    const isIndia = country?.toLowerCase().trim() === 'india';

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

                {/* Shipping Fee */}
                <div className='flex justify-between items-center'>
                    <div>
                        <p className='text-gray-400 font-black uppercase tracking-widest text-[9px]'>Registry Shipping Fee</p>
                        <p className='text-[8px] font-black text-[#BC002D] uppercase tracking-tighter'>
                            {deliveryMethod === 'fast' 
                                ? (isIndia ? '⚡ Speed Post ' : '⚡ Speed Post') 
                                : (isIndia ? 'Registered Parcel' : 'Redistered Shipping')}
                        </p>
                    </div>
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
    );
};

export default CartTotal;