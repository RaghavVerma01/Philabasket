import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Star, CheckCircle, XCircle, Image as ImageIcon, Edit3, 
  Save, X, BarChart3, List, ShieldCheck, Box, Truck, Tag, Zap, Search ,RefreshCw,Quote
} from 'lucide-react';
import { backendUrl } from '../App';

const Feedback = ({ token }) => {
  const [list, setList] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  
  
  // --- DETAIL & EDIT SIDEBAR STATE ---
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/feedback/list', { headers: { token } });
      if (response.data.success) {
        setList(response.data.feedback.reverse());
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => { fetchFeedback(); }, [token]);

  // --- ANALYTICS LOGIC ---
  const analytics = useMemo(() => {
    if (list.length === 0) return null;
    const calcAvg = (key) => (list.reduce((acc, curr) => acc + (Number(curr[key]) || 5), 0) / list.length).toFixed(1);
    return [
      { label: 'Specimen Quality', val: calcAvg('qualityrating'), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Packing Integrity', val: calcAvg('packingrating'), icon: Box, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Logistics Speed', val: calcAvg('shippingrating'), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Price Satisfaction', val: calcAvg('raterating'), icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
  }, [list]);

  // --- HANDLERS ---
  const handleOpenDetail = (item) => {
    setSelectedItem({ ...item });
    setShowDetailSidebar(true);
  };

  const handleUpdateFeedback = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await axios.post(
        backendUrl + '/api/feedback/update', 
        { 
          feedbackId: selectedItem._id, 
          text: selectedItem.text, 
          rating: selectedItem.rating,
          isFeatured: selectedItem.isFeatured,
          // Technical ratings from schema
          packingrating: selectedItem.packingrating,
          shippingrating: selectedItem.shippingrating,
          qualityrating: selectedItem.qualityrating,
          raterating: selectedItem.raterating,
          processrating: selectedItem.processrating
        }, 
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Registry Record Updated");
        setShowDetailSidebar(false);
        fetchFeedback();
      }
    } catch (error) {
      toast.error("Update failed");
    } finally { setIsUpdating(false); }
  };

  const toggleFeatured = async (feedbackId, currentStatus) => {
    try {
      const response = await axios.post(backendUrl + '/api/feedback/feature', 
        { feedbackId, status: !currentStatus }, { headers: { token } });
      if (response.data.success) {
        toast.success("Visibility Toggled");
        fetchFeedback();
      }
    } catch (error) { toast.error(error.message); }
  };

  const filteredList = list.filter(item => {
    const name = item.userName ? item.userName.toLowerCase() : ''; // Fallback to empty string
    const order = item.orderNo ? item.orderNo.toString() : '';    // Ensure it's a string
    const search = searchTerm.toLowerCase();
  
    return name.includes(search) || order.includes(searchTerm);
  });

  return (
    <div className='p-8 bg-[#FCF9F4] w-full min-h-screen font-sans'>
      {/* HEADER & VIEW TOGGLE */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10'>
        <div>
          <h2 className='text-2xl font-black uppercase tracking-tighter text-gray-900'>Appraisal Archive</h2>
          <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Collector Feedback & Technical Grading</p>
        </div>
        
        <div className='flex bg-white border border-gray-200 p-1 rounded-lg shadow-sm'>
          <button onClick={() => setView('list')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}><List size={14}/> List</button>
          <button onClick={() => setView('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${view === 'analytics' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}><BarChart3 size={14}/> Analytics</button>
          <button onClick={() => setView('archive')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${view === 'archive' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}><Quote size={14}/>  Testimonial</button>

        </div>
      </div>

      {/* ANALYTICS VIEW */}
      {view === 'analytics' && analytics && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500'>
          {analytics.map((stat) => (
            <div key={stat.label} className='bg-white p-6 border border-gray-100 rounded-xl shadow-sm'>
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}><stat.icon size={20}/></div>
              <p className='text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1'>{stat.label}</p>
              <div className='flex items-baseline gap-1'>
                <span className='text-3xl font-black tracking-tighter'>{stat.val}</span>
                <span className='text-xs font-bold text-gray-300'>/ 5.0</span>
              </div>
              <div className='w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden'>
                <div className={`h-full rounded-full ${stat.color.replace('text', 'bg')}`} style={{ width: `${(stat.val / 5) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className='space-y-6 animate-in fade-in duration-500'>
          {/* Search Bar */}
          <div className='relative max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={16} />
            <input 
              type="text" placeholder="Search Collector or Order #..." 
              className='w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black transition-all'
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className='grid grid-cols-1 gap-4'>
            {filteredList.map((item) => (
              <div key={item._id} onClick={() => handleOpenDetail(item)} className='group bg-white border border-gray-100 p-6 rounded-xl shadow-sm hover:border-[#BC002D]/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6'>
                <div className='flex items-center gap-6 w-full md:w-auto'>
                  <div className='w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center shrink-0'>
                    {item.image ? <img src={item.image} className='w-full h-full object-cover' /> : <ImageIcon size={20} className='text-gray-200'/>}
                  </div>
                  <div>
                    <h4 className='font-black text-gray-900 tracking-tight'>{item.userName}</h4>
                    <p className='text-[10px] font-bold text-[#BC002D] uppercase tracking-widest'>Order #{item.orderNo}</p>
                    <div className='flex items-center gap-1 mt-1 text-amber-500'>
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < item.rating ? "currentColor" : "none"} />)}
                    </div>
                  </div>
                </div>

                <div className='flex-1 max-w-md'>
                  <p className='text-xs text-gray-500 italic line-clamp-2'>"{item.text || 'No appraisal text provided.'}"</p>
                </div>

                <div className='flex items-center gap-6 shrink-0'>
                  <button onClick={() => toggleFeatured(item._id, item.isFeatured)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${item.isFeatured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                    {item.isFeatured ? <CheckCircle size={12}/> : <XCircle size={12}/>} {item.isFeatured ? 'Featured' : 'Hidden'}
                  </button>
                  <button onClick={() => handleOpenDetail(item)} className='p-3 bg-gray-50 text-gray-400 hover:text-[#BC002D] hover:bg-red-50 rounded-lg transition-all'><Edit3 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL & EDIT SIDEBAR */}
      {showDetailSidebar && selectedItem && (
        <div className='fixed inset-0 z-[1000] flex justify-end'>
          <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={() => setShowDetailSidebar(false)}></div>
          <div className='relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300'>
            <div className='p-6 bg-black text-white flex justify-between items-center'>
              <div>
                <h3 className='font-black uppercase tracking-widest text-xs'>Detailed Appraisal</h3>
                <p className='text-[10px] font-bold opacity-60'>Registry ID: #{selectedItem.orderNo}</p>
              </div>
              <X className='cursor-pointer hover:rotate-90 transition-transform' onClick={() => setShowDetailSidebar(false)} />
            </div>

            <form onSubmit={handleUpdateFeedback} className='flex-1 overflow-y-auto p-8 space-y-8'>
              {/* Image & Main Star Rating */}
              <div className='flex flex-col items-center text-center gap-4'>
                <div className='w-32 h-32 bg-gray-50 border rounded-xl overflow-hidden flex items-center justify-center'>
                  {selectedItem.image ? <img src={selectedItem.image} className='w-full h-full object-contain' /> : <ImageIcon size={32} className='text-gray-200'/>}
                </div>
                <div>
                  <label className='text-[10px] font-black uppercase text-gray-400 block mb-2'>Overall Collector Grade</label>
                  <div className='flex gap-1 text-amber-500'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={24} fill={s <= selectedItem.rating ? "currentColor" : "none"} className='cursor-pointer' onClick={() => setSelectedItem({...selectedItem, rating: s})} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Ratings Grid */}
              <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-100'>
                {[
                  { id: 'qualityrating', label: 'Item Quality', icon: ShieldCheck },
                  { id: 'packingrating', label: 'Packing', icon: Box },
                  { id: 'shippingrating', label: 'Delivery', icon: Truck },
                  { id: 'raterating', label: 'Valuation', icon: Tag }
                ].map((metric) => (
                  <div key={metric.id} className='bg-gray-50 p-4 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                       <metric.icon size={12} className='text-gray-400'/>
                       <span className='text-[9px] font-black uppercase tracking-widest text-gray-400'>{metric.label}</span>
                    </div>
                    <select 
                      value={selectedItem[metric.id] || 5} 
                      onChange={(e) => setSelectedItem({...selectedItem, [metric.id]: e.target.value})}
                      className='w-full bg-transparent font-black text-sm outline-none'
                    >
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className='space-y-2'>
                <label className='text-[10px] font-black uppercase text-gray-400 block'>Collector Remarks</label>
                <textarea 
                  value={selectedItem.text} 
                  onChange={(e) => setSelectedItem({...selectedItem, text: e.target.value})}
                  className='w-full border border-gray-200 p-4 rounded-lg text-xs h-32 outline-none focus:border-black bg-gray-50'
                />
              </div>

              <button type="submit" disabled={isUpdating} className='w-full bg-black text-white py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#BC002D] transition-all flex items-center justify-center gap-3'>
                {isUpdating ? <RefreshCw className='animate-spin' size={14}/> : <Save size={16}/>}
                {isUpdating ? 'Synchronizing Archive...' : 'Apply Registry Modifications'}
              </button>
            </form>
          </div>
        </div>
      )}


<button 
  onClick={() => setView('archive')} 
  className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${view === 'archive' ? 'bg-[#1e3a5f] text-white' : 'text-gray-400 hover:text-black'}`}
>
  <ShieldCheck size={14}/> Raw Archives
</button>


{view === 'archive' && (
  <div className='space-y-4 animate-in fade-in duration-500'>
    <div className='bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6'>
       <p className='text-[10px] font-bold text-amber-800 uppercase flex items-center gap-2'>
         <Box size={12}/> Verified Collector Manuscripts (Unedited)
       </p>
    </div>
    
    <table className='w-full bg-white border border-gray-100 rounded-xl overflow-hidden'>
      <thead className='bg-gray-50 border-b border-gray-100'>
        <tr>
          <th className='p-4 text-left text-[9px] font-black uppercase text-gray-400'>Order</th>
          <th className='p-4 text-left text-[9px] font-black uppercase text-gray-400'>Collector</th>
          <th className='p-4 text-left text-[9px] font-black uppercase text-gray-400'>Original Message</th>
          <th className='p-4 text-left text-[9px] font-black uppercase text-gray-400'>Current Display</th>
        </tr>
      </thead>
      <tbody>
        {filteredList.map((item) => (
          <tr key={item._id} className='border-b border-gray-50 hover:bg-gray-50/50'>
            <td className='p-4 text-xs font-bold'>#{item.orderNo}</td>
            <td className='p-4 text-xs font-black'>{item.userName}</td>
            <td className='p-4 text-xs italic text-red-600 bg-red-50/30'>
              "{item.originalText || item.text}" 
              <div className='mt-1 flex gap-0.5 text-amber-500'>
                {[...Array(item.originalRating || item.rating)].map((_, i) => <Star key={i} size={8} fill="currentColor"/>)}
              </div>
            </td>
            <td className='p-4 text-xs text-gray-500'>
              "{item.text}"
              {item.text !== item.originalText && (
                <span className='ml-2 text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase'>Edited</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
};

export default Feedback;