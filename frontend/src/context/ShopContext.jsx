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
    const [deliveryFees, setDeliveryFees] = useState({ india: 125, global: 750 });
    const [currency, setCurrency] = useState('INR'); 

    // Helper to get delivery fee based on selected country logic
    const getDeliveryFee = (country = 'India') => {
        const totalAmount = getCartAmount(); // Get current cart total
        const normalizedCountry = country?.toLowerCase().trim();
    
        // Protocol: Free delivery for orders above 4999 in India
        if (normalizedCountry === 'india' && totalAmount >= 4999) {
            return 0;
        }
    
        // Standard Fees
        return normalizedCountry === 'india' ? deliveryFees.india : deliveryFees.global;
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
    const fetchAdminSettings = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/settings');
            if (response.data.success) {
                const { indiaFee, globalFee } = response.data.settings;
                // setExchangeRate(Number(rate));
                setDeliveryFees({ 
                    india: Number(indiaFee), 
                    global: Number(globalFee) 
                });
            }
        } catch (error) {
            console.error("Registry Protocols Offline: Using fallback values.", error);
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
        let cartData = structuredClone(cartItems);
    
        if (cartData[itemId]) {
            cartData[itemId] += quantity;
        } else {
            cartData[itemId] = quantity;
        }
    
        setCartItems(cartData);
        setShowSideCart(true);
    
        if (token) {
            try {
                await axios.post(
                    backendUrl + '/api/cart/add', 
                    { itemId, quantity }, 
                    { headers: { token } }
                );
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
        let cartData = structuredClone(cartItems);
    
        if (quantity <= 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
    
        setCartItems(cartData);
    
        if (token) {
            try {
                await axios.post(
                    backendUrl + '/api/cart/update', 
                    { itemId, quantity }, 
                    { headers: { token } }
                );
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