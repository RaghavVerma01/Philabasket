import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
  Search, Trash2, Edit3, X, Image as ImageIcon, Video, 
  Layers, Tag, Save, Eye, Youtube, Pin, Power, PowerOff, 
  EyeOff, Star, Zap, Filter, ChevronLeft, ChevronRight, 
  RotateCcw, AlertTriangle, Package, Folder, FileText,CheckCircle,Plus,ChevronDown,CreditCard
} from 'lucide-react';

const ITEMS_PER_PAGE = 80;

const Pagination = ({ page, total, onPage }) => {
  const start = Math.max(1, page - 2);
  const end = Math.min(total, start + 4);
  return (
    <div className='flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3 mt-4 shadow-sm'>
      <span className='text-xs text-gray-400 font-medium uppercase tracking-widest'>Page {page} of {total}</span>
      <div className='flex items-center gap-1'>
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className='p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500'><ChevronLeft size={15}/></button>
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
          <button key={p} onClick={() => onPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === page ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>
        ))}
        <button disabled={page === total} onClick={() => onPage(page + 1)} className='p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500'><ChevronRight size={15}/></button>
      </div>
    </div>
  );
};

const Badge = ({ children, color = "gray" }) => {
  const map = {
    amber: "bg-amber-100 text-amber-700",
    blue:  "bg-blue-100 text-blue-700",
    red:   "bg-red-100 text-red-700",
    gray:  "bg-gray-100 text-gray-500",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${map[color]}`}>
      {children}
    </span>
  );
};

const Tab = ({ active, onClick, children, count, color = "black" }) => {
  const activeMap = { black: "bg-black text-white", red: "bg-[#BC002D] text-white" };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all
        ${active ? activeMap[color] : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"}`}
    >
      {children}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
          {count}
        </span>
      )}
    </button>
  );
};

