import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import { X, ArrowUpDown, ChevronRight, LayoutGrid, ChevronLeft, ChevronDown, ListFilter, SlidersHorizontal, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

// 1. UPDATED SidebarContent: Unified design with direct productCount display
const SidebarContent = ({ 
  unifiedIndex, 
  activeCategory, 
  handleCategorySelect, 
  sidebarSearch, 
  setSidebarSearch, 
  openGroups, 
  setOpenGroups, 
  setShowFilter 
}) => (
  <>
    <div className='flex items-center justify-between mb-6  border-b border-white/10 pb-6'>
      <h3 className='text-white font-black text-[10px] tracking-[0.3em] uppercase'>Registry Index</h3>
      <button onClick={() => setShowFilter(false)} className='lg:hidden text-white/60 p-1 hover:text-white transition-colors'><X size={20}/></button>
    </div>

    <div className='relative mb-8'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-white/30' size={14} />
      <input 
        type="text" 
        value={sidebarSearch}
        onChange={(e) => setSidebarSearch(e.target.value)}
        placeholder="Search Index..."
        className='w-full bg-white/10 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] text-white placeholder:text-white/30 outline-none focus:bg-white/20 transition-all font-bold uppercase tracking-widest'
      />
      {sidebarSearch && (
        <button 
          type="button"
          onClick={() => {
            setSidebarSearch("");
            setOpenGroups({}); // Reset groups when search is cleared
          }} 
          className='absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white z-20'
        >
          <X size={12}/>
        </button>
      )}
    </div>

    <div className='flex flex-col gap-2 overflow-y-auto max-h-[60vh]  lg:max-h-[70vh] hide-scrollbar pr-1'>
      {unifiedIndex.map((entry) => (
        <div key={entry.name} className='flex flex-col'>
          {entry.type === 'group' ? (
            <>
              <button
                onClick={() => setOpenGroups(p => ({ ...p, [entry.name]: !p[entry.name] }))}
                className='flex items-center justify-between py-3 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest text-white/80 hover:text-amber-400 hover:bg-white/5 transition-all group'
              >
                <div className='flex items-center gap-2'>
                  <span className='truncate'>{entry.name}</span>
                  <span className='text-[8px] opacity-40 font-mono'>({entry.totalCount})</span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ${openGroups[entry.name] ? 'rotate-180 text-amber-400' : 'opacity-40 group-hover:opacity-100'}`} 
                />
              </button>
              <div className={`flex flex-col gap-1 ml-4 border-l border-white/10 pl-4 transition-all duration-500 overflow-hidden ${openGroups[entry.name] ? 'max-h-[1000px] mt-1 mb-3 opacity-100' : 'max-h-0 opacity-0'}`}>

{entry.items.map(subCat => (
  <button
    key={subCat.name}
    onClick={() => handleCategorySelect(subCat.name)} // Pass full name to DB
    className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all group/item ${activeCategory === subCat.name ? 'bg-white text-[#BC002D]' : 'text-white/40 hover:text-white'}`}
  >
    {/* Use subCat.display here for "Iran" instead of "Country > Iran" */}
    <span className='truncate mr-2 group-hover/item:translate-x-1 transition-transform'>
        {subCat.display} 
    </span>
    <span className={`text-[8px] font-mono ${activeCategory === subCat.name ? 'text-[#BC002D]' : 'text-amber-400'}`}>
        {subCat.count}
    </span>
  </button>
))}
              </div>
            </>
          ) : (
            <button
              onClick={() => handleCategorySelect(entry.name)}
              className={`flex items-center justify-between py-3 px-4 rounded-xl text-[9px] text-transform: capitalize font-semibold  tracking-widest transition-all ${activeCategory === entry.name ? 'bg-white text-[#BC002D]' : 'text-white/80 hover:bg-white/5 hover:text-amber-400'}`}
            >
              <span className='truncate  text-transform: capitalize'>{entry.name}</span>
              <span className={`text-[10px] text-white font-mono font-black ${activeCategory === entry.name ? 'text-[#BC002D]' : 'opacity-80'}`}>{entry.count}</span>
            </button>
          )}
        </div>
      ))}
      
      {unifiedIndex.length === 0 && (
        <p className='text-[10px] text-white/30 font-bold uppercase text-center py-4'>No Index Matches</p>
      )}
    </div>
  </>
);

