import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    // --- ADMINISTRATIVE PROTOCOLS (Dynamic) ---
    const [exchangeRate, setExchangeRate] = useState(83); 
    const [deliveryFees, setDeliveryFees] = useState({ 
        indiaFee: 125, 
        indiaFeeFast: 250, 
        globalFee: 750, 
        globalFeeFast: 1500,
        isIndiaFastActive: false,
        isGlobalFastActive: false
    });
    const [currency, setCurrency] = useState('INR'); 


    // Helper to get delivery fee based on selected country logic
    // Helper to get delivery fee based on region and speed protocol
    const getDeliveryFee = (country = 'India', method = 'standard') => {
        // Safety Check: If deliveryFees hasn't loaded yet, return a default number
        if (!deliveryFees) return 125; 
    
        const totalAmount = getCartAmount();
        const isIndia = country?.toLowerCase().trim() === 'india';
    
        // Protocol: Free delivery ONLY for Standard India orders >= 4999
        if (isIndia && method === 'standard' && totalAmount >= 4999) {
            return 0;
        }
    
        if (isIndia) {
            // FIXED: Changed .india to .indiaFee and .indiaFast to .indiaFeeFast
            return method === 'fast' ? deliveryFees.indiaFeeFast : deliveryFees.indiaFee;
        } else {
            // FIXED: Changed .global to .globalFee and .globalFast to .globalFeeFast
            return method === 'fast' ? deliveryFees.globalFeeFast : deliveryFees.globalFee;
        }
    };

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('');
    const [userData, setUserData] = useState(null);
    const [userPoints, setUserPoints] = useState(0);
    const [cartItems, setCartItems] = useState({});
    const [wishlist, setWishlist] = useState([]);
    const [showSideCart, setShowSideCart] = useState(false);




    // Add this inside your ShopContextProvider
const fetchLiveExchangeRate = async () => {
    try {
        // You can get a free API key at exchangerate-api.com
        // For public testing, we'll use their open endpoint
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        
        if (response.data && response.data.rates && response.data.rates.INR) {
            const liveRate = response.data.rates.INR;
            setExchangeRate(Number(liveRate));
            console.log(`Registry Protocol: Live USD/INR Rate synced at ${liveRate}`);
        }
    } catch (error) {
        console.error("External Exchange API offline: Falling back to Admin Settings.");
        // If live API fails, we fall back to your database admin settings
        fetchAdminSettings();
    }
};

