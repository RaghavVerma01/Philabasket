import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Ticket, CheckCircle, Loader2, X, ShieldCheck, 
    Globe, Info, Landmark, FileText, Smartphone, Mail, MapPin, CreditCard
} from 'lucide-react';

const PlaceOrder = () => {
    const [method, setMethod] = useState('cod');
    const { 
        navigate, backendUrl, token, cartItems, setCartItems, 
        getCartAmount, getDeliveryFee, products, currency, 
        userData, fetchUserData, formatPrice ,deliveryFees
    } = useContext(ShopContext);
    
    const [loading, setLoading] = useState(false);
    const [userPoints, setUserPoints] = useState(0); 
    const [usePoints, setUsePoints] = useState(false); 
    const [isVerifying, setIsVerifying] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); 

    const [countries, setCountries] = useState([]);
    const [showTerms, setShowTerms] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isApplying, setIsApplying] = useState(false);

    const [showChequeModal, setShowChequeModal] = useState(false);
    const [agreedToCheque, setAgreedToCheque] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [agreedToBankTransfer, setAgreedToBankTransfer] = useState(false);

    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', street: '',street2:'',
        city: '', state: '', zipcode: '', country: 'India', countryCode: '+91', phone: ''
    });

    const [billingData, setBillingData] = useState({
        firstName: '', lastName: '', email: '', street: '', street2:'',
        city: '', state: '', zipcode: '',phone: '', country: 'India'
    });
    // Add this near your other state declarations
const [adminSettings, setAdminSettings] = useState(null);

// Add this useEffect to fetch settings directly on mount
useEffect(() => {
    const fetchSettings = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/settings');
            if (response.data.success) {
                setAdminSettings(response.data.settings);
            }
        } catch (error) {
            console.error("Registry Settings Offline:", error);
        }
    };
    fetchSettings();
}, [backendUrl]);

    // Fetch Countries for Registry
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await axios.get('https://restcountries.com/v3.1/all?fields=name,idd,cca2');
                const sorted = res.data.map(c => ({
                    name: c.name.common,
                    code: c.cca2,
                    dial: (c.idd.root || '') + (c.idd.suffixes?.[0] || '')
                })).filter(c => c.name !== 'Pakistan')
                .sort((a, b) => a.name.localeCompare(b.name));
                setCountries(sorted);
            } catch (err) { toast.error("Geographic Registry Offline"); }
        };
        fetchCountries();
    }, []);

    // if (!deliveryFees || !deliveryFees.india) {
    //     return (
    //         <div className='flex items-center justify-center min-h-screen'>
    //             <Loader2 className='animate-spin text-[#BC002D]' size={40} />
    //         </div>
    //     );
    // }

// --- BILLING HANDLERS ---
// --- UPDATED BILLING HANDLERS ---
    
    // // 1. Handle Billing Country Change (Updates Billing Dial Code)
    // const handleBillingCountryChange = (e) => {
    //     const countryName = e.target.value;
    //     const selected = countries.find(c => c.name === countryName);
    //     setBillingData(prev => ({ 
    //         ...prev, 
    //         country: countryName, 
    //         // We store a local countryCode for billing to keep it independent
    //         countryCode: selected ? selected.dial : prev.countryCode 
    //     }));
    // };

    // 2. Handle Billing Phone
    const handleBillingPhoneChange = (e) => {
        const value = e.target.value || "";
        if (value.length <= 10) {
            setBillingData(prev => ({ ...prev, phone: value }));
        }
    };

    // 3. Handle Billing Pincode (Auto-fills City/State)
   // 1. Handle Billing Country Change (Mandatory & Dynamic Dial Code)
const handleBillingCountryChange = (e) => {
    const countryName = e.target.value;
    const selected = countries.find(c => c.name === countryName);
    setBillingData(prev => ({ 
        ...prev, 
        country: countryName, 
        countryCode: selected ? selected.dial : prev.countryCode 
    }));
};