const Collection = () => {
  const { search, showSearch, backendUrl ,setProducts: setGlobalProducts} = useContext(ShopContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeCategory = searchParams.get('category') || "";
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [sortType, setSortType] = useState('relevant');
  const [dbCategories, setDbCategories] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const [sidebarSearch, setSidebarSearch] = useState("");
  const activeStatus = searchParams.get('status') || "all";
  const location = useLocation();

  useEffect(() => {
    if (showFilter) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showFilter]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/category/list');
      if (response.data.success) setDbCategories(response.data.categories);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { if (backendUrl) fetchCategories(); }, [backendUrl]);

  // UPDATED useMemo: Alphabetical Unified Index logic
  const unifiedIndex = useMemo(() => {
    if (!dbCategories.length) return [];
  
    const groupsMap = {};
    const independentList = [];
    const searchLower = sidebarSearch.toLowerCase().trim();
  
    dbCategories.forEach(cat => {
      const catName = cat.name.toLowerCase();
      const groupNameRaw = cat.group ? cat.group.trim() : "";
      const groupNameLower = groupNameRaw.toLowerCase();
      
      // Match logic
      const isMatch = catName.includes(searchLower) || groupNameLower.includes(searchLower);
      if (!isMatch && searchLower !== "") return;
  
      // String Cleaning: "Country > Iran" -> "Iran"
      const displayName = cat.name.includes('>') 
        ? cat.name.split('>')[1].trim() 
        : cat.name;
  
      const item = { 
        name: cat.name,      // Full name for DB queries
        display: displayName, // Clean name for UI
        count: cat.productCount || 0 
      };
  
      const isIndependent = !groupNameRaw || ['general', 'independent', 'none', ''].includes(groupNameLower);
  
      if (isIndependent) {
        independentList.push({ ...item, type: 'independent' });
      } else {
        const gName = groupNameRaw;
        if (!groupsMap[gName]) {
          groupsMap[gName] = { name: gName, type: 'group', items: [], totalCount: 0 };
        }
        groupsMap[gName].items.push(item);
        groupsMap[gName].totalCount += item.count;
  
        // Only auto-expand if there is an active search term
        if (searchLower !== "" && !openGroups[gName]) {
          setOpenGroups(prev => ({ ...prev, [gName]: true }));
        }
      }
    });
  
    const combined = [...Object.values(groupsMap), ...independentList];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbCategories, sidebarSearch]); // Removed openGroups from dependencies to prevent toggle-loops

  const fetchFromRegistry = useCallback(async (targetPage) => {
    if (!backendUrl) return;
    setLoading(true);
    try {
        const response = await axios.get(`${backendUrl}/api/product/list`, {
            params: { 
                page: targetPage, 
                limit: 50, 
                category: activeCategory, 
                sort: sortType, 
                search: showSearch ? search : '',
                // Translate the single "activeStatus" pill into specific backend keys
                bestseller: activeStatus === 'bestseller' ? 'true' : undefined,
                isFeatured: activeStatus === 'featured' ? 'true' : undefined,
                newArrival: activeStatus === 'newArrival' ? 'true' : undefined,
            }
        });

        if (response.data.success) {
            setProducts(response.data.products);
            setTotalFound(response.data.total);
            
            // Sync with global context for cart/side-panel
            setGlobalProducts(prev => {
                const existingIds = new Set(prev.map(p => String(p._id)));
                const uniqueNew = response.data.products.filter(p => !existingIds.has(String(p._id)));
                return [...prev, ...uniqueNew];
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Registry Sync Failed:", error);
        toast.error("Registry Sync Failed");
    } finally {
        setLoading(false);
    }
}, [backendUrl, activeCategory, activeStatus, sortType, search, showSearch, setGlobalProducts]);
  useEffect(() => {
    setPage(1);
    fetchFromRegistry(1);
  }, [activeCategory, sortType, search, showSearch, fetchFromRegistry]);

  useEffect(() => {
    if (page > 1) fetchFromRegistry(page);
  }, [page, fetchFromRegistry]);

  const handleCategorySelect = (val) => {
    if (activeCategory === val) {
      setSearchParams({});
    } else {
      setSearchParams({ category: val });
    }
    setShowFilter(false);
  };

  const handleStatusSelect = (status) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    setSearchParams(newParams);
    setPage(1); // Reset to page 1
  };

  const totalPages = Math.ceil(totalFound / 50);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`w-9 h-9 md:w-12 md:h-12 rounded-xl text-[10px] font-black transition-all duration-300 ${
            page === i ? 'bg-[#BC002D] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-black hover:text-white'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className='bg-white min-h-screen pt-4 pb-24 px-4 md:px-16 lg:px-24 select-none animate-fade-in'>
      
      <div className='mb-8 md:mb-12'>
        <div className='flex items-center gap-4 mb-3'>
          <span className='h-[1px] w-8 md:w-12 bg-[#BC002D]'></span>
          <p className='text-[9px] md:text-[10px] tracking-[0.5em] md:tracking-[0.6em] text-[#BC002D] uppercase font-black'>Certified Archive</p>
        </div>
        <h2 className='text-3xl md:text-6xl font-bold text-gray-900 tracking-tighter uppercase leading-none'>
          Global <span className='text-[#BC002D]'>Collection.</span>
        </h2>
      </div>

      <div className='flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide px-1 snap-x snap-mandatory'>
    {[
        { id: 'all', label: 'Complete Archive' },
        { id: 'featured', label: 'Curated/Featured' },
        { id: 'bestseller', label: 'Top Bestsellers' },
        { id: 'newArrival', label: 'Recent Arrivals' }
    ].map((btn) => (
        <button
            key={btn.id}
            onClick={() => handleStatusSelect(btn.id)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border whitespace-nowrap snap-start ${
                activeStatus === btn.id 
                ? 'bg-[#BC002D] text-white border-[#BC002D] shadow-[0_8px_20px_rgba(188,0,45,0.25)] scale-105' 
                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-900 shadow-sm'
            }`}
        >
            {btn.label}
        </button>
    ))}
