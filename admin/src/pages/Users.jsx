import React, { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom'

import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Search, Award, X, ChevronRight, Mail, Phone, 
    MapPin, Package, Calendar, Loader2, ChevronLeft 
} from 'lucide-react';
import { backendUrl } from '../App';

const Users = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false); // Specific loader for drawer
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [pointInput, setPointInput] = useState("");
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // 1. Fetch Users with search and page parameters
    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${backendUrl}/api/user/admin-list?page=${page}&limit=10&search=${searchTerm}`, 
                { headers: { token } }
            );
            if (res.data.success) {
                setUsers(res.data.users);
                setTotalPages(res.data.totalPages);
                setCurrentPage(res.data.currentPage);
            }
        } catch (error) { 
            toast.error("Registry Sync Failed"); 
        } finally {
            setLoading(false);
        }
    };

    // 2. Search Debounce: Trigger fetch when searchTerm changes (waits 500ms)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers(1); // Always reset to page 1 on new search
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // 3. Fetch Full Details for a Single User
    const handleSelectUser = async (user) => {
        setSelectedUser(user); // Open drawer immediately with basic info
        setDetailLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/user/detail/${user._id}`, { headers: { token } });
            if (res.data.success) {
                setSelectedUser(res.data.user); // Update with full order history
            }
        } catch (error) {
            toast.error("Failed to load collector history");
        } finally {
            setDetailLoading(false);
        }
    };

    const handlePointAdjustment = async (action) => {
        if (!pointInput || isNaN(pointInput)) return toast.error("Enter a valid numeric valuation");
        
        // Add a confirmation for 'overwrite' or large subtractions
        if (action === 'overwrite' && !window.confirm("Are you sure you want to manually set the total balance? This bypasses standard accrual.")) return;
    
        try {
            const res = await axios.post(backendUrl + '/api/user/adjust-points', 
                { userId: selectedUser._id, amount: Number(pointInput), action }, 
                { headers: { token } }
            );
            
            if (res.data.success) {
                toast.success(res.data.message);
                setPointInput("");
                
                // Sync main table
                fetchUsers(currentPage);
                
                // Sync Drawer State with the exact value from DB
                setSelectedUser(prev => ({
                    ...prev, 
                    totalRewardPoints: res.data.newBalance 
                }));
            }
        } catch (error) { 
            toast.error("Update Failed"); 
        }
    };

    return (
        <div className='p-6 bg-[#FCF9F4] min-h-screen font-serif'>
            <div className='flex items-center justify-between mb-8'>
                <h2 className='text-2xl font-black uppercase tracking-tighter'>Collector <span className='text-[#BC002D]'>Registry</span></h2>
                <div className='relative w-72'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Archive..." 
                        value={searchTerm} 
                        onChange={(e)=>setSearchTerm(e.target.value)} 
                        className='w-full pl-10 pr-4 py-2 border border-gray-100 rounded-sm text-xs outline-none focus:border-[#BC002D]' 
                    />
                </div>
            </div>

            <div className='bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden'>
                <table className='w-full text-left text-xs uppercase font-bold'>
                    <thead className='bg-gray-50 text-gray-400 border-b border-gray-100'>
                        <tr>
                            <th className='p-4'>Collector</th>
                            <th className='p-4'>Promo Code</th>
                            <th className='p-4'>Credits</th>
                            <th className='p-4 text-right'>Action</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50'>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className='p-20 text-center'>
                                    <div className='flex flex-col items-center gap-4'>
                                        <Loader2 className='animate-spin text-[#BC002D]' size={32} />
                                        <p className='text-[10px] tracking-widest text-gray-400'>Accessing Registry Ledger...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map(u => (
                                <tr key={u._id} className='hover:bg-gray-50/50 transition-colors'>
                                    <td className='p-4'>
                                        <div className='flex flex-col'>
                                            <span className='text-black'>{u.name}</span>
                                            <span className='text-[10px] text-gray-400 lowercase font-medium'>{u.email}</span>
                                        </div>
                                    </td>
                                    <td className='p-4 font-mono text-[#BC002D]'>{u.referralCode}</td>
                                    <td className='p-4 text-amber-600'>{u.totalRewardPoints} PTS</td>
                                    <td className='p-4 text-right'>
                                        <button onClick={()=>handleSelectUser(u)} className='p-2 hover:bg-[#BC002D] hover:text-white rounded-sm transition-all'>
                                            <ChevronRight size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className='p-10 text-center text-gray-400 italic'>No specimens found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
                <div className='flex items-center justify-center gap-4 mt-8'>
                    <button disabled={currentPage === 1} onClick={() => fetchUsers(currentPage - 1)} className='p-2 border border-gray-100 rounded-sm disabled:opacity-30 hover:bg-gray-50'><ChevronLeft size={16} /></button>
                    <span className='text-[10px] font-black uppercase tracking-widest'>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => fetchUsers(currentPage + 1)} className='p-2 border border-gray-100 rounded-sm disabled:opacity-30 hover:bg-gray-50'><ChevronRight size={16} /></button>
                </div>
            )}

            {/* DRAWER */}
            {selectedUser && (
                <div className='fixed inset-0 z-[500] flex justify-end'>
                    <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={()=>setSelectedUser(null)}></div>
                    <div className='relative w-full max-w-lg bg-white h-full shadow-2xl p-8 overflow-y-auto animate-slide-in'>
                        <div className='flex justify-between items-center mb-8 border-b pb-4'>
                            <h3 className='font-black uppercase tracking-widest text-sm'>Collector Profile</h3>
                            <X className='cursor-pointer' onClick={()=>setSelectedUser(null)} />
                        </div>

                        {detailLoading ? (
                             <div className='flex flex-col items-center justify-center h-64 gap-4'>
                                <Loader2 className='animate-spin text-[#BC002D]' />
                                <p className='text-[10px] uppercase font-black tracking-widest text-gray-400'>Syncing Acquisitions...</p>
                             </div>
                        ) : (
                            <>
                                <div className='space-y-4 mb-8 text-[11px] font-bold uppercase'>
                                    <div className='flex items-center gap-3'><Mail size={14} className='text-[#BC002D]' /><span className='lowercase'>{selectedUser.email}</span></div>
                                    <div className='flex items-center gap-3'><Phone size={14} className='text-[#BC002D]' /><span>{selectedUser.orders?.[0]?.address?.phone || "No Phone"}</span></div>
                                </div>

                                <div className='bg-[#BC002D]/5 border border-[#BC002D]/10 p-6 rounded-sm mb-8'>
                                <div className='flex justify-between items-start mb-4'>
        <div>
            <p className='text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1'>Current Balance</p>
            <h4 className='text-3xl font-black text-amber-400'>{selectedUser.totalRewardPoints} <span className='text-xs text-white/50'>PTS</span></h4>
        </div>
        <Award className='text-amber-400 opacity-20' size={40} />
    </div>
                                    <input type="number" value={pointInput} onChange={(e)=>setPointInput(e.target.value)} placeholder="Valuation..." className='w-full p-3 border mb-4 text-xs' />
                                    
                                    <div className='grid grid-cols-3 gap-2'>
                                        <button onClick={()=>handlePointAdjustment('add')} className='bg-black text-white py-2 text-[10px] font-black uppercase'>Add</button>
                                        <button onClick={()=>handlePointAdjustment('subtract')} className='bg-black text-white py-2 text-[10px] font-black uppercase'>Sub</button>
                                        <button onClick={()=>handlePointAdjustment('overwrite')} className='bg-[#BC002D] text-white py-2 text-[10px] font-black uppercase'>Set</button>
                                    </div>
                                </div>

                                <div className='space-y-6'>
    <h4 className='text-[10px] font-black uppercase tracking-widest text-gray-400'>
        Finalized Acquisitions
    </h4>
    
    {/* Filter only for Delivered or Completed orders */}
    {selectedUser.orders?.filter(o => o.status === 'Delivered' || o.status === 'Completed').length > 0 ? (
        selectedUser.orders
            .filter(o => o.status === 'Delivered' || o.status === 'Completed')
            .map(o => (
                <div 
                    key={o._id} 
                    onClick={() => navigate(`/orders/${o._id}`)} // Link to Detail Page
                    className='group border-l-2 border-[#BC002D] pl-4 py-4 bg-gray-50 rounded-r-sm cursor-pointer hover:bg-white hover:shadow-md transition-all border-y border-r border-transparent hover:border-gray-100'
                >
                    <div className='flex justify-between text-[10px] font-black uppercase mb-3'>
                        <div className='flex items-center gap-2 text-gray-500'>
                            <Calendar size={12}/>
                            {new Date(o.date).toLocaleDateString()}
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className='text-[#BC002D]'>{o.currency} {o.amount}</span>
                            <ChevronRight size={10} className='opacity-0 group-hover:opacity-100 transition-opacity' />
                        </div>
                    </div>
                    
                    <div className='space-y-2'>
                        {o.items.map((item, idx) => (
                            <div key={idx} className='text-[10px] text-gray-600 font-bold uppercase flex items-center gap-2 mb-1'>
                                <Package size={10} className='text-gray-400' /> 
                                {item.name} <span className='text-[#BC002D] ml-auto'>x{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className='mt-3 pt-2 border-t border-dashed border-gray-200 flex justify-between items-center'>
                        <span className='text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase'>
                            {o.status}
                        </span>
                        <span className='text-[8px] font-medium text-gray-400'>
                            REF: {o.orderNo || o._id.slice(-6)}
                        </span>
                    </div>
                </div>
            ))
    ) : (
        <div className='p-8 text-center border border-dashed border-gray-200 rounded-sm'>
            <p className='text-[10px] text-gray-400 italic uppercase font-bold'>
                No Completed Specimens Found
            </p>
        </div>
    )}
</div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;