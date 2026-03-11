import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const ShopByCountry = () => {
    const { navigate, backendUrl } = useContext(ShopContext);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch from Category Table instead of processing 1 Lakh+ products
    useEffect(() => {
        const fetchCountryCategories = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/category/list`);
                if (res.data.success) {
                    // Filter categories where group is "Country"
                    const countryCats = res.data.categories.filter(cat => cat.group === "Country");
                    setCountries(countryCats);
                }
            } catch (err) {
                console.error("Archive Jurisdictions sync error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCountryCategories();
    }, [backendUrl]);

    // 2. Map and Clean Data for UI
    const displayedCountries = useMemo(() => {
        // Comprehensive mapping for the Flag API
        const isoMapping = {
            "india": "in", "united states": "us", "great britain": "gb",
            "germany": "de", "france": "fr", "russia": "ru", 
            "iran": "ir", "thailand": "th", "serbia": "rs",
            "south africa": "za", "south korea": "kr", "malaysia": "my",
            "philippines": "ph", "bangladesh": "bd", "armenia": "am",
            "belarus": "by", "canada": "ca", "australia": "au"
        };
    
        return countries.map(cat => {
            // 1. Strip "Country > " (Case Insensitive)
            const cleanName = cat.name.replace(/^Country\s*>\s*/i, '').trim();
            
            // 2. Lookup using Lowercase to prevent "Iran" vs "iran" mismatches
            const code = isoMapping[cleanName.toLowerCase()] || "un"; 
    
            return {
                originalName: cat.name,
                displayName: cleanName,
                count: cat.productCount || 0,
                code: code 
            };
        }).sort((a, b) => b.count - a.count).slice(0, 12);
    }, [countries]);

    const handleCountryClick = (categoryName) => {
        // Navigate using the full category name used in the DB (e.g., "Country > India")
        navigate(`/collection?category=${encodeURIComponent(categoryName)}`);
        window.scrollTo(0, 0);
    };

    if (loading) return (
        <div className='h-40 flex items-center justify-center'>
            <Loader2 className='animate-spin text-[#BC002D]' size={24} />
        </div>
    );

    return (
        <div className='py-5 bg-white border-y border-gray-100'>
            <div>
                
                {/* Header */}
                {/* <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6'>
                    <div>
                        <h2 className='text-3xl font-bold tracking-tighter uppercase  text-gray-900'>
                            SHOP BY <span className='text-[#BC002D]'>Country.</span>
                        </h2>
                    </div>
                    <button 
                        onClick={() => navigate('/collection')}
                        className='text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border-b border-black pb-1 hover:text-[#BC002D] hover:border-[#BC002D] transition-all'
                    >
                        Explore Global Archive <ArrowRight size={14} className='group-hover:translate-x-1 transition-transform' />
                    </button>
                </div> */}

                {/* Flag Grid */}
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6'>
                    {displayedCountries.map((country) => (
                        <div 
                            key={country.originalName}
                            onClick={() => handleCountryClick(country.originalName)}
                            className='group cursor-pointer bg-gray-50 p-4 border border-transparent hover:border-[#BC002D] hover:bg-white transition-all duration-500 rounded-sm'
                        >
                            <div className='aspect-[3/2] overflow-hidden mb-4 shadow-sm border border-gray-200 relative'>
                            <img 
    src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
    alt={`${country.displayName} Registry`}
    className='w-full h-full object-cover  group-hover:grayscale-0 transition-all duration-700'
    // Error handling: if the image fails, show a generic globe
    onError={(e) => { e.target.src = "https://flagcdn.com/w320/un.png"; }}
/>
                                <div className='absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none'></div>
                            </div>
                            
                            <div className='flex flex-col items-center text-center'>
                                <p className='text-[10px] lg:text-[13px] font-semibold tracking-tight text-gray-900 text-transform:capatlized tracking-tighter text-gray-900 group-hover:text-[#BC002D] transition-colors'>
                                    {country.displayName}
                                </p>
                                <p className='text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1'>
                                    {country.count.toLocaleString()} Specimens
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShopByCountry;