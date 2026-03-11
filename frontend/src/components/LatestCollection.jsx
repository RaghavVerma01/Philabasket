import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, ChevronDown, X, Plus, Minus ,ArrowRight} from 'lucide-react'; 
import ShopByCountry from './ShobByCountry';

const LatestCollection = () => {
    const { products, backendUrl } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [openGroups, setOpenGroups] = useState({}); 
    const [searchTerm, setSearchTerm] = useState(""); 
    const [showAllMobile, setShowAllMobile] = useState(false); // Mobile toggle state
    const navigate = useNavigate();

    const fetchCategories = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/category/list');
            if (response.data.success) {
                setDbCategories(response.data.categories);
            }
        } catch (error) {
            console.error("Category Fetch Error:", error);
        }
    };

    useEffect(() => {
        if (!products) return;
        const filtered = products
            .filter(item => item.newArrival === true || item.newArrival === "true")
            .sort((a, b) => b.date - a.date)
            .slice(0, 15);
        setLatestProducts(filtered); 
    }, [products]);

    useEffect(() => {
        if (backendUrl) fetchCategories();
    }, [backendUrl]);

    const unifiedIndex = useMemo(() => {
        if (!dbCategories.length) return [];
        
        const groupsMap = {};
        const independentList = [];
        const term = searchTerm.toLowerCase().trim();
    
        const normalize = (str) => {
            if (!str) return "";
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        };
    
        dbCategories.forEach(cat => {
            const catName = cat.name.toLowerCase();
            const groupNameRaw = cat.group ? cat.group.trim() : "";
            const groupNameLower = groupNameRaw.toLowerCase();
            
            // Match condition: search term is in category name OR group name
            const isMatch = catName.includes(term) || groupNameLower.includes(term);
            if (!isMatch && term !== "") return;
    
            const normalizedName = normalize(cat.name);
            const item = { name: normalizedName, count: cat.productCount || 0 };
            const isIndependent = !groupNameRaw || ['general', 'independent', 'none', ''].includes(groupNameLower);
    
            if (isIndependent) {
                independentList.push({ ...item, type: 'independent' });
            } else {
                const gName = normalize(groupNameRaw);
                if (!groupsMap[gName]) {
                    groupsMap[gName] = { name: gName, type: 'group', items: [], totalCount: 0 };
                }
                groupsMap[gName].items.push(item);
                groupsMap[gName].totalCount += item.count;
                
                // AUTO-OPEN: If we are searching and find a match in a group, force it open
                if (term !== "" && !openGroups[gName]) {
                    setOpenGroups(prev => ({ ...prev, [gName]: true }));
                }
            }
        });
    
        const combined = [...Object.values(groupsMap), ...independentList];
        return combined.sort((a, b) => a.name.localeCompare(b.name));
    }, [dbCategories, searchTerm]);

    // Logic to slice the index for mobile view
    const displayedIndex = useMemo(() => {
        if (showAllMobile || window.innerWidth >= 1024) {
            return unifiedIndex;
        }
        return unifiedIndex.slice(0, 5);
    }, [unifiedIndex, showAllMobile]);

    const toggleGroup = (groupName) => setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));

    const handleCategoryClick = (catName) => {
        navigate(`/collection?category=${encodeURIComponent(catName)}`, { replace: true });
        window.scrollTo(0, 0);
    };

    const handleProductClick = (productId) => { 
        navigate('/collection', { state: { priorityId: productId } }); 
        window.scrollTo(0, 0); 
    };

    return (
        <div className='bg-white py-12 md:py-32 overflow-hidden select-none relative'>
            <div className="absolute -left-[10vw] top-[10%] h-[80%] w-[35%] bg-[#bd002d]/5 rounded-r-[600px] pointer-events-none"></div>

            <div className='px-6 md:px-16 lg:px-24 relative z-10'>
                {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 border border-[#BC002D] rounded-full flex items-center justify-center">
                                <span className="text-[10px] font-serif italic text-[#BC002D] font-bold">PB</span>
                            </div>
                            <span className="text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black">Featured Specimens</span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-bold text-gray-900 tracking-tighter leading-none">
                            NEW <span className="text-[#bd002d]">Arrivals.</span>
                        </h2>
                    </div>
                </div> */}

                <div className='flex flex-col lg:flex-row gap-12'>
                    {/* --- SIDEBAR --- */}
                    <div className='w-full lg:w-[24%]'>
                        <div className='lg:sticky lg:top-32'>
                        <div className='bg-[#bd002d] p-2 lg:p-5 rounded-[30px] lg:rounded-[40px] shadow-2xl shadow-[#bd002d]/20 relative overflow-hidden'>
    
    {/* HEADER ROW */}
    <div className='flex items-center justify-between mb-6'>
        <h3 className='text-white font-black text-[9px] lg:text-xs tracking-[0.3em] uppercase'>
            Registry Index
        </h3>

        {/* COMPACT TOGGLE BUTTON (Mobile Only) */}
        {unifiedIndex.length > 5 && (
            <button 
                onClick={() => setShowAllMobile(!showAllMobile)}
                className={`
                    lg:hidden flex items-center gap-2 py-1.5 px-3 rounded-full border transition-all duration-500
                    ${showAllMobile 
                        ? 'bg-white border-white text-[#bd002d]' 
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                    }
                `}
            >
                <span className='text-[8px] font-black uppercase tracking-widest'>
                    {showAllMobile ? 'Less' : `All (${unifiedIndex.length})`}
                </span>
                {showAllMobile ? (
                    <Minus size={10} strokeWidth={3} className="transition-transform" />
                ) : (
                    <Plus size={10} strokeWidth={3} className="transition-transform" />
                )}
            </button>
        )}
        </div>

        <div className='relative z-10 mb-6'>
    <Search size={12} className='absolute left-3 top-1/2 -translate-y-1/2 text-white/40' />
    <input 
        type="text"
        placeholder="Search Registry..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-8 py-2.5 text-[10px] text-white outline-none font-bold  tracking-widest"
    />
    {searchTerm && (
        <button 
            type="button"
            onClick={() => {
                setSearchTerm("");
                setOpenGroups({}); // Optional: close all groups on clear
            }} 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors z-20"
        >
            <X size={14} />
        </button>
    )}
</div>

                                <div className='flex flex-col gap-2 overflow-y-auto max-h-[180vh] hide-scrollbar relative z-10 pr-2'>
                                    {displayedIndex.map((entry) => (
                                        <div key={entry.name} className="flex flex-col">
                                            {entry.type === 'group' ? (
                                                <>
                                                    <button 
                                                        onClick={() => toggleGroup(entry.name)}
                                                        className='text-white/80 hover:text-amber-400 text-[10px] font-black tracking-widest uppercase w-full py-3 px-3 hover:bg-white/5 rounded-xl transition-all flex items-center justify-between group'
                                                    >
                                                        <div className='flex items-center gap-2'>
                                                            <span className='truncate text-transform: capitalize'>{entry.name}</span>
                                                            {/* BRIGHT COUNT: Changed to white/100 */}
                                                            <span className='text-[10px] text-white font-mono font-black'>({entry.totalCount})</span>
                                                        </div>
                                                        <ChevronDown 
                                                            size={14} 
                                                            className={`transition-transform duration-300 ${openGroups[entry.name] ? 'rotate-180 text-amber-400' : 'text-white transition-opacity'}`} 
                                                        />
                                                    </button>
                                                    <div className={`flex flex-col gap-1 ml-4 border-l border-white/10 pl-4 transition-all text-transform: capitalize duration-500 overflow-hidden ${openGroups[entry.name] ? 'max-h-[1000px] mt-2 mb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        {entry.items.sort((a, b) => a.name.localeCompare(b.name)).map((sub) => (
                                                            <button 
                                                                key={sub.name} 
                                                                onClick={() => handleCategoryClick(sub.name)} 
                                                                className='text-white/70 hover:text-white text-[10px] font-bold py-2.5 flex justify-between text-transform: capitalize  border-b border-white/5 last:border-0'
                                                            >
                                                                <span>{sub.name}</span>
                                                                {/* BRIGHT COUNT */}
                                                                <span className='text-amber-400 font-mono font-black'>{sub.count}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleCategoryClick(entry.name)} 
                                                    className='text-white/80 hover:text-amber-400 text-[10px] font-semibold tracking-widest uppercase w-full py-3 px-3 hover:bg-white/5 rounded-xl transition-all flex items-center justify-between group'
                                                >
                                                    <span className='truncate text-transform: capitalize'>{entry.name}</span>
                                                    {/* BRIGHT COUNT */}
                                                    <span className='text-[10px] text-white font-mono font-black'>{entry.count}</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* MOBILE VIEW MORE / LESS BUTTON */}
                                    {unifiedIndex.length > 5 && (
                                        <button 
                                            onClick={() => setShowAllMobile(!showAllMobile)}
                                            className='lg:hidden mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-white/10 rounded-xl text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10'
                                        >
                                            {showAllMobile ? (
                                                <><Minus size={14} /> View Less Index</>
                                            ) : (
                                                <><Plus size={14} /> View All Registry ({unifiedIndex.length})</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN PRODUCT GRID */}
                    {/* MAIN PRODUCT GRID CONTAINER */}
<div className='w-full lg:w-3/4'>
<div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-7 gap-6'>
                    <div>
                    <div className="flex items-center gap-4 mt-4">
                            <span className="h-[1px] w-12 bg-[#BC002D]"></span>
                            <span className="text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black">
                                Curated Selection
                            </span>
                        </div>
                        <h2 className='text-3xl font-bold tracking-tighter uppercase  text-gray-900'>
                            New <span className='text-[#BC002D]'>Arrivals.</span>
                        </h2>
                    </div>
                    <button 
                        onClick={() => navigate('/collection')}
                        className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border-b border-black pb-1 text-[#BC002D] hover:border-[#BC002D] transition-all'
                    >
                        Explore All Products <ArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                    </button>
                </div>
        


    {/* 1. Grid setup: Removed the extra <div> that was breaking the grid layout */}
    <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-16 items-stretch px-2'>

   

        {latestProducts.map((item) => (
            <div 
                key={item._id} 
                onClick={() => handleProductClick(item._id)} 
                className="flex flex-col h-full transition-all duration-500 cursor-pointer relative group"
            >
                {/* 'New' Ribbon Badge */}
                <div className="absolute top-0 right-0 z-20 overflow-hidden w-16 h-16 pointer-events-none">
                    <div className="absolute top-[15%] -right-[35%] bg-[#bd002d] text-white text-[6px] font-black py-1 w-[140%] text-center transform rotate-45 shadow-sm uppercase tracking-tighter">
                        New
                    </div>
                </div>

                {/* Specimen Content */}
                <div className="flex-grow flex flex-col">
                    <div className="w-full flex-grow">
                        <ProductItem 
                            id={item._id} 
                            _id={item._id} 
                            image={item.image} 
                            name={item.name} 
                            price={item.price} 
                            marketPrice={item.marketPrice} 
                            category={item.category ? item.category[0] : ""} 
                            stock={item.stock} 
                            isPriorityMode={true} 
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>

    <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-6 mt-5'>
    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mt-4">
                            <span className="h-[1px] w-12 bg-[#BC002D]"></span>
                            <span className="text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black">
                                Curated Selection
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tighter leading-none uppercase">
                            Shop By  <span className="text-[#bd002d] ml-1">Country.</span>
                        </h2>
                        
                    </div>
                    <button 
                        onClick={() => {navigate('/shopallcountry');window.scroll(0,0)}}
                        className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border-b border-black pb-1 text-[#BC002D] hover:border-[#BC002D] transition-all'
                    >
                        Explore All Countries <ArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                    </button>
                </div>
        

    {/* 2. ShopByCountry placement: Moved outside the grid for proper full-width display */}
    <div className=" border-t border-gray-100 ">
        <ShopByCountry />
    </div>

    <div className='flex justify-center items-center mt-16'>
    <button 
        onClick={() => {
            navigate('/collection');
            window.scrollTo(0, 0);
        }}
        className='text-[11px] text-black uppercase tracking-[0.3em] font-black flex items-center gap-3 group border-b-2 border-black pb-2 hover:text-[#BC002D] hover:border-[#BC002D] transition-all duration-500'
    >
        Explore More Products 
        <ArrowRight size={16} className='group-hover:translate-x-2 transition-transform duration-500' />
    </button>
</div>
</div>
                </div>
            </div>
        </div>
    );
};

export default LatestCollection;