const List = ({ token }) => {
  const [viewMode, setViewMode] = useState("active");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterBestseller, setFilterBestseller] = useState(false);
  const [filterNewArrival, setFilterNewArrival] = useState(false);

  const [trashList, setTrashList] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashTotal, setTrashTotal] = useState(0);
  const [trashPage, setTrashPage] = useState(1);
  const [trashTotalPages, setTrashTotalPages] = useState(1);
  const [trashSearch, setTrashSearch] = useState("");
  const [trashSelectedIds, setTrashSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/category/list`);
      if (res.data.success) setAvailableCategories(res.data.categories);
    } catch (err) { console.error("Category fetch error", err); }
  };

  const fetchList = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/product/list`, {
        params: { page, limit: ITEMS_PER_PAGE, search: searchTerm, includeHidden: 'false', bestseller: filterBestseller ? 'true' : undefined, newArrival: filterNewArrival ? 'true' : undefined }
      });
      if (res.data.success) {
        setList(res.data.products);
        setTotalCount(res.data.total); 
        setTotalPages(Math.max(1, Math.ceil(res.data.total / ITEMS_PER_PAGE)));
        setCurrentPage(page);
      }
    } catch { toast.error("Failed to load products"); } finally { setLoading(false); }
  }, [searchTerm, filterBestseller, filterNewArrival]);

  const fetchTrash = useCallback(async (page = 1) => {
    try {
      setTrashLoading(true);
      const res = await axios.get(`${backendUrl}/api/product/list`, {
        params: { page, limit: ITEMS_PER_PAGE, search: trashSearch, includeHidden: 'true', onlyHidden: 'true' }
      });
      if (res.data.success) {
        setTrashList(res.data.products);
        setTrashTotal(res.data.total);
        setTrashTotalPages(Math.max(1, Math.ceil(res.data.total / ITEMS_PER_PAGE)));
        setTrashPage(page);
      }
    } catch { toast.error("Failed to load trash"); } finally { setTrashLoading(false); }
  }, [trashSearch]);

  const fetchStats = useCallback(async () => {
    try {
        const [activeRes, trashRes] = await Promise.all([
            axios.get(`${backendUrl}/api/product/list`, { params: { limit: 1, includeHidden: 'false' } }),
            axios.get(`${backendUrl}/api/product/list`, { params: { limit: 1, onlyHidden: 'true' } })
        ]);
        if (activeRes.data.success) setTotalCount(activeRes.data.total);
        if (trashRes.data.success) setTrashTotal(trashRes.data.total);
    } catch (err) { console.error("Stats sync error", err); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchList(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSelectedIds([]);
      setCurrentPage(1);
      fetchList(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm, filterBestseller, filterNewArrival, fetchList]);

  useEffect(() => {
    if (viewMode === "trash") fetchTrash(1);
  }, [viewMode, trashSearch, fetchTrash]);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === list.length && list.length > 0 ? [] : list.map(i => i._id));
  const toggleTrashSelect = (id) => setTrashSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleTrashSelectAll = () => setTrashSelectedIds(trashSelectedIds.length === trashList.length && trashList.length > 0 ? [] : trashList.map(i => i._id));

  const toggleCategory = (catName) => {
    const current = [...(editFormData.category || [])];
    if (current.includes(catName)) {
        setEditFormData({ ...editFormData, category: current.filter(c => c !== catName) });
    } else {
        setEditFormData({ ...editFormData, category: [...current, catName] });
    }
  };

  const softDelete = async (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (!window.confirm(`Move ${idArray.length} product(s) to trash?`)) return;
    try {
      setLoading(true);
      await axios.post(`${backendUrl}/api/product/bulk-status`, { ids: idArray, isActive: false }, { headers: { token } });
      toast.success(`${idArray.length} product(s) moved to trash`);
      setSelectedIds([]);
      fetchList(currentPage);
      fetchStats();
    } catch { toast.error("Failed to move to trash"); } finally { setLoading(false); }
  };

  const restoreFromTrash = async (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    try {
      setTrashLoading(true);
      await axios.post(`${backendUrl}/api/product/bulk-status`, { ids: idArray, isActive: true }, { headers: { token } });
      toast.success(`${idArray.length} product(s) restored`);
      setTrashSelectedIds([]);
      fetchTrash(trashPage);
      fetchStats();
    } catch { toast.error("Restore failed"); } finally { setTrashLoading(false); }
  };

  const permanentDelete = async (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (!window.confirm(`Permanently delete ${idArray.length} product(s)? This CANNOT be undone.`)) return;
    try {
      setTrashLoading(true);
      await axios.post(`${backendUrl}/api/product/remove-bulk`, { ids: idArray }, { headers: { token } });
      toast.success(`${idArray.length} product(s) permanently deleted`);
      setTrashSelectedIds([]);
      fetchTrash(trashPage);
      fetchStats();
    } catch { toast.error("Permanent delete failed"); } finally { setTrashLoading(false); }
  };

  const bulkAttribute = async (field, value) => {
    try {
      setLoading(true);
      await axios.post(`${backendUrl}/api/product/bulk-update-attributes`, { ids: selectedIds, field, value }, { headers: { token } });
      toast.success("Bulk update completed");
      setSelectedIds([]);
      fetchList(currentPage);
    } catch { toast.error("Bulk update failed"); } finally { setLoading(false); }
  };

  const openEditModal = (item) => {
    setEditFormData({
        ...item,
        description: item.description || "",
        youtubeUrl: item.youtubeUrl || "",
        isLatest: item.isLatest || false,
        isActive: item.isActive !== undefined ? item.isActive : true,
        bestseller: item.bestseller || false,
        newArrival: item.newArrival || false,
        producedCount: item.producedCount || 0,
        condition: item.condition || "Used",
        category: item.category || []
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/api/product/update`, {
        id: editFormData._id,
        ...editFormData,
        price: Number(editFormData.price),
        marketPrice: Number(editFormData.marketPrice),
        stock: Number(editFormData.stock),
        producedCount: Number(editFormData.producedCount),
      }, { headers: { token } });
  
      if (res.data.success) {
        toast.success("Registry Record Synchronized");
        setIsModalOpen(false);
        fetchList(currentPage);
      }
    } catch (error) { toast.error("Update failed"); }
  };

  const addImageSlot = () => {
    if (editFormData.image.length < 4) setEditFormData({ ...editFormData, image: [...editFormData.image, ""] });
    else toast.info("Maximum 4 image slots");
  };
  const removeImageSlot = (i) => setEditFormData({ ...editFormData, image: editFormData.image.filter((_, idx) => idx !== i) });

  return (
    <div className='max-w-7xl mx-auto p-4 lg:p-8 bg-gray-50 min-h-screen text-black' style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div>
          <h2 className='text-3xl font-black text-gray-900 uppercase tracking-tighter'>Management <span className='text-[#BC002D]'>Console</span></h2>
          <p className='text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1'>Registry Records Control</p>
        </div>
        <div className='relative w-full md:w-80'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={14}/>
          <input type="text" placeholder="Search archive..." value={viewMode === "active" ? searchTerm : trashSearch} onChange={(e) => viewMode === "active" ? setSearchTerm(e.target.value) : setTrashSearch(e.target.value)} className='w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 placeholder:text-gray-400 transition-all'/>
        </div>
      </div>

      <div className='flex items-center gap-3 mb-6'>
        <Tab active={viewMode === "active"} onClick={() => setViewMode("active")} count={totalCount}><Package size={13}/> Active</Tab>
        <Tab active={viewMode === "trash"} onClick={() => setViewMode("trash")} count={trashTotal} color="red"><Trash2 size={13}/> Trash</Tab>
      </div>

      {viewMode === "active" ? (
        <>
          <div className='flex flex-wrap items-center gap-3 mb-5'>
            <div className='flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm'>
              <Filter size={13} className='text-gray-400'/><span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1'>Filter:</span>
              <button onClick={() => setFilterBestseller(!filterBestseller)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterBestseller ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}`}><Star size={11}/> Bestsellers</button>
              <button onClick={() => setFilterNewArrival(!filterNewArrival)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterNewArrival ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}`}><Zap size={11}/> New Arrivals</button>
              {(filterBestseller || filterNewArrival || searchTerm) && <button onClick={() => { setFilterBestseller(false); setFilterNewArrival(false); setSearchTerm(""); }} className='text-[10px] font-bold text-[#BC002D] hover:underline ml-1 uppercase'>Reset</button>}
            </div>
            <button onClick={toggleSelectAll} className='flex items-center gap-2 bg-white border border-gray-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-500 shadow-sm'>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedIds.length === list.length && list.length > 0 ? "bg-black border-black" : "border-gray-300"}`}>{selectedIds.length === list.length && list.length > 0 && <div className='w-1.5 h-1.5 bg-white rounded-full'/>}</div>
              {selectedIds.length > 0 ? `${selectedIds.length} Selected` : "Select All"}
            </button>
          </div>

          {/* ── Command bar (shows when items selected) ─────────────────────── */}
{selectedIds.length > 0 && (
  <div className='cmd-bar mb-5 bg-gray-900 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl'>
    <div className='flex items-center gap-3'>
      <span className='text-xs font-black text-white bg-[#BC002D] px-4 py-2 rounded-xl uppercase tracking-wide'>
        {selectedIds.length} Specimens
      </span>
    </div>

    <div className='flex items-center gap-2 flex-wrap'>
      {/* Bestseller Bulk Actions */}
      <div className='flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1'>
        <button onClick={() => bulkAttribute('bestseller', true)}
          className='flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all'>
          <Star size={10} fill="black"/> + Best
        </button>
        <button onClick={() => bulkAttribute('bestseller', false)}
          className='flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-amber-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all'>
          <X size={10}/> − Best
        </button>
      </div>

      {/* New Arrival Bulk Actions */}
      <div className='flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1'>
        <button onClick={() => bulkAttribute('newArrival', true)}
          className='flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all'>
          <Zap size={10} fill="white"/> + New
        </button>
        <button onClick={() => bulkAttribute('newArrival', false)}
          className='flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-blue-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all'>
          <X size={10}/> − New
        </button>
      </div>

      <div className='w-px h-8 bg-white/10 mx-1'/>

      {/* Bulk move to trash */}
      <button onClick={() => softDelete(selectedIds)}
        className='flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all'>
        <Trash2 size={12}/> Move to Trash
      </button>

      <button onClick={() => setSelectedIds([])}
        className='p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-colors'>
        <X size={14}/>
      </button>
    </div>
  </div>
)}

          <div className='space-y-2.5'>
            {loading && list.length === 0 ? <p className='text-center py-10 animate-pulse uppercase text-[10px] font-black tracking-widest text-gray-400'>Loading Specimen Registry...</p> : list.length === 0 ? (
              <div className='py-20 text-center bg-white rounded-2xl border border-dashed'><Package size={36} className='mx-auto text-gray-200 mb-3'/><p className='text-sm font-bold text-gray-400 uppercase tracking-widest'>Registry Empty</p></div>
            ) : list.map((item) => {
              const isSelected = selectedIds.includes(item._id);
              return (
                  <div key={item._id} className={`bg-white rounded-2xl border-2 flex items-center justify-between gap-3 p-3.5 transition-all hover:shadow-md ${isSelected ? "border-black bg-gray-50" : "border-gray-100"}`}>
                      <div className='flex items-center gap-3 min-w-0'>
                          {/* Selection Checkbox */}
                          <button onClick={() => toggleSelect(item._id)} className={`w-4 h-4 rounded border-2 flex-shrink-0 ${isSelected ? "bg-black border-black" : "border-gray-300"}`}>
                              {isSelected && <div className='w-full h-full flex items-center justify-center'><div className='w-1 h-1 bg-white rounded-full'/></div>}
                          </button>
          
                          {/* Specimen Thumbnail */}
                          <div onClick={() => openEditModal(item)} className='w-12 h-14 bg-gray-50 rounded-xl border flex items-center justify-center overflow-hidden p-1 relative cursor-pointer'>
                              <img src={item.image[0]} className='w-full h-full object-contain' alt=""/>
                              {item.isLatest && <Pin size={9} className='absolute -top-1 -right-1 text-[#BC002D] fill-[#BC002D]'/>}
                          </div>
          
                          {/* Primary Info & Attributes */}
                          <div className='cursor-pointer min-w-0' onClick={() => openEditModal(item)}>
                              <div className='flex items-center gap-2 flex-wrap mb-0.5'>
                                  <p className='text-sm font-bold text-gray-900 truncate leading-tight'>{item.name}</p>
                                  
                                  {/* Attribute Badges */}
                                  {item.bestseller && (
                                      <span className="flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                                          <Star size={8} className="fill-amber-700"/> Bestseller
                                      </span>
                                  )}
                                  {item.newArrival && (
                                      <span className="flex items-center gap-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                                          <Zap size={8} className="fill-blue-700"/> New
                                      </span>
                                  )}
                              </div>
                              
                              <p className='text-[10px] text-gray-400 font-semibold uppercase tracking-wide'>
                                  {item.country} • {item.year} • {item.condition}
                              </p>
                          </div>
                      </div>
          
                      {/* Price & Registry Controls */}
                      <div className='flex items-center gap-2 flex-shrink-0'>
                          <div className='text-right mr-2 hidden sm:block'>
                              <p className='text-[10px] font-bold text-gray-400 uppercase leading-none mb-1'>Ledger</p>
                              <p className='text-sm font-black text-gray-800 leading-none'>₹{item.price}</p>
                          </div>
                          
                          <button onClick={() => openEditModal(item)} className='p-2.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white transition-all text-gray-500'>
                              <Edit3 size={14}/>
                          </button>
                          <button onClick={() => softDelete(item._id)} className='p-2.5 rounded-xl bg-gray-50 hover:bg-red-600 hover:text-white transition-all text-gray-400' title="Move to trash">
                              <Trash2 size={14}/>
                          </button>
                      </div>
                  </div>
              )
          })}
          </div>
          {totalPages > 1 && <Pagination page={currentPage} total={totalPages} onPage={(p) => fetchList(p)}/>}
        </>
      ) : (
        <div className='space-y-2.5'>
            {trashList.map(item => (
                <div key={item._id} className='bg-white rounded-2xl border-2 border-dashed p-3.5 flex items-center justify-between opacity-70'>
                    <div className='flex items-center gap-3 min-w-0'>
                        <div className='w-12 h-14 bg-gray-50 rounded-xl grayscale p-1'><img src={item.image[0]} className='w-full h-full object-contain' alt=""/></div>
                        <p className='text-sm font-bold text-gray-400 line-through truncate'>{item.name}</p>
                    </div>
                    <div className='flex gap-2 flex-shrink-0'>
                        <button onClick={() => restoreFromTrash(item._id)} className='px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-xl hover:bg-emerald-500 hover:text-white transition-all'>Restore</button>
                        <button onClick={() => permanentDelete(item._id)} className='px-4 py-2 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all'>Delete</button>
                    </div>
                </div>
            ))}
            {trashList.length === 0 && <div className='py-20 text-center uppercase text-xs font-black text-gray-300 tracking-widest'>Trash is empty</div>}
        </div>
      )}

      {isModalOpen && editFormData && (
        <div className='fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10'>
          <div className='absolute inset-0 bg-black/75 backdrop-blur-sm' onClick={() => setIsModalOpen(false)}/>
          <div className='relative bg-white w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[32px] shadow-2xl flex flex-col'>
            
            <div className='sticky top-0 bg-white z-20 px-8 py-5 border-b border-gray-100 flex justify-between items-center rounded-t-[32px] flex-shrink-0'>
              <div>
                <h3 className='text-xl font-black uppercase tracking-tighter'>Edit Specimen</h3>
                <p className='text-xs text-gray-400 font-bold uppercase tracking-widest mt-1'>Registry Record: {editFormData._id}</p>
              </div>
              <div className='flex items-center gap-3'>
                <button type="button" onClick={() => setEditFormData({ ...editFormData, isActive: !editFormData.isActive })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all
                    ${editFormData.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {editFormData.isActive ? <Power size={11}/> : <EyeOff size={11}/>} {editFormData.isActive ? "Active" : "Hidden"}
                </button>
                <button onClick={() => setIsModalOpen(false)} className='p-2.5 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all'><X size={18}/></button>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-[1fr_340px]'>
              <form onSubmit={handleUpdate} className='p-8 grid grid-cols-1 md:grid-cols-2 gap-10 border-r border-gray-100'>
                <div className='space-y-8'>
                  <div className='space-y-4'>
                    <h5 className='text-[10px] font-black text-[#BC002D] uppercase tracking-widest flex items-center gap-2'><Tag size={11}/> Specimen Identity</h5>
                    <input className='w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-gray-400' value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}/>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-1'><label className='text-[9px] font-bold text-gray-400 uppercase ml-1'>Registry Price</label><input type="number" className='w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none' value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}/></div>
                      <div className='space-y-1'><label className='text-[9px] font-bold text-gray-400 uppercase ml-1'>Market Price</label><input type="number" className='w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none' value={editFormData.marketPrice} onChange={(e) => setEditFormData({ ...editFormData, marketPrice: e.target.value })}/></div>
                      <div className='space-y-1'><label className='text-[9px] font-bold text-gray-400 uppercase ml-1'>Year</label><input type="number" className='w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none' value={editFormData.year} onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}/></div>
                      <div className='space-y-1'><label className='text-[9px] font-bold text-gray-400 uppercase ml-1'>Produced Count</label><input type="number" className='w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none' value={editFormData.producedCount} onChange={(e) => setEditFormData({ ...editFormData, producedCount: e.target.value })}/></div>
                      <div className='space-y-1'><label className='text-[9px] font-bold text-gray-400 uppercase ml-1'>Stock</label><input type="number" className='w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none' value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}/></div>


                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <h5 className='text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2'><ImageIcon size={11}/> Registry Images</h5>
                      <button type="button" onClick={addImageSlot} className='text-[9px] font-black bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800'>+ Add</button>
                    </div>
                    <div className='space-y-2'>
                      {editFormData.image.map((img, idx) => (
                        <div key={idx} className='flex items-center gap-2 group'>
                          <div className='relative flex-1'>
                            <FileText className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-300' size={12}/>
                            <input className='w-full pl-9 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none' placeholder="bal.jpg" value={img} onChange={(e) => { const n = [...editFormData.image]; n[idx] = e.target.value; setEditFormData({ ...editFormData, image: n }); }}/>
                          </div>
                          <button type="button" onClick={() => removeImageSlot(idx)} className='p-2 text-red-400 hover:bg-red-50 rounded-lg'><Trash2 size={13}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='space-y-8 flex flex-col h-full'>
  {/* Category Registry Section */}
  <div className='space-y-4'>
    <div className='flex items-center justify-between'>
      <h5 className='text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2'>
        <Folder size={11}/> Category Registry
      </h5>
      <span className='text-[9px] font-black text-[#BC002D] bg-red-50 px-2 py-0.5 rounded uppercase'>
        {editFormData.category.length} Assigned
      </span>
    </div>

    {/* NEW: Active Tags Summary Row */}
    <div className='min-h-[40px] p-3 bg-gray-900 rounded-xl border border-gray-800 flex flex-wrap gap-2'>
      {editFormData.category.length > 0 ? (
        editFormData.category.map((catName, idx) => (
          <span key={idx} className='text-[8px] font-black text-white bg-[#BC002D] px-2 py-1 rounded uppercase tracking-tighter flex items-center gap-1'>
            {catName}
            <button type="button" onClick={() => toggleCategory(catName)} className='hover:text-black'>
              <X size={8}/>
            </button>
          </span>
        ))
      ) : (
        <span className='text-[8px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 italic px-1'>
          No categories assigned to specimen
        </span>
      )}
    </div>

    {/* Category Selection Grid */}
    <div className='p-4 bg-gray-50 border border-gray-100 rounded-2xl'>
      <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2'>
        {availableCategories.map(cat => {
          const isSelected = editFormData.category.includes(cat.name);
          return (
            <button 
              key={cat._id} 
              type="button" 
              onClick={() => toggleCategory(cat.name)}
              className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all border text-left flex items-center justify-between
                ${isSelected 
                  ? "bg-[#BC002D] text-white border-[#BC002D] shadow-md shadow-red-900/10" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"}`}
            >
              <span className='truncate mr-1'>{cat.name}</span>
              {isSelected ? <CheckCircle size={10}/> : <Plus size={10} className='opacity-30'/>}
            </button>
          );
        })}
      </div>
    </div>
  </div>

  {/* Attributes Section */}
  <div className='space-y-4'>
    <h5 className='text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2'>
      <Layers size={11}/> Registry Attributes
    </h5>
    <div className='grid grid-cols-2 gap-3'>
      <button type="button" onClick={() => setEditFormData({ ...editFormData, bestseller: !editFormData.bestseller })}
        className={`flex flex-col gap-1 p-3 border-2 rounded-2xl text-left transition-all ${editFormData.bestseller ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-100"}`}>
        <div className='flex justify-between'><span className='text-[8px] font-black uppercase text-gray-400'>Bestseller</span><Star size={12} className={editFormData.bestseller ? "text-amber-500 fill-amber-500" : "text-gray-200"}/></div>
        <span className={`text-[10px] font-black uppercase ${editFormData.bestseller ? "text-amber-600" : "text-gray-400"}`}>{editFormData.bestseller ? "Active" : "Off"}</span>
      </button>
      <button type="button" onClick={() => setEditFormData({ ...editFormData, newArrival: !editFormData.newArrival })}
        className={`flex flex-col gap-1 p-3 border-2 rounded-2xl text-left transition-all ${editFormData.newArrival ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-100"}`}>
        <div className='flex justify-between'><span className='text-[8px] font-black uppercase text-gray-400'>New</span><Zap size={12} className={editFormData.newArrival ? "text-blue-500 fill-blue-500" : "text-gray-200"}/></div>
        <span className={`text-[10px] font-black uppercase ${editFormData.newArrival ? "text-blue-600" : "text-gray-400"}`}>{editFormData.newArrival ? "Active" : "Off"}</span>
      </button>
    </div>

    {/* Condition Registry */}
    <div className='space-y-1'>
      <label className='text-[9px] font-black text-gray-400 uppercase ml-1'>Condition Registry</label>
      <div className='relative'>
        <select 
          className='w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer' 
          value={editFormData.condition || ""} 
          onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
        >
          <option value="Mint">Mint (MNH)</option>
          <option value="Near Mint">Near Mint (MLH)</option>
          <option value="Fine">Fine (MH/MM)</option>
          <option value="Used">Used</option>
        </select>
        <ChevronDown size={14} className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'/>
      </div>
    </div>
  </div>

  {/* Ledger Value Card */}
  <div className='bg-gray-900 p-6 rounded-[28px] mt-auto border border-gray-800 shadow-2xl'>
    <div className='flex justify-between items-start mb-1'>
      <p className='text-white/50 text-[10px] uppercase font-black tracking-widest'>Ledger Value</p>
      <CreditCard size={14} className='text-white/20'/>
    </div>
    <p className='text-white text-3xl font-black mb-5 font-mono'>₹{editFormData.price.toLocaleString('en-IN')}</p>
    <button type="submit" className='w-full py-4 bg-[#BC002D] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-lg hover:bg-red-700 active:scale-95 flex items-center justify-center gap-2'>
      <Save size={14}/> Save Registry Record
    </button>
  </div>
</div>
              </form>

              <div className='bg-gray-50 p-8 flex flex-col items-center border-l border-gray-100 h-full'>
                 <h5 className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2'><Eye size={11}/> Archive Preview</h5>
                 <div className={`w-full max-w-[240px] bg-white rounded-3xl p-4 shadow-xl border border-gray-100 ${!editFormData.isActive ? "grayscale opacity-60" : ""} relative overflow-hidden`}>
                    <div className='aspect-[3/4] bg-gray-50 rounded-2xl flex items-center justify-center p-4 mb-4 relative'>
                        <img src={editFormData.image[0] || "https://placehold.co/300x400?text=Registry"} className='w-full h-full object-contain' alt=""/>
                        {editFormData.isLatest && <Pin size={12} className='absolute top-2 left-2 text-[#BC002D] fill-[#BC002D]'/>}
                    </div>
                    <p className='text-xs font-black uppercase truncate mb-1'>{editFormData.name || "Product Specimen"}</p>
                    <p className='text-sm font-black text-[#BC002D]'>₹{editFormData.price}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;