// Update your Startup Logic
useEffect(() => {
    getProductsData();
    fetchLiveExchangeRate(); // Sync live rates on load
    
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
        setToken(storedToken);
        fetchUserData(storedToken);
        getUserCart(storedToken);
        getWishlistData(storedToken);
    }
}, []);

    // --- FETCH ADMIN SETTINGS FROM DATABASE ---
    // --- FETCH ADMIN SETTINGS FROM DATABASE ---
    const fetchAdminSettings = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/settings');
            if (response.data.success) {
                const s = response.data.settings; //
                
                setDeliveryFees({ 
                    indiaFee: Number(s.indiaFee || 125), //
                    indiaFeeFast: Number(s.indiaFeeFast || 250), //
                    globalFee: Number(s.globalFee || 749), //
                    globalFeeFast: Number(s.globalFeeFast || 1500), //
                    isIndiaFastActive: s.isIndiaFastActive ?? true, //
                    isGlobalFastActive: s.isGlobalFastActive ?? true //
                });
            }
        } catch (error) {
            console.error("Registry Protocols Offline:", error); //
        }
    };

    // --- WISHLIST LOGIC ---
    const toggleWishlist = async (itemId) => {
        if (!token) {
            toast.error("Please login to save specimens");
            return;
        }
    
        const wasInWishlist = wishlist.includes(itemId);
        const updatedWishlist = wasInWishlist 
            ? wishlist.filter(id => id !== itemId) 
            : [...wishlist, itemId];
        
        setWishlist(updatedWishlist);
    
        try {
            const response = await axios.post(backendUrl + '/api/user/wishlist-toggle', { itemId }, { headers: { token } });
            if (!response.data.success) {
                setWishlist(wishlist); 
                toast.error("Registry sync failed");
            }
        } catch (error) {
            setWishlist(wishlist);
            toast.error("Archive connection failed");
            console.error(error);
        }
    };
    
    const getWishlistData = async (userToken) => {
        try {
            const response = await axios.post(backendUrl + '/api/user/wishlist-get', {}, { headers: { token: userToken } });
            if (response.data.success) {
                setWishlist(response.data.wishlist);
            }
        } catch (error) { 
            console.error("Wishlist sync failed:", error); 
        }
    };

    // --- CURRENCY LOGIC ---
    const toggleCurrency = () => {
        setCurrency(prev => prev === 'INR' ? 'USD' : 'INR');
    };

    const formatPrice = (price) => {
        if (currency === 'USD') {
            return (price / exchangeRate).toFixed(2);
        }
        return price;
    };

    // --- DATA FETCHING ---
    const fetchUserData = async (activeToken) => {
        const tokenToUse = activeToken || token || localStorage.getItem('token');
        if (!tokenToUse) return;

        try {
            const response = await axios.get(backendUrl + '/api/user/profile', { 
                headers: { token: tokenToUse } 
            });
            if (response.data.success) {
                setUserData(response.data.user);
                setUserPoints(response.data.user.totalRewardPoints || 0);
            }
        } catch (error) {
            console.error("Archive connection failed:", error);
        }
    }

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');
            if (response.data.success) {
                setProducts(response.data.products.reverse());
            }
        } catch (error) {
            console.error(error);
        }
    }

    // --- CART LOGIC ---
    const addToCart = async (itemId, quantity) => {
        // Find the specimen in the registry to check stock
        const product = products.find(p => p._id === itemId);
        const currentCartQty = cartItems[itemId] || 0;
        const requestedTotal = currentCartQty + quantity;
    
        // Check if the request exceeds available stock
        if (product && requestedTotal > product.stock) {
            toast.error(`Limited Acquisition: Only ${product.stock} specimens available in the registry.`);
            return; // Terminate protocol
        }
    
        let cartData = structuredClone(cartItems);
        cartData[itemId] = requestedTotal;
    
        setCartItems(cartData);
        setShowSideCart(true);
    
        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, quantity }, { headers: { token } });
            } catch (error) {
                console.error(error);
                toast.error(error.message);
            }
        }
    };
    
    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, quantity) => {
        const product = products.find(p => p._id === itemId);
    
        // Block manual entry higher than stock
        if (product && quantity > product.stock) {
            toast.error(`Exceeds Registry Stock: Max ${product.stock} items allowed.`);
            return;
        }
    
        let cartData = structuredClone(cartItems);
    
        if (quantity <= 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
    
        setCartItems(cartData);
    
        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, quantity }, { headers: { token } });
            } catch (error) {
                console.error(error);
                toast.error(error.message);
            }
        }
    };

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo && cartItems[items] > 0) {
                totalAmount += itemInfo.price * cartItems[items];
            }
        }
        return totalAmount;
    };

    const getUserCart = async (userToken) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token: userToken } });
            if (response.data.success) {
                setCartItems(response.data.cartData || {});
            }
        } catch (error) { console.error(error); }
    }

    // --- STARTUP LOGIC ---
    useEffect(() => {
        getProductsData();
        fetchAdminSettings(); // NEW: Pulls dynamic rates and fees from DB
        
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserData(storedToken);
            getUserCart(storedToken);
            getWishlistData(storedToken);
        }
    }, []);

    const value = {
        products, currency, toggleCurrency, formatPrice, 
        getDeliveryFee, // Exposed as a function for country-based calculation
        exchangeRate, 
        search, setSearch, showSearch, setShowSearch,setProducts,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity, getCartAmount, 
        navigate, backendUrl, setToken, token,
        userPoints, setUserPoints, userData, fetchUserData,
        toggleWishlist, wishlist, getWishlistData ,showSideCart, 
        setShowSideCart
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;