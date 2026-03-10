import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Award, ChevronLeft, Mail, Phone, Package, 
    Calendar, Loader2, History, ChevronRight, Hash 
} from 'lucide-react';
import { backendUrl } from '../App';

const UserDetail = ({ token }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pointInput, setPointInput] = useState("");
    const [adjustmentDescription, setAdjustmentDescription] = useState("");

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backendUrl}/api/user/detail/${id}`, { headers: { token } });
            if (res.data.success) {
                setUser(res.data.user);
                // Fetch transaction history after user details are confirmed
                const historyRes = await axios.post(`${backendUrl}/api/user/reward-historyadmin`, 
                    { email: res.data.user.email }, 
                    { headers: { token } }
                );
                if (historyRes.data.success) setTransactions(historyRes.data.history);
            }
        } catch (error) {
            toast.error("Failed to sync collector data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && id) fetchUserData();
    }, [id, token]);

    const handlePointAdjustment = async (action) => {
        if (!pointInput || isNaN(pointInput)) return toast.error("Enter a valid numeric valuation");
        if (!adjustmentDescription.trim()) return toast.error("Audit log description required");

        try {
            const res = await axios.post(`${backendUrl}/api/user/adjust-points`, 
                { userId: id, amount: Number(pointInput), action, description: adjustmentDescription }, 
                { headers: { token } }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                setPointInput("");
                setAdjustmentDescription("");
                fetchUserData(); // Refresh data and history
            }
        } catch (error) {
            toast.error("Registry update failed");
        }
    };

    if (loading) return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-[#FCF9F4] gap-4'>
            <Loader2 className='animate-spin text-[#BC002D]' size={32} />
            <p className='text-[10px] uppercase font-black tracking-widest text-gray-400'>Accessing Collector Archive...</p>
        </div>
    );

    return (
        <div className='p-6 md:p-12 bg-[#FCF9F4] min-h-screen font-serif'>
            <button onClick={() => navigate('/users')} className='flex items-center gap-2 text-gray-400 hover:text-black mb-8 transition-colors text-[10px] font-black uppercase tracking-widest'>
                <ChevronLeft size={14} /> Back to Registry
            </button>

            <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8'>
                
                {/* LEFT COLUMN: Identity & Adjustment */}
                <div className='lg:col-span-1 space-y-6'>
                    <div className='bg-white border border-gray-100 p-8 rounded-sm shadow-sm'>
                        <div className='flex items-center gap-4 mb-6'>
                            <div className='w-16 h-16 bg-[#BC002D] text-white flex items-center justify-center text-2xl font-black rounded-sm'>
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className='text-xl font-black uppercase tracking-tighter'>{user.name}</h2>
                                <p className='text-[10px] text-[#BC002D] font-mono'>{user.referralCode}</p>
                            </div>
                        </div>

                        <div className='space-y-3 border-t border-gray-50 pt-6 mb-8'>
                            <div className='flex items-center gap-3 text-[11px] font-bold text-gray-600 uppercase'>
                                <Mail size={14} className='text-[#BC002D]' /> <span className='lowercase'>{user.email}</span>
                            </div>
                            <div className='flex items-center gap-3 text-[11px] font-bold text-gray-600 uppercase'>
                                <Phone size={14} className='text-[#BC002D]' /> <span>{user.orders?.[0]?.address?.phone || "No Phone Registered"}</span>
                            </div>
                        </div>

                        {/* Adjustment Module */}
                        <div className='bg-[#BC002D]/5 border border-[#BC002D]/10 p-6 rounded-sm'>
                            <div className='mb-4'>
                                <p className='text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1'>Ledger Balance</p>
                                <h4 className='text-3xl font-black text-amber-500'>{user.totalRewardPoints} <span className='text-xs text-[#BC002D]/50'>PTS</span></h4>
                            </div>

                            <div className='space-y-3'>
                                <input type="number" value={pointInput} onChange={(e)=>setPointInput(e.target.value)} placeholder="Point Value" className='w-full p-3 border text-xs outline-none focus:border-black' />
                                <textarea value={adjustmentDescription} onChange={(e)=>setAdjustmentDescription(e.target.value)} placeholder="Audit Log Description..." className='w-full p-3 border text-xs outline-none focus:border-black resize-none h-20' />
                            </div>
                            
                            <div className='grid grid-cols-3 gap-2 mt-4'>
                                <button onClick={()=>handlePointAdjustment('add')} className='bg-black text-white py-2 text-[10px] font-black uppercase hover:bg-gray-800 transition-colors'>Add</button>
                                <button onClick={()=>handlePointAdjustment('subtract')} className='bg-black text-white py-2 text-[10px] font-black uppercase hover:bg-gray-800 transition-colors'>Sub</button>
                                <button onClick={()=>handlePointAdjustment('overwrite')} className='bg-[#BC002D] text-white py-2 text-[10px] font-black uppercase'>Set</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Ledger & Orders */}
                <div className='lg:col-span-2 space-y-8'>
                    
                    {/* Transaction History */}
                    <div className='bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden'>
                        <div className='p-6 border-b border-gray-100 flex items-center justify-between'>
                            <h3 className='text-xs font-black uppercase tracking-widest flex items-center gap-2'>
                                <History size={16} className='text-[#BC002D]' /> Credit Transaction Ledger
                            </h3>
                        </div>
                        <div className='divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar'>
                            {transactions.length > 0 ? transactions.map((tr, idx) => (
                                <div key={idx} className='p-4 hover:bg-gray-50 transition-colors'>
                                    <div className='flex justify-between items-start'>
                                        <div>
                                            <p className='text-[10px] font-black text-black uppercase mb-1'>{tr.title || tr.name || "Registry Sync"}</p>
                                            <p className='text-[10px] text-gray-500 italic leading-tight'>{tr.description}</p>
                                        </div>
                                        <span className={`font-black text-[11px] ${tr.isNegative || tr.type === 'REDEMPTION' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tr.amount} PTS
                                        </span>
                                    </div>
                                    <div className='flex justify-between mt-3 text-[9px] text-gray-400 font-bold uppercase'>
                                        <span>Ref: {tr.discountCode || 'Internal'}</span>
                                        <span>{new Date(tr.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className='p-12 text-center text-gray-300 text-[10px] uppercase font-bold tracking-widest'>No Record History Found</div>
                            )}
                        </div>
                    </div>

                    {/* Finalized Acquisitions */}
                    <div className='bg-white border border-gray-100 p-6 rounded-sm shadow-sm'>
                        <h3 className='text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2'>
                            <Package size={16} className='text-[#BC002D]' /> Finalized Acquisitions
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {user.orders?.filter(o => o.status === 'Delivered' || o.status === 'Completed').length > 0 ? (
                                user.orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').map(o => (
                                    <div key={o._id} onClick={() => navigate(`/orders/${o._id}`)} className='group border-l-2 border-[#BC002D] p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all cursor-pointer'>
                                        <div className='flex justify-between text-[10px] font-black uppercase mb-3'>
                                            <span className='flex items-center gap-1 text-gray-400'><Calendar size={12}/> {new Date(o.date).toLocaleDateString()}</span>
                                            <span className='text-[#BC002D]'>{o.currency} {o.amount}</span>
                                        </div>
                                        <div className='text-[9px] text-gray-600 font-bold uppercase space-y-1'>
                                            {o.items.slice(0, 2).map((item, i) => <p key={i}>• {item.name}</p>)}
                                            {o.items.length > 2 && <p className='text-gray-400'>+ {o.items.length - 2} more specimens</p>}
                                        </div>
                                        <div className='mt-4 flex justify-between items-center border-t border-dashed border-gray-200 pt-2'>
                                            <span className='text-[8px] font-black text-emerald-600 uppercase'>{o.status}</span>
                                            <span className='text-[8px] text-gray-400 font-mono'>#{o.orderNo || o._id.slice(-6)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className='col-span-2 p-12 text-center border border-dashed border-gray-200'>
                                    <p className='text-[10px] text-gray-400 italic uppercase font-bold'>No Finalized Acquisitions Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;