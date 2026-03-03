import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, Calendar, ListFilter, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
import { backendUrl } from '../App';

const RegistryExportDesk = ({token}) => {
  const [format, setFormat] = useState('XLSX');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statuses, setStatuses] = useState(['Order Placed', 'Packing', 'Shipped', 'Delivered']);
  const [sortBy, setSortBy] = useState('Date');
  const [sortOrder, setSortOrder] = useState('Descending');

  const handleStatusToggle = (status) => {
    setStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleExport = async () => {
    if (!token) return toast.error("Authentication Missing");
    if (!dateRange.start || !dateRange.end) return toast.warning("Please select a complete Date Range");
    
    const loadingToast = toast.loading(`Compiling Line-Item Registry...`);
    try {
      const response = await axios.post(`${backendUrl}/api/export/registry-export`, {
        format, 
        dateRange, 
        statuses, 
        sortBy, 
        sortOrder,
        detailed: true // Tells backend to break down by individual products
      }, { 
        headers: { token }, 
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registry-detailed-${Date.now()}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.update(loadingToast, { render: "Registry Exported Successfully", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      toast.update(loadingToast, { render: "Export Failed: Verify Server Connection", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className='flex bg-[#F8F9FA] min-h-screen font-sans select-none p-6 md:p-12'>
      <div className='max-w-5xl mx-auto w-full'>
        {/* Header Section */}
        <div className='mb-10 border-b border-gray-200 pb-6'>
          <h1 className='text-3xl font-black text-gray-900 tracking-tighter uppercase'>Archive Export Desk</h1>
          <p className='text-xs text-gray-400 font-bold uppercase tracking-widest mt-2'>Detailed Line-Item Registry Generation</p>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          
          {/* Column 1: Filters */}
          <div className='space-y-6'>
            <section className='bg-white border border-gray-100 shadow-sm p-8 rounded-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <Calendar size={18} className='text-[#BC002D]'/>
                <h4 className='text-[11px] font-black text-gray-900 uppercase tracking-widest'>Date Range Selection</h4>
              </div>
              <div className='grid grid-cols-1 gap-5'>
                <div className='flex flex-col gap-2'>
                  <span className='text-[10px] font-black text-gray-400 uppercase'>Start Date</span>
                  <input type="date" className='border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-[#BC002D] rounded-lg p-3 text-sm outline-none transition-all' onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                </div>
                <div className='flex flex-col gap-2'>
                  <span className='text-[10px] font-black text-gray-400 uppercase'>End Date</span>
                  <input type="date" className='border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-[#BC002D] rounded-lg p-3 text-sm outline-none transition-all' onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
                </div>
              </div>
            </section>

            <section className='bg-white border border-gray-100 shadow-sm p-8 rounded-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <ListFilter size={18} className='text-[#BC002D]'/>
                <h4 className='text-[11px] font-black text-gray-900 uppercase tracking-widest'>Status Inclusion</h4>
              </div>
              <div className='flex flex-wrap gap-2'>
                {['Order Placed', 'Packing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                  <button key={s} onClick={() => handleStatusToggle(s)} className={`px-4 py-2 border text-[10px] font-black uppercase rounded-full transition-all ${statuses.includes(s) ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-200 hover:border-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Column 2: Export Options */}
          <div className='space-y-6'>
            <section className='bg-white border border-gray-100 shadow-sm p-8 rounded-xl'>
              <h4 className='text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6'>File Extension</h4>
              <div className='grid grid-cols-3 gap-3'>
                {['XLSX', 'CSV', 'JSON'].map(f => (
                  <button key={f} onClick={() => setFormat(f)} className={`py-6 border-2 flex flex-col items-center gap-3 rounded-xl transition-all ${format === f ? 'border-[#BC002D] bg-[#BC002D]/5 text-[#BC002D]' : 'bg-white text-gray-300 border-gray-50'}`}>
                    {f === 'JSON' ? <FileJson size={24}/> : f === 'XLSX' ? <FileSpreadsheet size={24}/> : <FileText size={24}/>}
                    <span className='text-[11px] font-black'>{f}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className='bg-white border border-gray-100 shadow-sm p-8 rounded-xl'>
              <h4 className='text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6'>Sequence & Logic</h4>
              <div className='space-y-4'>
                <select className='w-full border-2 border-gray-50 bg-gray-50 p-3 text-[11px] font-black uppercase rounded-lg outline-none' value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="Date">Sort by Registry Date</option>
                  <option value="Order ID">Sort by Order Index</option>
                </select>
                <select className='w-full border-2 border-gray-50 bg-gray-50 p-3 text-[11px] font-black uppercase rounded-lg outline-none' value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="Descending">Newest First (Descending)</option>
                  <option value="Ascending">Oldest First (Ascending)</option>
                </select>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Action */}
        <div className='mt-10 bg-white border border-gray-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6 rounded-2xl shadow-xl'>
           <div className='flex items-center gap-3'>
              <ShieldCheck className='text-green-500' size={24}/>
              <div>
                <p className='text-[11px] font-black uppercase'>Ready for synchronization</p>
                <p className='text-[9px] text-gray-400 font-bold uppercase'>Exporting {statuses.length} status categories as individual line items</p>
              </div>
           </div>
           <button onClick={handleExport} className='w-full md:w-auto bg-[#BC002D] text-white px-16 py-5 text-xs font-black uppercase tracking-[0.3em] rounded-xl shadow-lg shadow-[#BC002D]/30 hover:bg-black transition-all flex items-center justify-center gap-4'>
              <Download size={20}/> Execute Registry Export
           </button>
        </div>
      </div>
    </div>
  );
};

export default RegistryExportDesk;