import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Star, CheckCircle, XCircle, Image as ImageIcon, Edit3, Save, X } from 'lucide-react'
import { backendUrl } from '../App';

const Feedback = ({ token }) => {
  const [list, setList] = useState([]);
  
  // --- EDITING STATES ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', rating: 5 });

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/feedback/list', { headers: { token } });
      if (response.data.success) {
        setList(response.data.feedback.reverse());
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const toggleFeatured = async (feedbackId, currentStatus) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/feedback/feature', 
        { feedbackId, status: !currentStatus }, 
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Visibility Updated");
        fetchFeedback();
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  // --- EDIT HANDLERS ---
  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({ text: item.text, rating: item.rating });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + '/api/feedback/update', 
        { 
          feedbackId: editingItem._id, 
          text: editForm.text, 
          rating: editForm.rating,
          isFeatured: editingItem.isFeatured 
        }, 
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Archive Record Modified");
        setShowEditModal(false);
        fetchFeedback();
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  useEffect(() => { fetchFeedback(); }, [token]);

  return (
    <div className='p-6'>
      <h2 className='text-xl font-black uppercase tracking-widest mb-6'>Collector Feedback Registry</h2>
      
      {/* EDIT MODAL */}
      {showEditModal && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm'>
          <div className='bg-white p-8 rounded-lg w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='font-black uppercase text-[10px] tracking-widest text-[#BC002D]'>Edit Feedback Record</h3>
              <X className='cursor-pointer text-gray-400' onClick={() => setShowEditModal(false)} />
            </div>
            <form onSubmit={handleUpdate} className='space-y-6'>
              <div>
                <label className='text-[10px] font-black uppercase text-gray-400 block mb-2'>Specimen Grade</label>
                <select 
                  value={editForm.rating} 
                  onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                  className='w-full border p-3 rounded-md text-xs font-bold'
                >
                  {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                </select>
              </div>
              <div>
                <label className='text-[10px] font-black uppercase text-gray-400 block mb-2'>Review Text</label>
                <textarea 
                  value={editForm.text} 
                  onChange={(e) => setEditForm({...editForm, text: e.target.value})}
                  className='w-full border p-3 rounded-md text-xs h-32 outline-none focus:border-[#BC002D]'
                />
              </div>
              <button type="submit" className='w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#BC002D] transition-all'>
                <Save size={14}/> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      <div className='flex flex-col gap-4'>
        {/* Table Header */}
        <div className='hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_0.5fr] items-center py-4 px-6 bg-gray-100 text-[10px] font-black uppercase tracking-widest'>
          <span>Collector / Order</span>
          <span>Review Text</span>
          <span>Specimen</span>
          <span>Rating</span>
          <span className='text-center'>Visibility</span>
          <span className='text-right'>Action</span>
        </div>

        {list.map((item) => (
          <div key={item._id} className='grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_0.5fr] items-center gap-4 py-4 px-6 border border-gray-100 rounded-lg bg-white hover:border-[#BC002D]/30 transition-all'>
            <div>
              <p className='text-xs font-bold'>{item.userName}</p>
              <p className='text-[9px] font-black text-[#BC002D] uppercase tracking-tighter'>Order #{item.orderNo}</p>
            </div>
            
            <p className='text-xs text-gray-600 italic line-clamp-2'>"{item.text || 'No description'}"</p>
            
            <div>
              {item.image ? (
                <a href={item.image} target="_blank" rel="noreferrer">
                  <img src={item.image} className='w-12 h-12 object-cover rounded-md border border-gray-100' alt="" />
                </a>
              ) : (
                <span className='text-gray-200'><ImageIcon size={20} /></span>
              )}
            </div>

            <div className='flex text-amber-500'>
              {[...Array(item.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
            </div>

            <div className='flex justify-center'>
              <button 
                onClick={() => toggleFeatured(item._id, item.isFeatured)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${item.isFeatured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
              >
                {item.isFeatured ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                {item.isFeatured ? 'Featured' : 'Hidden'}
              </button>
            </div>

            <div className='flex justify-end'>
              <button 
                onClick={() => handleEditClick(item)}
                className='p-2 text-gray-400 hover:text-[#BC002D] hover:bg-gray-50 rounded-full transition-all'
                title="Edit Entry"
              >
                <Edit3 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Feedback;