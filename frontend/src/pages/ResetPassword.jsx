import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff, ShieldCheck, Lock, RefreshCw } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const { backendUrl, navigate } = useContext(ShopContext);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Independent states for visibility toggles
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return toast.error("Credential mismatch: Passwords do not align.");
        }

        try {
            setLoading(true);
            const response = await axios.post(backendUrl + '/api/user/reset-password', { token, newPassword });
            if (response.data.success) {
                toast.success("Registry Updated. Access restored.");
                navigate('/login');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) { 
            toast.error("Registry connection interrupted."); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FCF9F4] flex items-center justify-center p-6 select-none font-sans text-black">
            <div className="bg-white max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden rounded-sm">
                
                {/* Header Section */}
                <div className='bg-black p-8 text-center'>
                    <div className='flex justify-center mb-4'>
                        <div className='w-12 h-12 border border-white/20 flex items-center justify-center rounded-full'>
                            <ShieldCheck className='text-[#BC002D]' size={24} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-serif text-white italic">Update Credentials</h2>
                    <p className='text-[9px] uppercase tracking-[0.4em] text-gray-500 mt-2'>Security Protocol // Registry Access</p>
                </div>

                <form onSubmit={handleReset} className="p-10 space-y-6">
                    
                    <div className='space-y-4'>
                        {/* New Password Field */}
                        <div className='space-y-1.5'>
                            <p className='text-[9px] font-black uppercase text-gray-400 ml-1'>New Access Key</p>
                            <div className="relative group">
                                <Lock size={14} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#BC002D] transition-colors' />
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    className="w-full pl-12 pr-12 py-4 bg-[#F9F9F9] border border-gray-100 outline-none focus:border-[#BC002D] focus:bg-white transition-all text-sm font-mono"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button" // Always "button" to prevent form submission
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className='space-y-1.5'>
                            <p className='text-[9px] font-black uppercase text-gray-400 ml-1'>Verify Access Key</p>
                            <div className="relative group">
                                <RefreshCw size={14} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#BC002D] transition-colors' />
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    className="w-full pl-12 pr-12 py-4 bg-[#F9F9F9] border border-gray-100 outline-none focus:border-[#BC002D] focus:bg-white transition-all text-sm font-mono"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button" // Always "button" to prevent form submission
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className='pt-4'>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-5 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-[#BC002D] transition-all flex items-center justify-center gap-3 disabled:bg-gray-400 active:scale-[0.98]"
                        >
                            {loading ? "Authorizing..." : "Update Archive Record"}
                        </button>
                    </div>

                    <div className='mt-6 pt-6 border-t border-gray-50 flex justify-center'>
                        <div className='flex items-center gap-2'>
                            <div className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse'></div>
                            <span className='text-[8px] font-bold text-gray-400 uppercase tracking-widest'>Secured End-to-End Encryption</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;