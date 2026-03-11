import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Globe, ArrowRight, Loader2, Search, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const GlobalArchive = () => {
    const { navigate, backendUrl } = useContext(ShopContext);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAllCountries = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/category/list`);
                if (res.data.success) {
                    const countryCats = res.data.categories.filter(cat => cat.group === "Country");
                    setCountries(countryCats);
                }
            } catch (err) {
                console.error("Global Archive sync error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllCountries();
    }, [backendUrl]);

    const isoMapping = {
        "india": "in", "united states": "us", "great britain": "gb",
        "germany": "de", "france": "fr", "russia": "ru", 
        "iran": "ir", "thailand": "th", "serbia": "rs",
        "south africa": "za", "south korea": "kr", "malaysia": "my",
        "philippines": "ph", "bangladesh": "bd", "armenia": "am",
        "belarus": "by", "canada": "ca", "australia": "au", "italy": "it",
        "japan": "jp", "china": "cn", "brazil": "br", "spain": "es"
    };

    const filteredCountries = useMemo(() => {
        return countries
            .map(cat => {
                const cleanName = cat.name.replace(/^Country\s*>\s*/i, '').trim();
                const code = isoMapping[cleanName.toLowerCase()] || "un"; 
                return {
                    originalName: cat.name,
                    displayName: cleanName,
                    count: cat.productCount || 0,
                    code: code 
                };
            })
            .filter(c => c.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }, [countries, searchTerm]);

    const handleCountryClick = (categoryName) => {
        // Navigate using the full category name used in the DB (e.g., "Country > India")
        navigate(`/collection?category=${encodeURIComponent(categoryName)}`);
        window.scrollTo(0, 0);
    };

    if (loading) return (
        <div className='min-h-screen flex items-center justify-center bg-white'>
            <div className='flex flex-col items-center gap-4'>
                <Loader2 className='animate-spin text-[#BC002D]' size={40} />
                <p className='text-[10px] font-black uppercase tracking-[0.4em] text-gray-400'>Syncing Global Jurisdictions...</p>
            </div>
        </div>
    );

    return (
        <div className='bg-white min-h-screen pt-10 pb-20 px-6 md:px-16 lg:px-24 select-none'>
            {/* Header Section */}
            <div className='mb-16'>
                <button 
                    onClick={() => navigate(-1)} 
                    className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#BC002D] mb-8 transition-colors'
                >
                    <ArrowLeft size={14} /> Back to Archive
                </button>

                <div className='flex flex-col lg:flex-row lg:items-end justify-between gap-8'>
                    <div>
                        <div className='flex items-center gap-4 mb-4'>
                            <span className='h-[1.5px] w-12 bg-[#BC002D]'></span>
                            <p className='text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black'>Global Jurisdictions</p>
                        </div>
                        <h2 className='text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter uppercase leading-none'>
                            World <span className='text-[#BC002D]'>Registry.</span>
                        </h2>
                    </div>

                    {/* Search Bar */}
                    <div className='relative w-full max-w-md'>
                        <Search size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                        <input 
                            type="text" 
                            placeholder="SEARCH JURISDICTION..." 
                            className='w-full bg-gray-50 border border-gray-100 rounded-full py-4 pl-12 pr-6 text-[11px] font-bold uppercase tracking-widest outline-none focus:border-[#BC002D]/30 transition-all'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Jurisdictions Grid */}
            {filteredCountries.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10'>
                    {filteredCountries.map((country) => (
                        <div 
                            key={country.originalName}
                            onClick={() => handleCountryClick(country.originalName)}
                            className='group cursor-pointer'
                        >
                            <div className='aspect-[3/2] overflow-hidden mb-5 shadow-lg border border-gray-100 relative rounded-sm transition-transform duration-500 group-hover:-translate-y-2'>
                                <img 
                                    src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                                    alt={country.displayName}
                                    className='w-full h-full object-cover transition-all duration-700'
                                    onError={(e) => { e.target.src = "https://flagcdn.com/w320/un.png"; }}
                                />
                                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500'></div>
                            </div>
                            
                            <div className='flex flex-col items-center text-center'>
                            <p className='text-[10px] lg:text-[13px] font-semibold tracking-tight text-gray-900 text-transform:capatlized tracking-tighter text-gray-900 group-hover:text-[#BC002D] transition-colors'>

                                    {country.displayName}
                                </p>
                                <div className='flex items-center gap-2 mt-1'>
                                    <span className='h-[1px] w-4 bg-gray-200'></span>
                                    <p className='text-[9px] font-bold text-gray-400 uppercase tracking-widest'>
                                        {country.count} Specimens
                                    </p>
                                    <span className='h-[1px] w-4 bg-gray-200'></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className='py-40 text-center border border-dashed border-gray-100 rounded-3xl'>
                    <Globe size={48} className='mx-auto text-gray-200 mb-4' />
                    <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Jurisdiction Not Found in Archive</p>
                </div>
            )}
        </div>
    );
};

export default GlobalArchive;