// 2. Handle Billing Pincode (Auto-fills City/State for Billing)
const handleBillingPincodeChange = async (e) => {
    const pin = e.target.value;
        setBillingData(prev => ({ ...prev, zipcode: pin }));
        if (pin.length === 6 && billingData.country === 'India') {
            setIsVerifying(true);
            try {
                const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
                if (response.data[0].Status === "Success") {
                    const data = response.data[0].PostOffice[0];
                    setBillingData(prev => ({ ...prev, city: data.District, state: data.State }));
                    toast.success(`Registry Verified: ${data.District}`);
                }
            } catch (error) { toast.error("Pincode verification failed"); } 
            finally { setIsVerifying(false); }
        }
    };




    const handleCountryChange = (e) => {
        const countryName = e.target.value;
        
        if (countryName === 'Pakistan') {
            toast.error("Registry Note: We currently do not facilitate acquisitions for the Pakistan region.");
            return; // Prevent state update
        }
        
        const selected = countries.find(c => c.name === countryName);
        setFormData(prev => ({ 
            ...prev, 
            country: countryName, 
            countryCode: selected ? selected.dial : prev.countryCode 
        }));
    };

    // Auto-fill User Data
    useEffect(() => {
        if (!token) navigate('/login');
        else if (userData) {
            setUserPoints(userData.totalRewardPoints || 0);
            if (userData.defaultAddress?.street) {
                const adr = userData.defaultAddress;
                const [fName, ...lNameParts] = (userData.name || "").split(' ');
                setFormData(prev => ({
                    ...prev,
                    firstName: fName || '',
                    lastName: lNameParts.join(' ') || '',
                    email: userData.email || '',
                    street: adr.street || '',
                    street2:adr.street2 ||'',
                    city: adr.city || '',
                    state: adr.state || '',
                    zipcode: adr.zipCode || '',
                    phone: adr.phone || ''
                }));
            }
        } else { fetchUserData(); }
    }, [token, userData]);

    const handlePincodeChange = async (e) => {
        const pin = e.target.value;
        setFormData(prev => ({ ...prev, zipcode: pin }));
        if (pin.length === 6 && formData.country === 'India') {
            setIsVerifying(true);
            try {
                const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
                if (response.data[0].Status === "Success") {
                    const data = response.data[0].PostOffice[0];
                    setFormData(prev => ({ ...prev, city: data.District, state: data.State }));
                    toast.success(`Registry Verified: ${data.District}`);
                }
            } catch (error) { toast.error("Pincode verification failed"); } 
            finally { setIsVerifying(false); }
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (value.length <= 10) {
            setFormData({ ...formData, phone: value });
        }
    };

    const applyCoupon = async () => {
        if (!couponCode) return;
        setIsApplying(true);
        try {
            const res = await axios.post(
                backendUrl + '/api/coupon/validate', 
                { 
                    code: couponCode, 
                    amount: getCartAmount(),
                    userId: userData._id 
                },
                { headers: { token } }
            );
    
            if (res.data.success) {
                if (res.data.alreadyUsed) {
                    toast.warning("Registry Note: You have already availed this coupon code.");
                    setCouponCode('');
                    setAppliedCoupon(null);
                } else {
                    setAppliedCoupon(res.data.coupon);
                    toast.success(`Coupon Validated: ${res.data.coupon.code}`);
                }
            } else { 
                toast.error(res.data.message); 
                setAppliedCoupon(null);
                setCouponCode('');
            }
        } catch (error) { 
            toast.error(error.response?.data?.message || "Coupon registry offline"); 
        } finally { 
            setIsApplying(false); 
        }
    };

    // --- FINANCIAL SYNC ---
// Original fee from registry

// Add this state at the top of your component with other states
const [deliveryMethod, setDeliveryMethod] = useState('standard');

const calculation = useMemo(() => {
    const cartAmount = getCartAmount();
    const isIndia = formData.country === 'India';
    
    // Default fallback values if the API hasn't returned yet
    const fees = adminSettings || { 
        indiaFee: 125, 
        indiaFeeFast: 250, 
        globalFee: 749, 
        globalFeeFast: 1500,
        isIndiaFastActive: true, 
        isGlobalFastActive: true 
    };

    const FREE_SHIPPING_THRESHOLD = 4999;
    // Protocol: Free shipping only for Standard India orders >= 4999
    const isFreeShipping = cartAmount >= FREE_SHIPPING_THRESHOLD && deliveryMethod === 'standard' && isIndia;
    
    let feeApplied = 0;
    if (!isFreeShipping) {
        if (isIndia) {
            feeApplied = deliveryMethod === 'fast' ? fees.indiaFeeFast : fees.indiaFee;
        } else {
            feeApplied = deliveryMethod === 'fast' ? fees.globalFeeFast : fees.globalFee;
        }
    }
    
    const subtotal = cartAmount + feeApplied; 
    
    let couponVal = 0;
    if (appliedCoupon) {
        couponVal = appliedCoupon.discountType === 'percentage' 
            ? (cartAmount * appliedCoupon.value) / 100 
            : appliedCoupon.value;
    }

    const rewardDiscount = usePoints ? Math.min(Math.floor(userPoints / 10), subtotal - couponVal) : 0;
    const finalPayable = subtotal - couponVal - rewardDiscount;

    return {
        pointsDeducted: rewardDiscount * 10,
        couponDeducted: couponVal,
        rewardDeducted: rewardDiscount,
        totalPayable: finalPayable,
        feeApplied: feeApplied, 
        isFreeShipping: isFreeShipping 
    };
}, [cartItems, userPoints, usePoints, appliedCoupon, deliveryMethod, formData.country, getCartAmount, adminSettings]);

    const onSubmitHandler = async (e) => {
        if (e) e.preventDefault();
        if (formData.country === 'Pakistan' || (!sameAsShipping && billingData.country === 'Pakistan')) {
            return toast.error("Shipping Protocol: Deliveries to Pakistan are currently suspended.");
        }
        if (!agreedToTerms) return toast.error("Please acknowledge the Acquisition Terms.");
        if (method === 'cheque' && !agreedToCheque) return setShowChequeModal(true);
        if (method === 'bank' && !agreedToBankTransfer) return setShowBankModal(true);
        if (loading) return;
    
        try {
            setLoading(true);
            const orderItems = products.filter(p => cartItems[p._id] > 0).map(p => ({...p, quantity: cartItems[p._id]}));
            
            const orderData = {
                address: formData,
                billingAddress: sameAsShipping ? formData : billingData,
                items: orderItems,
                deliveryFee: Number(calculation.feeApplied),
                deliveryMethod: deliveryMethod, // Add this line // Clean number for DB
                amount: Number(calculation.totalPayable),
                pointsUsed: Math.round(calculation.pointsDeducted),
                couponUsed: appliedCoupon ? appliedCoupon.code : null,
                discountAmount: Number(calculation.couponDeducted),
                phone: `${formData.countryCode}${formData.phone}`,
                paymentMethod: method === 'cheque' ? 'Cheque' : method === 'bank' ? 'Direct Bank Transfer' : method.toUpperCase(),
                status: (method === 'cheque' || method === 'bank') ? 'On Hold' : 'Order Placed'
            };
    
            const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } });
            
            if (response.data.success) {
                setCartItems({});
                setAppliedCoupon(null);
                setCouponCode('');      
                setUsePoints(false);    
                
                setShowSuccess(true);
                fetchUserData();
                setTimeout(() => { navigate('/orders'); }, 4000);
            } else {
                toast.error(response.data.message);
                setLoading(false);
            }
        } catch (error) {
            toast.error("Registry synchronization failed.");
            setLoading(false);
        }
    };

    return (
        <div className='relative text-black'>
            {/* --- MODALS (Bank & Cheque) --- */}
            {showBankModal && (
                <div className='fixed inset-0 z-[600] flex items-center justify-center p-6'>
                    <div className='absolute inset-0 bg-black/70 backdrop-blur-md' onClick={() => setShowBankModal(false)}></div>
                    <div className='bg-white w-full max-w-lg relative z-10 p-8 rounded-sm shadow-2xl animate-fade-in'>
                        <div className='flex items-center justify-between mb-6 border-b pb-4'>
                            <div className='flex items-center gap-3'><Landmark size={20} className='text-[#BC002D]' /><h3 className='font-black uppercase tracking-widest text-xs'>Direct Bank Transfer</h3></div>
                            <X className='cursor-pointer' onClick={() => setShowBankModal(false)} />
                        </div>
                        <div className='bg-gray-50 p-4 mb-6 border-l-4 border-[#BC002D] text-[10px] font-bold uppercase leading-relaxed'>Use NEFT / IMPS. Order remains ON HOLD until funds clear.</div>
                        <div className='p-4 border border-gray-100 text-[11px] font-bold uppercase mb-6'>
                            <p className='text-[#BC002D] mb-2'>Beneficiary Details</p>
                            <p>Name: PhilaBasket.com</p>
                            <p>Bank: ICICI Bank | A/C: 072105001250</p>
                            <p>IFSC: ICIC0000721</p>
                        </div>
                        <div className='flex items-start gap-3 mb-6'>
                            <input type="checkbox" id="bankAgree" checked={agreedToBankTransfer} onChange={() => setAgreedToBankTransfer(!agreedToBankTransfer)} className='accent-black mt-1' />
                            <label htmlFor="bankAgree" className='text-[9px] font-black uppercase text-gray-500'>I acknowledge the bank transfer protocol.</label>
                        </div>
                        <button onClick={() => agreedToBankTransfer ? (setShowBankModal(false), onSubmitHandler()) : toast.error("Acknowledge protocol")} className='w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.2em]'>Confirm Protocol</button>
                    </div>
                </div>
            )}

            {showChequeModal && (
                <div className='fixed inset-0 z-[600] flex items-center justify-center p-6'>
                    <div className='absolute inset-0 bg-black/70 backdrop-blur-md' onClick={() => setShowChequeModal(false)}></div>
                    <div className='bg-white w-full max-w-lg relative z-10 p-8 rounded-sm shadow-2xl animate-fade-in'>
                        <div className='flex items-center justify-between mb-6 border-b pb-4'>
                            <div className='flex items-center gap-3'><FileText size={20} className='text-[#BC002D]' /><h3 className='font-black uppercase tracking-widest text-xs'>Cheque Acquisition</h3></div>
                            <X className='cursor-pointer' onClick={() => setShowChequeModal(false)} />
                        </div>
                        <div className='bg-gray-50 p-4 mb-6 border-l-4 border-[#BC002D] text-[10px] font-bold uppercase leading-relaxed'>Mail cheque to: PhilaBasket, C/O Bhavyansh, S-606 School Block, Delhi-110092.</div>
                        <div className='flex items-start gap-3 mb-6'>
                            <input type="checkbox" id="chequeAgree" checked={agreedToCheque} onChange={() => setAgreedToCheque(!agreedToCheque)} className='accent-black mt-1' />
                            <label htmlFor="chequeAgree" className='text-[9px] font-black uppercase text-gray-500'>I will dispatch the physical cheque immediately.</label>
                        </div>
                        <button onClick={() => agreedToCheque ? (setShowChequeModal(false), onSubmitHandler()) : toast.error("Acknowledge protocol")} className='w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.2em]'>Confirm Acquisition</button>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className='fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center animate-fade-in'>
                    <div className='w-20 h-20 mb-6 border-2 border-[#BC002D] flex items-center justify-center rounded-full animate-bounce'><img src={assets.logo} className='w-10 brightness-0' alt="" /></div>
                    <h2 className='text-[10px] tracking-[0.4em] uppercase text-[#BC002D] font-black'>Order Successful</h2>
                    <h1 className='text-3xl mt-4 italic'>Welcome to the Archive.</h1>
                </div>
            )}

            <form onSubmit={onSubmitHandler} className="bg-[#FCF9F4] min-h-screen flex flex-col lg:flex-row justify-center gap-8 xl:gap-12 pt-28 pb-20 px-6 md:px-12 lg:px-20 select-none">
                
                {/* COLUMN 1: SHIPPING & BILLING */}
                <div className='flex flex-col gap-6 w-full lg:max-w-[420px]'>
                    <Title text1={'SHIPPING'} text2={'REGISTRY'} />
                    
                    <div className='space-y-4'>
                        <div className='space-y-1.5'>
                            <p className='text-[9px] font-black uppercase text-gray-400 ml-1'>Acquisition Region</p>
                            <select required value={formData.country} onChange={handleCountryChange} className='w-full bg-white border border-gray-100 py-3.5 px-4 text-xs outline-none focus:border-[#BC002D] rounded-sm'>
                                {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className='grid grid-cols-2 gap-3'>
                            <input required value={formData.firstName} onChange={(e)=>setFormData({...formData, firstName: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 text-xs placeholder-gray-400 rounded-sm' placeholder='First Name' />
                            <input required value={formData.lastName} onChange={(e)=>setFormData({...formData, lastName: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 text-xs placeholder-gray-400 rounded-sm' placeholder='Last Name' />
                        </div>

                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs placeholder-gray-400 rounded-sm' placeholder='Email Address' />

                        <div className='flex flex-col gap-1'>
                            <div className='flex gap-2'>
                                <div className='w-16 bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 rounded-sm italic'>
                                    {formData.countryCode}
                                </div>
                                <input 
                                    required 
                                    value={formData.phone} 
                                    onChange={handlePhoneChange} 
                                    className={`flex-1 bg-white border py-3.5 px-4 text-xs placeholder-gray-400 rounded-sm transition-all outline-none
                                        ${formData.phone.length === 10 ? 'border-green-500' : 'border-gray-100 focus:border-[#BC002D]'}`} 
                                    placeholder='Phone Number' 
                                    type="number" 
                                />
                            </div>
                            {formData.phone.length > 0 && formData.phone.length < 10 && (
        <p className='text-[9px] font-bold text-[#BC002D] uppercase tracking-tighter'>
            Entry Incomplete: {10 - formData.phone.length} digits remaining
        </p>
    )}
                        </div>

                        <input required value={formData.street} onChange={(e)=>setFormData({...formData, street: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs placeholder-gray-400 rounded-sm' placeholder='Shipping Street' />
        <input value={formData.street2} onChange={(e)=>setFormData({...formData, street2: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs placeholder-gray-400 rounded-sm' placeholder='Street Line 2 (Area / Landmark - Optional)' />
                        
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='relative'>
                                <input required value={formData.zipcode} onChange={handlePincodeChange} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs font-mono placeholder-gray-400 rounded-sm' placeholder='Pincode' />
                                {isVerifying && <Loader2 className='absolute right-3 top-3 animate-spin text-[#BC002D]' size={14} />}
                            </div>
                            <input required value={formData.city} readOnly className='bg-gray-50 border border-gray-100 py-3.5 px-4 text-xs text-gray-500 rounded-sm' placeholder='City' />
                        </div>
                        <input required value={formData.state} readOnly className='bg-gray-50 border border-gray-100 py-3.5 px-4 w-full text-xs text-gray-500 rounded-sm' placeholder='State' />
                    </div>

                    {/* BILLING SECTION */}
                    <div className='pt-6 border-t border-gray-200 mt-2'>
                        <div className='flex items-center justify-between mb-4'>
                            <h4 className='text-[10px] font-black uppercase tracking-widest'>Billing Protocol</h4>
                            <div onClick={() => setSameAsShipping(!sameAsShipping)} className='flex items-center gap-2 cursor-pointer group'>
                                <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-all ${sameAsShipping ? 'bg-black border-black' : 'border-gray-300'}`}>
                                    {sameAsShipping && <CheckCircle size={10} className='text-white' />}
                                </div>
                                <span className='text-[9px] font-black uppercase text-gray-400'>Same as Shipping</span>
                            </div>
                        </div>
                        {!sameAsShipping && (
    <div className='space-y-4 animate-fade-in'>
        <div className='space-y-1.5'>
            <p className='text-[9px] font-black uppercase text-gray-400 ml-1'>Billing Region</p>
            <select 
                required 
                value={billingData.country} 
                onChange={handleBillingCountryChange} 
                className='w-full bg-white border border-gray-100 py-3.5 px-4 text-xs outline-none focus:border-[#BC002D] rounded-sm'
            >
                {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
        </div>

        <div className='grid grid-cols-2 gap-3'>
            <input required value={billingData.firstName} onChange={(e)=>setBillingData({...billingData, firstName: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 text-xs placeholder-gray-400 rounded-sm' placeholder='First Name' />
            <input required value={billingData.lastName} onChange={(e)=>setBillingData({...billingData, lastName: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 text-xs placeholder-gray-400 rounded-sm' placeholder='Last Name' />
        </div>

        <input required type="email" value={billingData.email} onChange={(e) => setBillingData({ ...billingData, email: e.target.value })} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs placeholder-gray-400 rounded-sm' placeholder='Email Address' />

        <div className='flex flex-col gap-1'>
            <div className='flex gap-2'>
                <div className='w-16 bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 rounded-sm italic'>
                    {billingData.countryCode || formData.countryCode} 
                </div>
                <input 
                    required 
                    value={billingData.phone} 
                    onChange={handleBillingPhoneChange} 
                    className={`flex-1 bg-white border py-3.5 px-4 text-xs placeholder-gray-400 rounded-sm transition-all outline-none
                        ${(billingData.phone || '').length === 10 ? 'border-green-500' : 'border-gray-100 focus:border-[#BC002D]'}`} 
                    placeholder='Billing Phone Number' 
                    type="number" 
                />
            </div>
            {(billingData.phone || '').length > 0 && (billingData.phone || '').length < 10 && (
                <p className='text-[9px] font-bold text-[#BC002D] uppercase tracking-tighter'>
                    Entry Incomplete: {10 - billingData.phone.length} digits remaining
                </p>
            )}
        </div>

        <input required value={billingData.street} onChange={(e)=>setBillingData({...billingData, street: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs placeholder-gray-400 rounded-sm' placeholder='Billing Street' />
        <input value={billingData.street2} onChange={(e)=>setBillingData({...billingData, street2: e.target.value})} className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs placeholder-gray-400 rounded-sm' placeholder='Billing Street Line 2 (Optional)' />
        <div className='grid grid-cols-2 gap-3'>
            <div className='relative'>
                <input 
                    required 
                    value={billingData.zipcode} 
                    onChange={handleBillingPincodeChange} 
                    className='bg-white border border-gray-100 py-3.5 px-4 w-full text-xs font-mono placeholder-gray-400 rounded-sm' 
                    placeholder='Billing Pincode' 
                />
            </div>
            {/* These values must be tied to billingData for suggestions to appear */}
            <input 
                required 
                value={billingData.city} 
                readOnly 
                className='bg-gray-50 border border-gray-100 py-3.5 px-4 text-xs text-gray-500 rounded-sm' 
                placeholder='City' 
            />
        </div>
        <input 
            required 
            value={billingData.state} 
            readOnly 
            className='bg-gray-50 border border-gray-100 py-3.5 px-4 w-full text-xs text-gray-500 rounded-sm' 
            placeholder='State' 
        />
    </div>
)}

                    </div>
                </div>

                {/* COLUMN 2: SPECIMEN OVERVIEW */}
                {/* <div className='flex flex-col gap-6 w-full lg:max-w-[340px]'>
                    <Title text1={'SPECIMEN'} text2={'OVERVIEW'} />
                    <div className='bg-white border border-gray-100 p-2 overflow-y-auto max-h-[500px] custom-scrollbar rounded-sm'>
                        {products.filter(p => cartItems[p._id] > 0).map((item, index) => (
                            <div key={index} className='flex items-center gap-4 p-3 border-b last:border-0 border-gray-50'>
                                <div className='w-12 h-12 bg-gray-50 flex-shrink-0'><img src={item.image[0]} className='w-full h-full object-contain p-1' alt="" /></div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-[10px] font-black uppercase truncate'>{item.name}</p>
                                    <p className='text-[9px] text-gray-400 font-bold'>QTY: {cartItems[item._id]}</p>
                                </div>
                                <p className='text-[11px] font-black'>₹{item.price}</p>
                            </div>
                        ))}
                    </div>
                </div> */}

                {/* COLUMN 3: LEDGER SUMMARY */}
                <div className='flex flex-col gap-6 w-full lg:max-w-[380px]'>
                    <div className='bg-white border border-gray-100 p-6 shadow-sm rounded-sm'>
                        {/* Passes Country to update shipping automatically */}
                        <CartTotal country={formData.country} deliveryMethod={deliveryMethod} />
                        
                        <div className='mt-6 flex flex-col gap-2'>
                            <div className='flex gap-2'>
                                <input 
                                    value={couponCode} 
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                                    placeholder={appliedCoupon ? "DISCOUNT ACTIVE" : "COUPON CODE"} 
                                    className={`flex-1 border px-4 py-3 text-[10px] font-black outline-none rounded-sm ${appliedCoupon ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-100'}`} 
                                    disabled={!!appliedCoupon}
                                />
                                {appliedCoupon ? (
                                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className='bg-red-50 text-red-600 border border-red-100 px-5 py-3 text-[9px] font-black uppercase rounded-sm'>Remove</button>
                                ) : (
                                    <button type="button" onClick={applyCoupon} className='bg-black text-white px-5 py-3 text-[9px] font-black uppercase rounded-sm'>Apply</button>
                                )}
                            </div>
                        </div>

                        <div className='mt-4 flex items-center justify-between p-3 border border-dashed border-[#BC002D]/30 bg-[#BC002D]/5 rounded-sm'>
                            <div className='flex items-center gap-2'>
                                <input type="checkbox" id="pts" checked={usePoints} onChange={() => setUsePoints(!usePoints)} className='accent-[#BC002D]' />
                                <label htmlFor="pts" className='text-[9px] font-black text-[#BC002D] uppercase cursor-pointer'>Use Credits ({userPoints} PTS)</label>
                            </div>
                        </div>

                        <div className='mt-6 pt-4 border-t border-gray-100 space-y-2'>
                            {appliedCoupon && <div className='flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest'><span>Coupon</span><span>-₹{calculation.couponDeducted.toFixed(0)}</span></div>}
                            {usePoints && <div className='flex justify-between text-[10px] font-black text-[#BC002D] uppercase tracking-widest'><span>Points</span><span>-₹{calculation.rewardDeducted.toFixed(0)}</span></div>}
                            <div className='flex justify-between pt-4 border-t border-black'><p className='text-[10px] font-black uppercase text-gray-400'>Final Total</p><p className='text-lg font-black text-[#BC002D]'>₹{calculation.totalPayable.toFixed(2)}</p></div>
                        </div>
                    </div>


                    <div className='flex items-start gap-3 p-4 bg-white border border-gray-100 mt-4 rounded-sm'>
                        <input required type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} className='mt-1 accent-black' />
                        <p className='text-[9px] text-gray-400 font-bold uppercase leading-relaxed'>I accept the <span onClick={(e) => {e.stopPropagation(); setShowTerms(true)}} className='text-[#BC002D] cursor-pointer underline'>Acquisition Terms</span>.</p>
                    </div>


                    {/* SHIPPING METHOD SELECTION */}
{/* SHIPPING METHOD SELECTION */}
{/* SHIPPING METHOD SELECTION */}
<div className='flex flex-col gap-3 mb-6'>
    <div className='flex items-center gap-2 mb-2'>
        <MapPin size={14} className='text-[#BC002D]' />
        <h4 className='text-[10px] font-black uppercase tracking-widest'>Shipping Method</h4>
    </div>
    
    <div className='grid grid-cols-1 gap-2'>
    {/* Standard Option */}
    <div 
        onClick={() => setDeliveryMethod('standard')}
        className={`flex items-center justify-between p-4 cursor-pointer border rounded-sm transition-all ${deliveryMethod === 'standard' ? 'border-[#BC002D] bg-[#BC002D]/5' : 'border-gray-100 bg-white'}`}
    >
        <div className='flex items-center gap-3'>
            <div className={`w-2.5 h-2.5 border rounded-full ${deliveryMethod === 'standard' ? 'bg-[#BC002D] border-[#BC002D]' : 'border-gray-300'}`}></div>
            <div>
                <p className='text-[10px] font-black uppercase'>Standard Delivery</p>
                <p className='text-[9px] text-gray-400 font-bold uppercase'>Estimated 5-7 Working Days</p>
            </div>
        </div>
        <p className='text-xs font-black'>
            {calculation.isFreeShipping ? 'FREE' : `₹${formData.country === 'India' ? (adminSettings?.indiaFee || 125) : (adminSettings?.globalFee || 749)}`}
        </p>
    </div>

    {/* Conditional Fast Option based on Database Toggles */}
    {((formData.country === 'India' && (adminSettings?.isIndiaFastActive ?? true)) || 
      (formData.country !== 'India' && (adminSettings?.isGlobalFastActive ?? true))) && (
        <div 
            onClick={() => setDeliveryMethod('fast')}
            className={`flex items-center justify-between p-4 cursor-pointer border rounded-sm transition-all ${deliveryMethod === 'fast' ? 'border-[#BC002D] bg-[#BC002D]/5' : 'border-gray-100 bg-white'}`}
        >
            <div className='flex items-center gap-3'>
                <div className={`w-2.5 h-2.5 border rounded-full ${deliveryMethod === 'fast' ? 'bg-[#BC002D] border-[#BC002D]' : 'border-gray-300'}`}></div>
                <div>
                    <p className='text-[10px] font-black uppercase'>⚡ Fast Delivery</p>
                    <p className='text-[9px] text-gray-400 font-bold uppercase'>Estimated 2-3 Working Days</p>
                </div>
            </div>
            <p className='text-xs font-black'>
                ₹{formData.country === 'India' ? (adminSettings?.indiaFeeFast || 250) : (adminSettings?.globalFeeFast || 1500)}
            </p>
        </div>
    )}
</div>
</div>


                    <div className='space-y-3'>
                        <Title text1={'PAYMENT'} text2={'PROTOCOL'} />
                        <div className='grid grid-cols-1 gap-2 mt-4'>
                            {[
                                {id:'stripe', label:'Stripe / Global', icon:Globe},
                                {id:'razorpay', label:'Razorpay / UPI', icon:Smartphone},
                                {id:'bank', label:'Bank Transfer', icon:Landmark},
                                {id:'cheque', label:'Cheque Payment', icon:FileText},
                                {id:'cod', label:'Cash on Delivery', icon:Mail}
                            ].map((m) => (
                                <div key={m.id} onClick={() => setMethod(m.id)} className={`flex items-center justify-between p-4 cursor-pointer border rounded-sm ${method === m.id ? 'border-[#BC002D] bg-[#BC002D]/5' : 'border-gray-100 bg-white opacity-60'}`}>
                                    <div className='flex items-center gap-3'>
                                        <div className={`w-2.5 h-2.5 border rounded-full ${method === m.id ? 'bg-[#BC002D] border-[#BC002D]' : 'border-gray-300'}`}></div>
                                        <p className='text-[10px] font-black uppercase'>{m.label}</p>
                                    </div>
                                    <m.icon size={14} className={method === m.id ? 'text-[#BC002D]' : 'text-gray-300'} />
                                </div>
                            ))}
                        </div>
                        <button type='submit' disabled={loading} className='w-full bg-black text-white py-4 mt-4 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-[#BC002D] rounded-sm transition-all'>
                            {loading ? <Loader2 className='animate-spin mx-auto' size={16} /> : 'Confirm Acquisition'}
                        </button>
                    </div>
                </div>
            </form>

            {/* --- TERMS OVERLAY --- */}
            {showTerms && (
                <div className='fixed inset-0 z-[800] flex items-center justify-center p-6'>
                    <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={() => setShowTerms(false)}></div>
                    <div className='bg-white w-full max-w-lg relative z-10 p-10 shadow-2xl animate-fade-in'>
                        <div className='flex justify-between items-center mb-6 border-b pb-4'><h3 className='font-black uppercase tracking-widest text-xs'>Acquisition Terms</h3><X className='cursor-pointer' onClick={() => setShowTerms(false)} /></div>
                        <p className='text-[10px] font-semibold text-gray-500 leading-relaxed'>
    <strong className='text-black'># Product Condition:</strong><br /><br />
    
    All images on the website are referral – due to multiple quantity listing we cannot change images of thousands of items every time. 
    Hence, the block of stamps having a margin in the image may have a different side margin or no margin at all. 
    Similarly, traffic lights in blocks of stamps or single stamps may be present in the image but not in the item delivered. 
    All images are only referral except for the items listed in the errors/oddities category.<br /><br />

    <strong className='text-black'># The condition of the stamps may be defined as follows:</strong><br /><br />
    
    <strong>MNH</strong> – Mint Never Hinged<br />
    <strong>MLH</strong> – Mint Lightly Hinged<br />
    <strong>MH</strong> – Mint Hinged (Heavy Hinge Mark)<br />
    <strong>MM</strong> – Mounted Mint (Stamp is unused but stuck on paper)<br /><br />

    For all <strong>Mint Never Hinged</strong> stamps, please understand that all stamps are in excellent condition from the year 1990 onwards (white gum, no marks/spots).<br /><br />
    
    Stamps for the period <strong>1957-1988</strong> are mixed in condition (white to light yellow) due to the tropicalization of gum in India's climate and older printing technology. Stamps <strong>before 1957</strong> may be completely tropicalized.<br /><br />

    Regarding <strong>FDC (First Day Covers)</strong>, the cancellation on the stamp, the position of the cancellation, and the stamps themselves may differ from the image due to multiple quantity listings. Many cancellations are hand-stamped in philatelic bureaus, which may result in slight smudging; these are general conditions and not major damage.<br /><br />

    We strive to provide the best condition possible. If you are not satisfied, there is always an <strong>option for a refund</strong>.<br /><br />

    <strong className='text-black'># EXCHANGE:</strong><br /><br />
    
    If you bought an item by mistake and want an exchange, you must intimate us via email at <strong>Admin@philabasket.com</strong> within 24 hours of receiving the materials. 
    Additional shipping charges shall be borne by the buyer. The exchanged material will be sent after we receive the original item. 
    Any difference in amount shall be settled and communicated via email.
</p>
                        <button onClick={() => { setAgreedToTerms(true); setShowTerms(false); }} className='w-full mt-8 bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest'>Accept Terms</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaceOrder;