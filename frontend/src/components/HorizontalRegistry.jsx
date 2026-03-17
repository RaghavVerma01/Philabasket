import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ChevronDown, X, ArrowRight } from 'lucide-react';

const HorizontalRegistry = () => {
    const { backendUrl } = useContext(ShopContext);
    const [dbCategories, setDbCategories] = useState([]);
    const [openGroup, setOpenGroup] = useState(null); // Only one open at a time
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const barRef = useRef(null);
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
        if (backendUrl) fetchCategories();
    }, [backendUrl]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (barRef.current && !barRef.current.contains(e.target)) {
                setOpenGroup(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalize = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const unifiedIndex = useMemo(() => {
        if (!dbCategories.length) return [];

        const groupsMap = {};
        const independentList = [];
        const term = searchTerm.toLowerCase().trim();

        dbCategories.forEach(cat => {
            const catName = cat.name.toLowerCase();
            const groupNameRaw = cat.group ? cat.group.trim() : "";
            const groupNameLower = groupNameRaw.toLowerCase();

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
            }
        });

        const combined = [...Object.values(groupsMap), ...independentList];
        return combined.sort((a, b) => a.name.localeCompare(b.name));
    }, [dbCategories, searchTerm]);

    // Search results flat list (for search mode overlay)
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase().trim();
        const results = [];
        dbCategories.forEach(cat => {
            const catName = cat.name.toLowerCase();
            const groupNameRaw = cat.group ? cat.group.trim() : "";
            const groupNameLower = groupNameRaw.toLowerCase();
            if (catName.includes(term) || groupNameLower.includes(term)) {
                results.push({
                    name: normalize(cat.name),
                    group: groupNameRaw ? normalize(groupNameRaw) : null,
                    count: cat.productCount || 0,
                });
            }
        });
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [dbCategories, searchTerm]);

    const handleCategoryClick = (catName) => {
        navigate(`/collection?category=${encodeURIComponent(catName)}`, { replace: true });
        window.scrollTo(0, 0);
        setOpenGroup(null);
        setSearchTerm("");
    };

    const toggleGroup = (groupName) => {
        setOpenGroup(prev => prev === groupName ? null : groupName);
    };

    const isSearchMode = searchTerm.trim().length > 0;

    return (
        <div ref={barRef} className="relative w-full z-40">
            {/* ── Main Bar ── */}
            <div className="bg-[#bd002d] rounded-2xl shadow-xl shadow-[#bd002d]/25 px-5 pt-4 pb-3">

                {/* ── ROW 1: Heading + Search + View All ── */}
                <div className="flex items-center justify-between gap-4 mb-3">

                    {/* Heading */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-px h-6 bg-white/30" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/50 leading-none mb-0.5">Browse</p>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white leading-none">Our Categories</h3>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-shrink-0">
                        <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search registry…"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setOpenGroup(null); }}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                            className="bg-white/10 border border-white/20 rounded-xl pl-8 pr-7 py-2 text-[10px] text-white placeholder-white/40 outline-none font-bold tracking-wider w-40 lg:w-80 focus:w-56 transition-all duration-300 focus:bg-white/15 focus:border-white/40"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* View All — pushed to far right */}
                    <button
                        onClick={() => { navigate('/collection'); window.scrollTo(0, 0); }}
                        className="hidden lg:flex  flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-wider text-white hover:text-[#bd002d] transition-all duration-200 whitespace-nowrap group border border-white/20 hover:border-white"
                    >
                        All Products
                        <ArrowRight size={11} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* ── Thin Divider ── */}
                <div className="w-full h-px bg-white/10 mb-3" />

                {/* ── ROW 2: Category Pills ── */}
                <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">

                    {/* Category Pills — hidden in search mode */}
                    {!isSearchMode && unifiedIndex.map((entry) => (
                        <div key={entry.name} className="relative flex-shrink-0">
                            {entry.type === 'group' ? (
                                <button
                                    onClick={() => toggleGroup(entry.name)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap
                                        ${openGroup === entry.name
                                            ? 'bg-white text-[#bd002d]'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {entry.name}
                                    <span className={`text-[9px] font-mono font-black ${openGroup === entry.name ? 'text-[#bd002d]/60' : 'text-white/50'}`}>
                                        ({entry.totalCount})
                                    </span>
                                    <ChevronDown
                                        size={11}
                                        strokeWidth={3}
                                        className={`transition-transform duration-300 ${openGroup === entry.name ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleCategoryClick(entry.name)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap"
                                >
                                    {entry.name}
                                    <span className="text-[9px] font-mono font-black text-white/50">{entry.count}</span>
                                </button>
                            )}
                        </div>
                    ))}

                    {/* In search mode: show flat result pills */}
                    {isSearchMode && searchResults.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => handleCategoryClick(item.name)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap flex-shrink-0"
                        >
                            <span>{item.name}</span>
                            {item.group && (
                                <span className="text-[8px] text-white/40 font-normal normal-case tracking-normal ml-0.5">
                                    · {item.group}
                                </span>
                            )}
                            <span className="text-amber-400 font-mono font-black text-[9px]">{item.count}</span>
                        </button>
                    ))}

                    {isSearchMode && searchResults.length === 0 && (
                        <span className="text-white/40 text-[10px] font-bold tracking-widest px-3 flex-shrink-0">
                            No results found
                        </span>
                    )}
                </div>
            </div>

            {/* ── Mega-Menu Dropdown ── */}
            {openGroup && !isSearchMode && (() => {
                const group = unifiedIndex.find(e => e.name === openGroup && e.type === 'group');
                if (!group) return null;
                const sorted = [...group.items].sort((a, b) => a.name.localeCompare(b.name));
                // Chunk into columns of 6
                const COLS = Math.min(Math.ceil(sorted.length / 6), 5);
                const colSize = Math.ceil(sorted.length / COLS);
                const columns = Array.from({ length: COLS }, (_, i) =>
                    sorted.slice(i * colSize, i * colSize + colSize)
                );

                return (
                    <div
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden animate-slideDown"
                        style={{ animation: 'slideDown 0.2s ease-out' }}
                    >
                        {/* Mega header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-[#bd002d] rounded-full" />
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">{openGroup}</span>
                                <span className="text-[10px] font-mono font-black text-[#bd002d] bg-[#bd002d]/10 px-2 py-0.5 rounded-full">
                                    {group.totalCount} items
                                </span>
                            </div>
                            <button
                                onClick={() => handleCategoryClick(openGroup)}
                                className="text-[10px] font-black uppercase tracking-widest text-[#bd002d] flex items-center gap-1.5 group hover:gap-2.5 transition-all"
                            >
                                View All {openGroup}
                                <ArrowRight size={12} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        {/* Grid of columns */}
                        <div className={`grid gap-0 px-6 py-5`} style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                            {columns.map((col, ci) => (
                                <div key={ci} className={`flex flex-col gap-0.5 ${ci < columns.length - 1 ? 'border-r border-gray-100 pr-5 mr-5' : ''}`}>
                                    {col.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => handleCategoryClick(item.name)}
                                            className="flex items-center justify-between py-2.5 text-[11px] font-semibold text-gray-700 hover:text-[#bd002d] transition-colors group border-b border-gray-50 last:border-0 text-left"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-[#bd002d] transition-colors flex-shrink-0" />
                                                {item.name}
                                            </span>
                                            <span className="text-[10px] font-mono font-black text-amber-500 ml-3">{item.count}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default HorizontalRegistry;