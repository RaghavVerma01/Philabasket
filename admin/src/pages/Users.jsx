import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Search, Award, X, ChevronRight, Mail, Phone, 
    MapPin, Package, Calendar, Loader2, ChevronLeft 
} from 'lucide-react';
import { backendUrl } from '../App';

const Users = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Loader state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [pointInput, setPointInput] = useState("");
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(backendUrl + '/api/user/admin-list', { headers: { token } });
            if (res.data.success) setUsers(res.data.users);
        } catch (error) { 
            toast.error("Registry Sync Failed"); 
        } finally {
            setLoading(false);
        }
    };

    const handlePointAdjustment = async (action) => {
        if (!pointInput || isNaN(pointInput)) return toast.error("Enter a valid numeric valuation");
        try {
            const res = await axios.post(backendUrl + '/api/user/adjust-points', 
                { userId: selectedUser._id, amount: Number(pointInput), action }, 
                { headers: { token } }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                setPointInput("");
                fetchUsers();
                setSelectedUser(prev => ({
                    ...prev, 
                    totalRewardPoints: action === 'overwrite' ? Number(pointInput) : (action === 'add' ? prev.totalRewardPoints + Number(pointInput) : prev.totalRewardPoints - Number(pointInput))
                }));
            }
        } catch (error) { toast.error("Update Failed"); }
    };

    useEffect(() => { fetchUsers(); }, [token]);

    // Derived State for filtering and pagination
    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page on search
    }, [searchTerm]);

    return (
        <div className='p-6 bg-[#FCF9F4] min-h-screen font-serif'>
            {/* HEADER */}
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

            {/* MAIN TABLE WITH LOADER */}
            <div className='bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden'>
                <table className='w-full text-left text-xs uppercase font-bold'>
                    <thead className='bg-gray-50 text-gray-400 border-b border-gray-100'>
                        <tr>
                            <th className='p-4'>Collector</th>
                            <th className='p-4'>Promo Code</th>
                            <th className='p-4'>Credits</th>
                            <th className='p-4'>Orders</th>
                            <th className='p-4 text-right'>Action</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50'>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className='p-20 text-center'>
                                    <div className='flex flex-col items-center gap-4'>
                                        <Loader2 className='animate-spin text-[#BC002D]' size={32} />
                                        <p className='text-[10px] tracking-widest text-gray-400'>Accessing Registry Ledger...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : currentUsers.length > 0 ? (
                            currentUsers.map(u => (
                                <tr key={u._id} className='hover:bg-gray-50/50 transition-colors'>
                                    <td className='p-4'>
                                        <div className='flex flex-col'>
                                            <span className='text-black'>{u.name}</span>
                                            <span className='text-[10px] text-gray-400 lowercase font-medium'>{u.email}</span>
                                        </div>
                                    </td>
                                    <td className='p-4'><span className='bg-gray-100 px-2 py-1 rounded-sm text-[#BC002D] font-mono'>{u.referralCode}</span></td>
                                    <td className='p-4'><span className='text-amber-600'>{u.totalRewardPoints} PTS</span></td>
                                    <td className='p-4 text-gray-400'>{u.orders?.length || 0} Acquisitions</td>
                                    <td className='p-4 text-right'>
                                        <button onClick={()=>setSelectedUser(u)} className='p-2 hover:bg-[#BC002D] hover:text-white rounded-sm transition-all'><ChevronRight size={16}/></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className='p-10 text-center text-gray-400 italic'>No specimens found in this criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {!loading && totalPages > 1 && (
                <div className='flex items-center justify-center gap-4 mt-8'>
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className='p-2 border border-gray-100 rounded-sm disabled:opacity-30 hover:bg-gray-50 transition-colors'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className='text-[10px] font-black uppercase tracking-widest'>Page {currentPage} of {totalPages}</span>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className='p-2 border border-gray-100 rounded-sm disabled:opacity-30 hover:bg-gray-50 transition-colors'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* DETAIL DRAWER (Same as before) */}
            {selectedUser && (
                <div className='fixed inset-0 z-[500] flex justify-end'>
                    <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={()=>setSelectedUser(null)}></div>
                    <div className='relative w-full max-w-lg bg-white h-full shadow-2xl p-8 overflow-y-auto animate-slide-in'>
                        <div className='flex justify-between items-center mb-8 border-b pb-4'>
                            <h3 className='font-black uppercase tracking-widest text-sm'>Collector Profile</h3>
                            <X className='cursor-pointer' onClick={()=>setSelectedUser(null)} />
                        </div>

                        {/* CONTACT INFO */}
                        <div className='space-y-4 mb-8 text-[11px] font-bold uppercase'>
                            <div className='flex items-center gap-3'><Mail size={14} className='text-[#BC002D]' /><span className='lowercase'>{selectedUser.email}</span></div>
                            {/* Taking phone from the first available order address if defaultAddress is empty */}
                            <div className='flex items-center gap-3'><Phone size={14} className='text-[#BC002D]' /><span>{selectedUser.orders[0]?.address?.phone || "No Phone Registered"}</span></div>
                            <div className='flex items-start gap-3'>
                                <MapPin size={14} className='text-[#BC002D] mt-0.5' />
                                <span>
                                    {selectedUser.orders[0]?.address?.street || "No address"}<br/>
                                    {selectedUser.orders[0]?.address?.city}, {selectedUser.orders[0]?.address?.state} {selectedUser.orders[0]?.address?.zipCode}
                                </span>
                            </div>
                        </div>

                        {/* POINT ADJUSTMENT */}
                        <div className='bg-[#BC002D]/5 border border-[#BC002D]/10 p-6 rounded-sm mb-8'>
                            <div className='flex items-center gap-3 mb-4'>
                                <Award className='text-[#BC002D]' size={20} />
                                <p className='font-black text-xs uppercase tracking-widest'>Archive Credits: {selectedUser.totalRewardPoints}</p>
                            </div>
                            <input 
                                type="number" 
                                value={pointInput} 
                                onChange={(e)=>setPointInput(e.target.value)} 
                                placeholder="Point Valuation..." 
                                className='w-full p-3 border border-gray-100 text-xs mb-4 outline-none focus:border-[#BC002D]' 
                            />
                            <div className='grid grid-cols-3 gap-2'>
                                <button onClick={()=>handlePointAdjustment('add')} className='bg-black text-white py-2 text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors'>Add</button>
                                <button onClick={()=>handlePointAdjustment('subtract')} className='bg-black text-white py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors'>Sub</button>
                                <button onClick={()=>handlePointAdjustment('overwrite')} className='bg-[#BC002D] text-white py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors'>Set</button>
                            </div>
                        </div>

                        {/* ACQUISITION HISTORY */}
                        <div className='space-y-6'>
                            <h4 className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Registry Acquisitions</h4>
                            {selectedUser.orders?.length > 0 ? selectedUser.orders.map(o => (
                                <div key={o._id} className='border-l-2 border-[#BC002D] pl-4 py-4 bg-gray-50 rounded-r-sm'>
                                    <div className='flex justify-between text-[10px] font-black uppercase mb-3'>
                                        <div className='flex items-center gap-2'><Calendar size={12}/>{new Date(o.date).toLocaleDateString()}</div>
                                        <span className='text-[#BC002D]'>{o.currency} {o.amount}</span>
                                    </div>
                                    <div className='space-y-2'>
                                        {o.items.map((item, idx) => (
                                            <div key={idx} className='flex gap-2 items-start text-[10px] text-gray-600 font-bold'>
                                                <Package size={10} className='mt-1 text-gray-400' />
                                                <span className='leading-tight uppercase'>{item.name} (x{item.quantity})</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className='mt-3 pt-2 border-t border-gray-200 flex justify-between items-center text-[9px] font-black uppercase'>
                                        <span className='text-gray-400'>Status: {o.status}</span>
                                        <span className='text-gray-400'>ID: #{o.orderNo || o._id.toString().slice(-6)}</span>
                                    </div>
                                </div>
                            )) : <p className='text-[10px] text-gray-400 italic uppercase'>No registry entries found.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;