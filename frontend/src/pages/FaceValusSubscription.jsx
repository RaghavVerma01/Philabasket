import React, { useState, useEffect, useContext } from 'react';
import { ShieldCheck, Truck, Calendar, Package, Info, CheckCircle2 } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const FaceValueSubscription = () => {
    const { currency } = useContext(ShopContext);
    
    // --- State for Calculator ---
    const [selection, setSelection] = useState({
        category: 0,
        categoryName: "",
        quantity: 1,
        cycle: 12,
        shippingMode: 99,
        faceValueAdvance: 0
    });

    const serviceCharge = 600;

    // --- Calculation Logic ---
    const calculateTotal = () => {
        const { category, quantity, cycle, shippingMode } = selection;
        // Formula: (Category Rate * Quantity) + Service Charge + (Shipping Cycle * Shipping Mode)
        return (Number(category) * Number(quantity)) + serviceCharge + (Number(cycle) * Number(shippingMode));
    };

    const grandTotal = calculateTotal() + Number(selection.faceValueAdvance);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const handleSubscribe = () => {
        if (selection.category === 0) return toast.error("Please select a specimen category");
        if (selection.faceValueAdvance <= 0) return toast.error("Please enter a face value advance amount");
        toast.success("Subscription initialized. Redirecting to secure settlement...");
    };

    return (
        <div className='bg-[#FCF9F4] min-h-screen py-16 px-[6%] font-serif text-black'>
            {/* Header */}
            <div className='max-w-5xl mx-auto mb-16 text-center'>
                <h2 className='text-3xl font-black uppercase tracking-[0.2em] mb-4'>
                    Face Value <span className='text-[#BC002D]'>Subscription</span>
                </h2>
                <div className='h-1 w-24 bg-[#BC002D] mx-auto mb-8'></div>
                <p className='text-[13px] text-gray-500 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-widest'>
                    Acquire new philatelic releases at actual face value. A sovereign service for serious collectors.
                </p>
            </div>

            <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12'>
                
                {/* --- Left Column: Instructions & Steps --- */}
                <div className='lg:col-span-7 space-y-8'>
                    <div className='bg-white p-8 border border-black/[0.03] rounded-sm'>
                        <h3 className='text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2'>
                            <Info size={16} className="text-[#BC002D]" /> Subscription Protocol
                        </h3>
                        <div className='space-y-6'>
                            {[
                                "Choose your preferred specimen category (Multiple options allowed).",
                                "Select the required quantity for each new issue.",
                                "Choose your preferred Shipping Mode (Speed Post or Registered).",
                                "Select shipping frequency (Monthly to Yearly cycle).",
                                "Add your Advance Face Value amount (Deductible per issue)."
                            ].map((step, i) => (
                                <div key={i} className='flex gap-4 items-start'>
                                    <span className='text-[10px] font-black bg-black text-white w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5'>{i + 1}</span>
                                    <p className='text-[13px] text-gray-600 font-medium'>{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='bg-[#BC002D]/5 p-6 border border-[#BC002D]/10 rounded-sm'>
                        <p className='text-[11px] text-[#BC002D] font-bold uppercase leading-relaxed'>
                            * Note: We charge a fixed annual service charge of ₹600. India Post issues will be delivered without any additional premium or markup.
                        </p>
                    </div>
                </div>

                {/* --- Right Column: Interactive Registry Form --- */}
                <div className='lg:col-span-5'>
                    <div className='bg-white border border-gray-100 shadow-xl rounded-sm p-8  top-24'>
                        <h4 className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8'>Registry Configuration</h4>
                        
                        <div className='space-y-6'>
                            {/* Category Select */}
                            <div>
                                <label className='text-[10px] font-black uppercase mb-2 block'>Specimen Category</label>
                                <select 
                                    onChange={(e) => setSelection({...selection, category: e.target.value})}
                                    className='w-full p-3 border border-gray-100 text-xs font-bold outline-none focus:border-[#BC002D] bg-[#FCF9F4]'
                                >
                                    <option value="0">Select Category</option>
                                    <option value="60">Miniature Sheets (₹60)</option>
                                    <option value="250">Year Pack (₹250)</option>
                                    <option value="200">Sheet Let (₹200)</option>
                                    <option value="500">Block of 4 (₹500)</option>
                                    <option value="2500">Full Sheet (₹2500)</option>
                                    <option value="499">First Day Cover (₹499)</option>
                                    <option value="399">MS on FDC (₹399)</option>
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                {/* Quantity Select */}
                                <div>
                                    <label className='text-[10px] font-black uppercase mb-2 block'>Quantity</label>
                                    <select 
                                        onChange={(e) => setSelection({...selection, quantity: e.target.value})}
                                        className='w-full p-3 border border-gray-100 text-xs font-bold outline-none focus:border-[#BC002D] bg-[#FCF9F4]'
                                    >
                                        <option value="1">1 Each</option>
                                        <option value="2">2 Each</option>
                                        <option value="5">5 Each</option>
                                        <option value="10">10+ Bulk</option>
                                    </select>
                                </div>
                                {/* Cycle Select */}
                                <div>
                                    <label className='text-[10px] font-black uppercase mb-2 block'>Shipping Cycle</label>
                                    <select 
                                        onChange={(e) => setSelection({...selection, cycle: e.target.value})}
                                        className='w-full p-3 border border-gray-100 text-xs font-bold outline-none focus:border-[#BC002D] bg-[#FCF9F4]'
                                    >
                                        <option value="12">Monthly</option>
                                        <option value="4">Quarterly</option>
                                        <option value="2">Half Yearly</option>
                                        <option value="1">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            {/* Shipping Mode */}
                            <div>
                                <label className='text-[10px] font-black uppercase mb-2 block'>Shipping Mode</label>
                                <div className='grid grid-cols-2 gap-2'>
                                    <button 
                                        onClick={() => setSelection({...selection, shippingMode: 99})}
                                        className={`py-2 text-[10px] font-black uppercase border ${selection.shippingMode === 99 ? 'bg-black text-white border-black' : 'border-gray-100 text-gray-400'}`}
                                    >
                                        Speed Post (₹99)
                                    </button>
                                    <button 
                                        onClick={() => setSelection({...selection, shippingMode: 59})}
                                        className={`py-2 text-[10px] font-black uppercase border ${selection.shippingMode === 59 ? 'bg-black text-white border-black' : 'border-gray-100 text-gray-400'}`}
                                    >
                                        Registered (₹59)
                                    </button>
                                </div>
                            </div>

                            {/* Face Value Advance */}
                            <div>
                                <label className='text-[10px] font-black uppercase mb-2 block'>Advance Face Value (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="Enter Amount"
                                    onChange={(e) => setSelection({...selection, faceValueAdvance: e.target.value})}
                                    className='w-full p-3 border border-gray-100 text-xs font-bold outline-none focus:border-[#BC002D] bg-[#FCF9F4]'
                                />
                            </div>

                            {/* Summary Ledger */}
                            <div className='pt-6 border-t border-dashed border-gray-200'>
                                <div className='flex justify-between text-[11px] font-bold uppercase text-gray-400 mb-2'>
                                    <span>Base Service Fee</span>
                                    <span>₹{serviceCharge}</span>
                                </div>
                                <div className='flex justify-between text-[11px] font-bold uppercase text-gray-400 mb-4'>
                                    <span>Sub-Total (Excl. Advance)</span>
                                    <span>₹{calculateTotal()}</span>
                                </div>
                                <div className='flex justify-between items-center bg-black text-white p-4 rounded-sm'>
                                    <span className='text-[10px] font-black uppercase tracking-widest'>Grand Total</span>
                                    <span className='text-lg font-black'>₹{grandTotal}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSubscribe}
                                className='w-full bg-[#BC002D] text-white py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg'
                            >
                                Initialize Subscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceValueSubscription;