import React, { useEffect, useState, useContext } from 'react';
import { Truck, ShieldCheck, Globe, Clock, RotateCcw, AlertTriangle, Mail, Zap, Landmark, Shield } from 'lucide-react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const Shipping = () => {
    const { backendUrl } = useContext(ShopContext);
    const [fees, setFees] = useState(null);

    // --- DIRECT DATABASE FETCH FOR REGISTRY RATES ---
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/admin/settings');
                if (response.data.success) {
                    setFees(response.data.settings);
                }
            } catch (error) {
                console.error("Logistics Registry Offline:", error);
            }
        };
        fetchRates();
    }, [backendUrl]);

    return (
        <div className='bg-white min-h-screen pt-10 pb-20 px-6 md:px-16 text-black lg:px-24 select-none animate-fade-in font-sans'>
            
            {/* --- HEADER --- */}
            <div className='mb-16 border-b border-gray-100 pb-10 text-center md:text-left'>
                <h2 className='text-4xl md:text-5xl font-bold text-gray-800 tracking-tighter uppercase mb-2'>
                    SHIPPING <span className='text-[#BC002D]'>& RETURNS</span>
                </h2>
                <p className='text-[10px] tracking-[0.4em] text-gray-400 uppercase font-black'>Logistic Protocols & Acquisition Policy</p>
            </div>

            <div className='max-w-5xl mx-auto space-y-20'>
                
                {/* --- USE OF WEBSITE / PRINCIPLES --- */}
                <section>
                    <h3 className='text-2xl font-black uppercase tracking-widest text-gray-900 mb-6'>SHIPPING</h3>
                    <p className='text-sm text-gray-600 leading-relaxed mb-6'>
                        To understand the shipment method that PhilaBasket uses, there are certain principles that PhilaBasket follow to get the product that you have ordered to your doorstep.
                    </p>
                    <div className='space-y-12'>
                        {/* Locations */}
                        <div>
                            <div className='flex items-center gap-3 mb-4'>
                                <Globe size={20} className='text-[#BC002D]' />
                                <h4 className='text-sm font-black uppercase tracking-[0.2em]'>SHIPPING LOCATIONS:</h4>
                            </div>
                            <p className='text-sm text-gray-500 pl-8'>PhilaBasket shall deliver to All over the world, however there could be certain location that our services may not be available due to Logistic Issues.</p>
                        </div>

                        {/* Method */}
                        <div>
                            <div className='flex items-center gap-3 mb-4'>
                                <Truck size={20} className='text-[#BC002D]' />
                                <h4 className='text-sm font-black uppercase tracking-[0.2em]'>SHIPPING METHOD:</h4>
                            </div>
                            <div className='pl-8 space-y-4'>
                                <p className='text-sm text-gray-500'>PhilaBasket dispatches all its parcels through <span className='text-black font-bold'>INDIA POST</span> (Speed Post / Registered Post / Registered Parcel) only for faster and reliable services.</p>
                                <div className='flex items-center gap-2 bg-gray-50 p-3 rounded-sm w-fit'>
                                    <Clock size={14} className='text-[#BC002D]' />
                                    <span className='text-[10px] font-black uppercase tracking-widest'>Packet shipped within 2 working days of receipt of order</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- DYNAMIC SHIPPING CHARGES --- */}
                <section className='border-t border-gray-100 pt-16'>
                    <div className='flex items-center gap-3 mb-10'>
                        <Landmark size={24} className='text-[#BC002D]' />
                        <h3 className='text-2xl font-black uppercase tracking-widest text-gray-900'>SHIPPING CHARGES:</h3>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                        {/* Domestic Card */}
                        <div className='border border-gray-100 p-8 rounded-sm bg-white shadow-sm hover:border-[#BC002D]/30 transition-all'>
                            <p className='text-[10px] font-black text-[#BC002D] uppercase tracking-[0.3em] mb-6'>Domestic Delivery (India)</p>
                            <div className='space-y-8'>
                                <div>
                                    <div className='flex justify-between items-end'>
                                        <p className='text-[9px] font-black uppercase text-gray-400'>Standard / Registered Post</p>
                                        <p className='text-3xl font-black tracking-tighter'>₹{fees?.indiaFee || 49}</p>
                                    </div>
                                    <p className='text-[10px] text-gray-400 mt-2 font-bold italic'>*Expected within 14 working days from dispatch</p>
                                </div>
                                {fees?.isIndiaFastActive && (
                                    <div className='pt-6 border-t border-gray-50'>
                                        <div className='flex justify-between items-end'>
                                            <p className='text-[9px] font-black uppercase text-[#BC002D] flex items-center gap-1'><Zap size={10} fill="#BC002D"/> Speed Post (Priority)</p>
                                            <p className='text-3xl font-black tracking-tighter'>₹{fees?.indiaFeeFast || 99}</p>
                                        </div>
                                        <p className='text-[10px] text-gray-400 mt-2 font-bold italic'>*Expected within 7 working days from dispatch</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Global Card */}
                        <div className='border border-gray-100 p-8 rounded-sm bg-gray-900 text-white shadow-xl'>
                            <p className='text-[10px] font-black text-[#BC002D] uppercase tracking-[0.3em] mb-6'>International Delivery (Global)</p>
                            <div className='space-y-8'>
                                <div>
                                    <div className='flex justify-between items-end'>
                                        <p className='text-[9px] font-black uppercase text-white/40'>Standard Global Flat Rate</p>
                                        <p className='text-3xl font-black tracking-tighter'>₹{fees?.globalFee || 749}</p>
                                    </div>
                                    <p className='text-[10px] text-white/30 mt-2 font-bold italic'>*Expected within 20 working days from dispatch</p>
                                </div>
                                {fees?.isGlobalFastActive && (
                                    <div className='pt-6 border-t border-white/5'>
                                        <div className='flex justify-between items-end'>
                                            <p className='text-[9px] font-black uppercase text-[#BC002D] flex items-center gap-1'><Zap size={10} fill="#BC002D"/> Express Global</p>
                                            <p className='text-3xl font-black tracking-tighter'>₹{fees?.globalFeeFast || 1500}</p>
                                        </div>
                                        <p className='text-[10px] text-white/30 mt-2 font-bold italic'>*Priority processing and faster transit</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- TRANSIT PROTECTION --- */}
                <section className='border-t border-gray-100 pt-16'>
                    <div className='flex items-center gap-3 mb-8'>
                        <ShieldCheck size={22} className='text-[#BC002D]' />
                        <h3 className='text-2xl font-black uppercase tracking-widest text-gray-900'>Damage in Transit Policy</h3>
                    </div>
                    <div className='bg-gray-50 p-10 rounded-br-[80px] border border-gray-100'>
                        <p className='text-sm text-gray-600 leading-relaxed mb-10'>
                            PhilaBasket ensure in every way that the material that is sent is well protected and 100% secure while dispatching. All the stamps and other materials are secured in a <span className='text-black font-bold uppercase'>28 mm hard cardboard</span> as well as plastic wrapping making it waterproof and almost impossible to get damaged by pressure.
                        </p>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start'>
                            <div className='space-y-4'>
                                <h4 className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>Security & Integrity</h4>
                                <p className='text-sm text-gray-500'>We cannot take responsibility for theft of materials in transit. But items are sent by India Post which is secure and reliable. PhilaBasket have never come across any loss / theft of stamps in 1000+ deliveries.</p>
                            </div>
                            <div className='bg-white p-6 border border-gray-100 shadow-sm rounded-sm'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <Shield size={16} className='text-[#BC002D]' />
                                    <h4 className='text-[10px] font-black uppercase tracking-widest'>Optional Transit Insurance</h4>
                                </div>
                                <div className='flex justify-between border-b pb-3 mb-3'>
                                    <span className='text-xs font-bold text-gray-400'>Indian Buyers</span>
                                    <span className='text-xs font-black text-[#BC002D]'>7% Premium</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-xs font-bold text-gray-400'>International Buyers</span>
                                    <span className='text-xs font-black text-[#BC002D]'>12.5% Premium</span>
                                </div>
                                <p className='text-[9px] text-gray-400 mt-4 leading-relaxed font-bold uppercase'>Charges applied on total invoice amount. Deposited via Bank or PayPal.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- RETURNS / EXCHANGE POLICY --- */}
                <section className='border-t border-gray-100 pt-16'>
                    <div className='flex items-center gap-3 mb-8'>
                        <RotateCcw size={22} className='text-[#BC002D]' />
                        <h3 className='text-2xl font-black uppercase tracking-widest text-gray-900'>Return Policies</h3>
                    </div>
                    
                    <div className='space-y-8'>
                        <div className='p-8 bg-[#BC002D]/5 border-l-4 border-[#BC002D]'>
                            <p className='text-sm font-bold text-gray-700 leading-loose uppercase tracking-wide'>

                                Refunds are processed within 1-2 days and final credit of amount is depending on the finantial institution.
                            </p>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                            <div className='p-6 border border-gray-100 rounded-sm'>
                                <Mail size={18} className='text-[#BC002D] mb-4' />
                                <h5 className='text-[10px] font-black uppercase tracking-widest mb-3'>To Initiate Refund</h5>
                                <p className='text-[11px] font-bold text-gray-400 uppercase'>Email: admin@philabasket.com</p>
                            </div>
                            <div className='p-6 border border-gray-100 rounded-sm md:col-span-2'>
                                <h5 className='text-[10px] font-black uppercase tracking-widest mb-3'>Calculation Protocol</h5>
                                <p className='text-[12px] font-black text-gray-900 leading-tight uppercase tracking-[0.1em]'>
                                    Net refund amount = Total paid Amount – shipping charges – GST of order value
                                </p>
                                <p className='text-[9px] text-[#BC002D] mt-3 font-black uppercase italic'>*Full amount refunded ONLY if wrong material / damage item / dispatch error.</p>
                            </div>
                        </div>

                        <div className='bg-gray-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4'>
                            <div className='flex items-center gap-3'>
                                <AlertTriangle size={18} className='text-amber-500' />
                                <p className='text-[10px] font-black uppercase tracking-widest'>Refund Processing Timeline</p>
                            </div>
                            <p className='text-lg font-black tracking-tighter'>Maximum of 10 Working Days</p>
                        </div>
                    </div>
                </section>

                {/* --- FOOTNOTE --- */}
                <div className='border-t border-gray-100 pt-10 text-center md:text-left'>
                    <p className='text-[10px] text-gray-400 font-bold uppercase italic leading-loose'>
                        Note: *The time of delivery may vary. Since we have no control / authority over the shipping company that is India Post (Indian Postal Department, Government of India).
                    </p>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .animate-fade-in { animation: fadeIn 0.8s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

export default Shipping;