</div>
      <div className='flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-20'>

        {/* MOBILE DRAWER */}
        <div className={`fixed inset-0 z-[500] lg:hidden transition-all duration-500 ${showFilter ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div onClick={() => setShowFilter(false)} className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-400 ${showFilter ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute bottom-0 left-0 right-0 bg-[#BC002D] rounded-t-[32px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-h-[85vh] flex flex-col ${showFilter ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className='flex justify-center pt-4 pb-2 flex-shrink-0'><div className='w-10 h-1 rounded-full bg-white/30'></div></div>
            <div className='overflow-y-auto flex-1 px-6 py-6 pb-12'>
              <SidebarContent 
                unifiedIndex={unifiedIndex}
                activeCategory={activeCategory}
                handleCategorySelect={handleCategorySelect}
                sidebarSearch={sidebarSearch}
                setSidebarSearch={setSidebarSearch}
                openGroups={openGroups}
                setOpenGroups={setOpenGroups}
                setShowFilter={setShowFilter}
              />
            </div>
          </div>
        </div>

        

        {/* DESKTOP SIDEBAR */}
        <aside className='hidden lg:block lg:w-[22%] ml-[-5vh] lg:sticky lg:top-10 lg:self-start'>
          <div className='bg-[#BC002D]  p-5 rounded-[40px] shadow-2xl shadow-black/50'>
            <SidebarContent 
                unifiedIndex={unifiedIndex}
                activeCategory={activeCategory}
                handleCategorySelect={handleCategorySelect}
                sidebarSearch={sidebarSearch}
                setSidebarSearch={setSidebarSearch}
                openGroups={openGroups}
                setOpenGroups={setOpenGroups}
                setShowFilter={setShowFilter}
            />
            <button onClick={() => { setSearchParams({}); setSidebarSearch(""); }} className="mt-10 pt-6 border-t border-white/10 w-full text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.3em] text-left transition-colors">
                Reset Index
            </button>
          </div>
        </aside>

        {/* MAIN DISPLAY */}
        <main className='flex-1 min-w-0'>
          <div className='flex items-center justify-between mb-6 md:mb-10 pb-5 border-b border-gray-100 gap-3'>
            <div className='flex flex-col gap-1.5 min-w-0'>
              <div className='flex items-center gap-2'>
                <LayoutGrid size={12} className='text-gray-400 flex-shrink-0' />
                <p className='text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#6A7EFC] whitespace-nowrap'>
                  <span className='text-black font-mono'>{totalFound}</span> items
                </p>
              </div>
              {activeCategory && (
                <div className='flex items-center gap-1.5 animate-fade-in'>
                  <span className='text-[9px] font-black uppercase tracking-widest text-[#BC002D] truncate max-w-[120px]'>{activeCategory}</span>
                  <button onClick={() => setSearchParams({})} className='p-0.5 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors flex-shrink-0'><X size={10} /></button>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2 flex-shrink-0'>
              <button onClick={() => setShowFilter(true)} className='lg:hidden flex items-center gap-1.5 bg-black text-white py-2.5 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg'><SlidersHorizontal size={10} /><span>Categories</span></button>
              <div className='flex items-center gap-1.5 bg-gray-50 py-2.5 px-3.5 rounded-xl'>
                <ArrowUpDown size={12} className='text-gray-900 flex-shrink-0' />
                <select value={sortType} onChange={(e) => setSortType(e.target.value)} className='text-[9px] md:text-[10px] font-black text-gray-900 uppercase tracking-[0.15em] outline-none bg-transparent cursor-pointer max-w-[90px] md:max-w-none'>
                <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="year-new">Year: Recent First</option>
                        <option value="year-old">Year: Oldest First</option>
                        <option value="name-asc">Alphabetical: A-Z</option>
                </select>
              </div>
            </div>
          </div>

         {/* --- UPDATED GRID CONTAINER --- */}
         {/* Inside Collection.jsx */}
{/* Inside Collection.jsx */}
<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12 items-stretch'>
  {products.map((item) => (
    <div key={item._id} className="flex flex-col h-full"> 
      <ProductItem 
        id={String(item._id)}      // Force String to prevent Object ID mismatch
        _id={String(item._id)}     // Force String to prevent Object ID mismatch
        image={item.image} 
        name={item.name} 
        price={item.price} 
        marketPrice={item.marketPrice} 
        category={item.category} 
        stock={item.stock}  
        isPriorityMode={false} 
      />
    </div>
  ))}
</div>
          {totalPages > 1 && (
            <div className='flex flex-wrap items-center justify-center gap-2 mt-16 mb-6'>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className='p-2.5 md:p-3 rounded-xl bg-gray-50 text-gray-500 hover:bg-black hover:text-white disabled:opacity-30 transition-all active:scale-95'><ChevronLeft size={16} /></button>
              <div className='flex items-center gap-1.5'>{renderPageNumbers()}</div>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className='p-2.5 md:p-3 rounded-xl bg-gray-50 text-gray-500 hover:bg-black hover:text-white disabled:opacity-30 transition-all active:scale-95'><ChevronRight size={16} /></button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Collection;