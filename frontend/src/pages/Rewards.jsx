import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Trophy, History, Zap, Wallet, ArrowUpRight, ArrowDownLeft, Ticket, Loader2, Star, TrendingUp, BarChart3 ,Plus,Minus,Package,ShoppingBag} from 'lucide-react';
import axios from 'axios';

const Rewards = () => {
    const navigate = useNavigate();
    const { userPoints, currency, token, backendUrl ,formatPrice } = useContext(ShopContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);



    
    const conversionRate = 10; 
    const cashValue = (userPoints / conversionRate).toFixed(2);

    // --- ANALYTICS CALCULATIONS ---
    const stats = useMemo(() => {
        const gained = history
            .filter(item => !item.isNegative)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        
        const used = history
            .filter(item => item.isNegative)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        return { gained, used };
    }, [history]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(backendUrl + '/api/user/reward-history', { 
                    headers: { token } 
                });
                if (res.data.success) {
                    setHistory(res.data.history);
                }
            } catch (err) {
                console.error("Ledger Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchHistory();
    }, [token, backendUrl]);

    return (
        <div className='bg-white min-h-screen pt-10 pb-20 px-6 md:px-16 lg:px-24 select-none animate-fade-in'>
            
            {/* --- HEADER --- */}
            <div className='mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div>
                    <div className='flex items-center gap-4 mb-4'>
                        <span className='h-[1.5px] w-12 bg-[#BC002D]'></span>
                        <p className='text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black'>Member Privileges</p>
                    </div>
                    <h2 className='text-4xl md:text-6xl font-bold text-gray-900 tracking-tighter uppercase'>
                        Collector <span className='text-[#BC002D]'>Rewards.</span>
                    </h2>
                </div>

                {/* --- NEW: ANALYTICS SUMMARY MINI-CARD --- */}
                <div className='flex items-center gap-8 bg-gray-50 p-6 rounded-3xl border border-gray-100'>
                    <div className='text-center'>
                        <p className='text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1'>Lifetime Gained</p>
                        <p className='text-xl font-bold text-green-600 tracking-tighter'>+{stats.gained.toLocaleString()}</p>
                    </div>
                    <div className='w-[1px] h-8 bg-gray-200'></div>
                    <div className='text-center'>
                        <p className='text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1'>Total Redeemed</p>
                        <p className='text-xl font-bold text-gray-900 tracking-tighter'>-{stats.used.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-12'>
                
                {/* --- LEFT: USER STATUS CARD --- */}
                <div className='lg:col-span-1 space-y-6'>
                    <div className='bg-black p-10 rounded-br-[80px] shadow-2xl relative overflow-hidden group'>
                        <div className='absolute -right-10 -top-10 w-40 h-40 bg-[#BC002D]/10 rounded-full blur-3xl group-hover:bg-[#BC002D]/30 transition-all duration-700'></div>
                        
                        <div className='relative z-10'>
                            <p className='text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-10'>Current Vault Balance</p>
                            <div className='flex items-end gap-3 mb-2'>
                                <h3 className='text-white text-7xl font-bold tracking-tighter'>{userPoints || 0}</h3>
                                <p className='text-amber-400 text-xs font-black uppercase tracking-widest pb-3'>Points</p>
                            </div>
                            <div className='flex items-center gap-2 text-white/60 mb-12'>
                                <Wallet size={14} />
                                <p className='text-[11px] font-bold uppercase tracking-widest'>Valued at ≈ {currency}{cashValue}</p>
                            </div>

                            <button onClick={() => navigate('/cart')} className='w-full bg-[#BC002D] text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-lg shadow-[#BC002D]/20 active:scale-95'>
                                Apply in Checkout
                            </button>
                        </div>
                    </div>
                    
                    <div className='bg-gray-50 p-8 rounded-[40px] border border-gray-100'>
                        <div className='flex items-center gap-3 mb-6'>
                            <BarChart3 className='text-[#BC002D]' size={18} />
                            <h4 className='text-[10px] font-black uppercase text-gray-700 tracking-[0.2em]'>Acquisition Stats</h4>
                        </div>
                        <div className='space-y-4'>
                            <div className='flex justify-between items-center'>
                                <p className='text-[10px] font-bold text-gray-700 uppercase'>Gained from Orders</p>
                                <p className='text-sm font-black text-green-600'>+{stats.gained}</p>
                            </div>
                            <div className='flex justify-between items-center'>
                                <p className='text-[10px] font-bold text-gray-700 uppercase'>Reedemption and Vouchers</p>
                                <p className='text-sm font-black text-gray-900'>{stats.used}</p>
                            </div>
                            <div className='h-[1px] bg-gray-200 w-full my-2'></div>
                            <div className='flex justify-between items-center'>
                                <p className='text-[10px] font-black text-black uppercase'>Active Savings</p>
                                <p className='text-sm font-black text-[#BC002D]'>{userPoints}</p>
                            </div>
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-3xl border border-[#BC002D]/10 shadow-sm relative overflow-hidden'>
        <div className='absolute -right-4 -bottom-4 opacity-5 rotate-12'>
            <TrendingUp size={80} className='text-[#BC002D]' />
        </div>
        <div className='relative z-10'>
            <p className='text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1'>Lifetime Savings Value</p>
            <h5 className='text-2xl font-black tracking-tighter'>
    <span className="text-gray-900 mr-1.5">{currency}</span>
    <span className="text-green-600">
        {formatPrice(stats.gained / conversionRate)}
    </span>
</h5>
            <div className='mt-3 flex items-center gap-2'>
                <div className='px-2 py-0.5 bg-green-50 rounded flex items-center gap-1'>
                    <TrendingUp size={10} className='text-green-600' />
                    <span className='text-[8px] font-black text-green-600 uppercase'>Sovereign Asset</span>
                </div>
                <p className='text-[8px] font-bold text-gray-400 uppercase italic'>Verified Valuation</p>
            </div>
        </div>
    </div>
                </div>


                {/* --- RIGHT: DYNAMIC REGISTRY LEDGER --- */}
                <div className='lg:col-span-2 space-y-12'>
    <div className='bg-gray-50/50 border border-gray-100 rounded-[40px] p-8 md:p-12'>
        <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-4'>
                <History size={18} className='text-gray-900' />
                <h4 className='text-sm font-black uppercase tracking-[0.3em] text-gray-900'>Registry Ledger</h4>
            </div>
            <span className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>{history.length} Entries</span>
        </div>

        <div className='space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#BC002D]" /></div>
            ) : history.length > 0 ? (
                history.map((item, index) => {
                    const isRedemption = item.isNegative === true;
                    const isOrderAction = item.type === 'ORDER_EARN' || item.type === 'ORDER_REDEEM';
                    
                    // Extract Order Number: 
                    // It checks if 'orderNo' exists directly (from your new data), 
                    // or falls back to parsing the description for the # symbol.
                    const displayOrderNo = item.orderNo || (item.description?.includes('#') ? item.description.split('#')[1].split(' ')[0] : null);
                
                    const renderIcon = () => {
                        switch(item.type) {
                            case 'ORDER_EARN': return <Package size={16} />;
                            case 'ORDER_REDEEM': return <ShoppingBag size={16} />;
                            case 'VOUCHER': return <Ticket size={16} />;
                            default: return isRedemption ? <Minus size={14} /> : <Plus size={14} />;
                        }
                    };
                
                    return (
                        <div key={index} className='flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-[#BC002D]/30 transition-all group overflow-hidden mb-4'>
                            
                            {/* --- SOVEREIGN REFERENCE BAR --- */}
                            {isOrderAction && displayOrderNo && (
                                <div className='bg-gray-50/80 px-6 py-2 border-b border-gray-100 flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <span className='w-1 h-1 bg-[#BC002D] rounded-full'></span>
                                        <p className='text-[8px] font-black text-[#BC002D] uppercase tracking-[0.2em]'>
                                            Registry Order: <span className='text-gray-900'>#{displayOrderNo}</span>
                                        </p>
                                    </div>
                                    <p className='text-[7px] font-bold text-gray-400 uppercase tracking-widest'>Verified Acquisition</p>
                                </div>
                            )}
                
                            <div className='flex items-center justify-between p-6'>
                                <div className='flex items-center gap-4'>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                        !isRedemption ? 'bg-green-100 text-green-600' : 'bg-red-50 text-[#BC002D]'
                                    }`}>
                                        {renderIcon()}
                                    </div>
                                    
                                    <div>
                                        <p className='text-[10px] font-black text-gray-900 uppercase tracking-widest group-hover:text-[#BC002D] transition-colors'>
                                            {item.title}
                                        </p>
                                        <p className='text-[8px] font-bold text-gray-400 uppercase mt-1'>
                                            {/* We clean the description if OrderNo is already shown above */}
                                            {isOrderAction ? 'Processed via Archive Ledger' : item.description} • {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                </div>
                
                                <div className='text-right'>
                                    <p className={`text-sm font-black tabular-nums ${!isRedemption ? 'text-green-600' : 'text-red-600'}`}>
                                        {isRedemption ? '-' : '+'}{item.amount} <span className="text-[10px]">Coins</span>
                                    </p>
                                    
                                    <span className='text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-gray-900 text-white'>
                                        used
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className='py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200'>
                    <Trophy size={32} className='mx-auto text-gray-200 mb-4' />
                    <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Registry Archive Empty.</p>
                </div>
            )}
        </div>
    </div>
</div>
            </div>
        </div>
    );
};

export default Rewards;