import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Search, ChevronRight, Loader2, ChevronLeft 
} from 'lucide-react';
import { backendUrl } from '../App';

const Users = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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
            fetchUsers(1); 
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div className='p-6 bg-[#FCF9F4] min-h-screen font-serif'>
            {/* Header Section */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4'>
                <div>
                    <h2 className='text-2xl font-black uppercase tracking-tighter'>
                        Collector <span className='text-[#BC002D]'>Registry</span>
                    </h2>
                    <p className='text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1'>Archive Master Ledger</p>
                </div>
                
                <div className='relative w-full md:w-72'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Archive..." 
                        value={searchTerm} 
                        onChange={(e)=>setSearchTerm(e.target.value)} 
                        className='w-full pl-10 pr-4 py-2 border border-gray-100 rounded-sm text-xs outline-none focus:border-[#BC002D] bg-white transition-all' 
                    />
                </div>
            </div>

            {/* Registry Table */}
            <div className='bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden'>
                <table className='w-full text-left text-xs uppercase font-bold'>
                    <thead className='bg-gray-50 text-gray-400 border-b border-gray-100'>
                        <tr>
                            <th className='p-4'>Collector Identity</th>
                            <th className='p-4'>Registry Code</th>
                            <th className='p-4'>Ledger Credits</th>
                            <th className='p-4 text-right'>Access</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50'>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className='p-20 text-center'>
                                    <div className='flex flex-col items-center gap-4'>
                                        <Loader2 className='animate-spin text-[#BC002D]' size={32} />
                                        <p className='text-[10px] tracking-widest text-gray-400 animate-pulse'>Synchronizing Registry Ledger...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map(u => (
                                <tr key={u._id} className='hover:bg-gray-50/50 transition-colors group'>
                                    <td className='p-4'>
                                        <div className='flex flex-col'>
                                            <span className='text-black group-hover:text-[#BC002D] transition-colors'>{u.name}</span>
                                            <span className='text-[10px] text-gray-400 lowercase font-medium'>{u.email}</span>
                                        </div>
                                    </td>
                                    <td className='p-4 font-mono text-[#BC002D] tracking-tighter'>{u.referralCode || 'UNASSIGNED'}</td>
                                    <td className='p-4'>
                                        <span className='text-amber-600 bg-amber-50 px-2 py-1 rounded-sm'>
                                            {u.totalRewardPoints || 0} PTS
                                        </span>
                                    </td>
                                    <td className='p-4 text-right'>
                                        <button 
                                            onClick={() => navigate(`/users/${u._id}`)} 
                                            className='p-2 hover:bg-[#BC002D] hover:text-white rounded-sm transition-all text-gray-300'
                                            title="View Detailed Profile"
                                        >
                                            <ChevronRight size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className='p-20 text-center text-gray-400 italic tracking-widest uppercase text-[10px]'>
                                    No collector specimens found in archive.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION PROTOCOL */}
            {!loading && totalPages > 1 && (
                <div className='flex items-center justify-center gap-6 mt-10'>
                    <button 
                        disabled={currentPage === 1} 
                        onClick={() => fetchUsers(currentPage - 1)} 
                        className='p-2 border border-gray-100 rounded-sm disabled:opacity-20 hover:bg-white hover:shadow-md transition-all'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <div className='flex items-center gap-2'>
                        <span className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Registry Page</span>
                        <span className='text-[12px] font-black text-[#BC002D]'>{currentPage}</span>
                        <span className='text-[10px] font-black uppercase tracking-widest text-gray-400'>of {totalPages}</span>
                    </div>

                    <button 
                        disabled={currentPage === totalPages} 
                        onClick={() => fetchUsers(currentPage + 1)} 
                        className='p-2 border border-gray-100 rounded-sm disabled:opacity-20 hover:bg-white hover:shadow-md transition-all'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Users;