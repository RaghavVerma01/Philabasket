import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import {
    Trash2, FolderTree, RefreshCw, ChevronRight, Check, Search, 
    Plus, Tag, Layers, ArrowRight, Star, StarOff, Globe, Sparkles, X, Image as ImageIcon
} from 'lucide-react';

const CategoryManager = ({ token }) => {
    const [categories, setCategories] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [childSearch, setChildSearch] = useState('');
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [quickAddName, setQuickAddName] = useState('');
    const [activeTab, setActiveTab] = useState('add');
    const [featuredSearch, setFeaturedSearch] = useState("");
    const [showFeaturedAdd, setShowFeaturedAdd] = useState(false);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/category/list');
            if (response.data.success) setCategories(response.data.categories);
        } catch { toast.error('Failed to load categories'); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const toggleFeatured = async (name, currentStatus) => {
        try {
            const response = await axios.post(backendUrl + '/api/category/update', 
                { name, featured: !currentStatus }, { headers: { token } });
            if (response.data.success) {
                toast.success(`${name} ${!currentStatus ? 'Pinned' : 'Unpinned'}`);
                fetchCategories();
            }
        } catch { toast.error('Update failed'); }
    };

    const handleUpdateImage = async (name, currentImage) => {
        const newUrl = window.prompt("Paste Cloudinary Image URL for this category:", currentImage || "");
        if (newUrl === null) return; 
        try {
            const response = await axios.post(backendUrl + '/api/category/update', 
                { name, image: newUrl }, { headers: { token } });
            if (response.data.success) {
                toast.success("Image Updated");
                fetchCategories();
            }
        } catch { toast.error("Failed to update image"); }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickAddName.trim()) return;
        try {
            const response = await axios.post(backendUrl + '/api/category/add',
                { name: quickAddName.trim() }, { headers: { token } });
            if (response.data.success) {
                toast.success(`"${quickAddName}" added`);
                setQuickAddName('');
                fetchCategories();
            }
        } catch { toast.error('Failed to add category'); }
    };

    // Memoized Data Processing
    const featuredCategories = useMemo(() => categories.filter(c => c.featured).sort((a,b) => a.name.localeCompare(b.name)), [categories]);
    const groupedData = useMemo(() => {
        const groups = {};
        categories.forEach(cat => {
            const key = cat.group && cat.group !== 'Independent' ? cat.group : '— Ungrouped';
            if (!groups[key]) groups[key] = [];
            groups[key].push(cat);
        });
        return groups;
    }, [categories]);

    const nonFeaturedSearchList = useMemo(() => 
        categories.filter(c => !c.featured && c.name.toLowerCase().includes(featuredSearch.toLowerCase())).slice(0, 5)
    , [categories, featuredSearch]);

    const availableToMap = useMemo(() =>
        categories.filter(c => (c.group === 'Independent' || !c.group) && c.name.toLowerCase().includes(childSearch.toLowerCase()))
    , [categories, childSearch]);

    const existingGroups = useMemo(() => [...new Set(categories.map(c => c.group).filter(g => g && g !== 'Independent'))].sort(), [categories]);

    const toggleChildSelection = (name) => {
        setSelectedChildren(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    };

    const onSubmitGrouping = async (e) => {
        e.preventDefault();
        const finalGroup = isCreatingNewGroup ? newGroupName.trim() : selectedGroup;
        if (!finalGroup || selectedChildren.length === 0) return toast.warning('Missing selection');
        try {
            setLoading(true);
            await Promise.all(selectedChildren.map(name => 
                axios.post(backendUrl + '/api/category/update', { name, group: finalGroup }, { headers: { token } })
            ));
            toast.success('Grouping successful');
            setSelectedChildren([]);
            fetchCategories();
        } catch { toast.error('Grouping failed'); } finally { setLoading(false); }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Delete category?')) return;
        try {
            const response = await axios.post(backendUrl + '/api/category/remove', { id }, { headers: { token } });
            if (response.data.success) { toast.success('Deleted'); fetchCategories(); }
        } catch { toast.error('Error'); }
    };

    return (
        <div className='min-h-screen bg-[#F7F6F3] pb-20' style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className='max-w-5xl mx-auto px-6 py-10'>
                
                {/* 1. FEATURED SECTION */}
                <div className='mb-12'>
                    <div className='flex items-center justify-between mb-6'>
                        <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center'><Star size={20} className='text-amber-600 fill-amber-600' /></div>
                            <div>
                                <h2 className='text-xl font-black text-gray-900 tracking-tight'>Featured Collection</h2>
                                <p className='text-xs text-gray-400 font-medium uppercase'>Frontend Scroll Items</p>
                            </div>
                        </div>
                        <button onClick={() => setShowFeaturedAdd(!showFeaturedAdd)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showFeaturedAdd ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600'}`}>
                            {showFeaturedAdd ? <X size={14}/> : <Plus size={14}/>} {showFeaturedAdd ? 'Close' : 'Pin New'}
                        </button>
                    </div>

                    <div className='bg-white rounded-3xl border-2 border-amber-100 shadow-sm overflow-hidden'>
                        {showFeaturedAdd && (
                            <div className='p-6 bg-amber-50/50 border-b border-amber-100 animate-fade-in'>
                                <div className='relative max-w-md'>
                                    <Search size={14} className='absolute left-4 top-1/2 -translate-y-1/2 text-amber-600' />
                                    <input type="text" placeholder="Find category..." value={featuredSearch} onChange={(e) => setFeaturedSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-amber-200 rounded-2xl text-xs font-bold outline-none" />
                                </div>
                                <div className='mt-4 flex flex-wrap gap-2'>
                                    {featuredSearch.length > 0 && nonFeaturedSearchList.map(cat => (
                                        <button key={cat._id} onClick={() => {toggleFeatured(cat.name, false); setFeaturedSearch("");}} className='flex items-center gap-2 bg-white border border-amber-100 px-3 py-2 rounded-xl text-[10px] font-bold'><Sparkles size={12}/> {cat.name}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='p-6 flex flex-wrap gap-3'>
                            {featuredCategories.length === 0 ? <p className='text-sm text-gray-400'>No featured items.</p> : 
                                featuredCategories.map(cat => (
                                    <div key={cat._id} className='flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl'>
                                        {cat.image && <img src={cat.image} className='w-6 h-6 rounded-full object-cover' alt="" />}
                                        <div className='flex flex-col'>
                                            <p className='text-xs font-black text-amber-900'>{cat.name}</p>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <button onClick={() => handleUpdateImage(cat.name, cat.image)} className='p-1.5 hover:bg-white rounded-lg text-amber-600'><ImageIcon size={14}/></button>
                                            <button onClick={() => toggleFeatured(cat.name, true)} className='p-1.5 hover:bg-white rounded-lg text-red-500'><StarOff size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>

                {/* 2. TABS */}
                <div className='flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm'>
                    <button onClick={() => setActiveTab('add')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold ${activeTab === 'add' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}><Tag size={15} /> Add</button>
                    <button onClick={() => setActiveTab('group')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold ${activeTab === 'group' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}><Layers size={15} /> Group</button>
                </div>

                {activeTab === 'add' && (
                    <div className='bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8'>
                        <div className='px-8 py-6 border-b border-gray-100'>
                            <div className='flex items-center gap-3'>
                                <div className='w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center'>
                                    <Plus size={18} className='text-white' />
                                </div>
                                <div>
                                    <h2 className='text-base font-bold text-gray-900'>Add New Category</h2>
                                    <p className='text-xs text-gray-400 mt-0.5'>New categories start as ungrouped and can be organized later</p>
                                </div>
                            </div>
                        </div>
                        <div className='px-8 py-8'>
                            <form onSubmit={handleQuickAdd} className='flex gap-3 max-w-lg'>
                                <div className='flex-1 relative'>
                                    <input
                                        type='text'
                                        value={quickAddName}
                                        onChange={(e) => setQuickAddName(e.target.value)}
                                        placeholder='e.g. Electronics, Footwear, Books...'
                                        className='w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-gray-900 focus:bg-white transition-all'
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={!quickAddName.trim()}
                                    className='px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-[#BC002D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap'
                                >
                                    <Plus size={16} />
                                    Add Category
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── GROUP CATEGORIES PANEL ─── */}
                {activeTab === 'group' && (
                    <div className='bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8'>
                        <div className='px-8 py-6 border-b border-gray-100'>
                            <div className='flex items-center gap-3'>
                                <div className='w-9 h-9 bg-[#BC002D] rounded-xl flex items-center justify-center'>
                                    <Layers size={18} className='text-white' />
                                </div>
                                <div>
                                    <h2 className='text-base font-bold text-gray-900'>Group Categories</h2>
                                    <p className='text-xs text-gray-400 mt-0.5'>Select ungrouped categories and assign them to a group</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={onSubmitGrouping} className='p-8 space-y-8'>

                            {/* STEP 1 */}
                            <div>
                                <div className='flex items-center gap-3 mb-4'>
                                    <div className='w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center'>
                                        <span className='text-[10px] font-black text-gray-500'>1</span>
                                    </div>
                                    <p className='text-xs font-bold text-gray-500 uppercase tracking-widest'>Choose or Create a Group</p>
                                </div>

                                <div className='flex gap-2 mb-3'>
                                    <button
                                        type='button'
                                        onClick={() => setIsCreatingNewGroup(false)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isCreatingNewGroup ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        Existing Group
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setIsCreatingNewGroup(true)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isCreatingNewGroup ? 'bg-[#BC002D] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        + New Group
                                    </button>
                                </div>

                                {isCreatingNewGroup ? (
                                    <input
                                        autoFocus
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className='w-full max-w-sm px-5 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium outline-none focus:border-[#BC002D] transition-all'
                                        placeholder='New group name...'
                                    />
                                ) : (
                                    <div className='relative max-w-sm'>
                                        <select
                                            value={selectedGroup}
                                            onChange={(e) => setSelectedGroup(e.target.value)}
                                            className='w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer focus:border-gray-900 transition-all'
                                        >
                                            <option value=''>Select a group...</option>
                                            {existingGroups.map((g, i) => <option key={i} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronRight size={14} className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none' />
                                    </div>
                                )}
                            </div>

                            {/* STEP 2 */}
                            <div>
                                <div className='flex items-center justify-between mb-4'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center'>
                                            <span className='text-[10px] font-black text-gray-500'>2</span>
                                        </div>
                                        <p className='text-xs font-bold text-gray-500 uppercase tracking-widest'>Select Ungrouped Categories</p>
                                    </div>
                                    {selectedChildren.length > 0 && (
                                        <span className='text-xs font-bold text-[#BC002D]'>{selectedChildren.length} selected</span>
                                    )}
                                </div>

                                <div className='relative mb-3 max-w-sm'>
                                    <Search size={13} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                                    <input
                                        type='text'
                                        value={childSearch}
                                        onChange={(e) => setChildSearch(e.target.value)}
                                        placeholder='Filter ungrouped categories...'
                                        className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-gray-900 transition-all'
                                    />
                                </div>

                                <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[100px] max-h-[180px] overflow-y-auto custom-scrollbar'>
                                    {availableToMap.length === 0 ? (
                                        <div className='h-full flex flex-col items-center justify-center py-6 text-gray-300'>
                                            <FolderTree size={28} className='mb-2' />
                                            <p className='text-xs font-bold'>No ungrouped categories found</p>
                                        </div>
                                    ) : (
                                        <div className='flex flex-wrap gap-2'>
                                            {availableToMap.map(cat => (
                                                <button
                                                    key={cat._id}
                                                    type='button'
                                                    onClick={() => toggleChildSelection(cat.name)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border
                                                        ${selectedChildren.includes(cat.name)
                                                            ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'}`}
                                                >
                                                    {selectedChildren.includes(cat.name) && <Check size={11} />}
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className='pt-2'>
                                <button
                                    type='submit'
                                    disabled={loading}
                                    className='flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-[#BC002D] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-[0.98]'
                                >
                                    {loading ? <RefreshCw className='animate-spin' size={16} /> : <ArrowRight size={16} />}
                                    {loading ? 'Saving...' : `Assign to Group${selectedChildren.length > 0 ? ` (${selectedChildren.length})` : ''}`}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 3. STRUCTURE MAP */}
                <div className='mt-12 grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {Object.keys(groupedData).sort().map(groupName => (
                        <div key={groupName} className='bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col'>
                            <div className='px-6 py-4 border-b bg-gray-50/40 font-black text-[10px] uppercase tracking-widest'>{groupName}</div>
                            <div className='p-5 space-y-2'>
                                {groupedData[groupName].map(item => (
                                    <div key={item._id} className='flex items-center justify-between bg-gray-50 p-3 rounded-xl border hover:border-[#BC002D]/30 transition-all'>
                                        <div className='flex items-center gap-3'>
                                            {item.image && <img src={item.image} className='w-8 h-8 rounded-full object-cover' alt="" />}
                                            <div className='flex flex-col'>
                                                <p className='text-xs font-bold'>{item.name}</p>
                                                <p className='text-[9px] text-gray-400 font-bold'>{item.productCount} Products</p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <button onClick={() => handleUpdateImage(item.name, item.image)} className='p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-500'><ImageIcon size={14}/></button>
                                            <button onClick={() => toggleFeatured(item.name, item.featured)} className={`p-2 rounded-lg ${item.featured ? 'text-amber-600' : 'text-gray-300'}`}><Star size={14} className={item.featured ? 'fill-amber-600' : ''} /></button>
                                            <button onClick={() => deleteCategory(item._id)} className='p-2 text-gray-300 hover:text-red-500'><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;