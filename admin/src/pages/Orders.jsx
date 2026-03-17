import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import {
  RefreshCw, Truck, CheckCircle2, ShoppingBag, Ban, 
  ChevronLeft, ChevronRight, Download, Eye, Clock, 
  MapPin, Package, CreditCard, PackageCheck,FileText,Search,X,Plus,Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

const ORDERS_PER_PAGE = 10;

const STATUS_CONFIG = {
  "Order Placed":    { color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500",   icon: ShoppingBag  },
  "On Hold":         { color: "bg-gray-100 text-gray-700",   dot: "bg-gray-400",   icon: Clock        },
  // "Money Received":  { color: "bg-cyan-100 text-cyan-700",   dot: "bg-cyan-500",   icon: CreditCard   },
  "Processing":         { color: "bg-amber-100 text-amber-700", dot: "bg-amber-400",  icon: PackageCheck },
  "Shipped":         { color: "bg-purple-100 text-purple-700", dot: "bg-purple-500", icon: Truck      },
  "Complete":        { color: "bg-orange-100 text-orange-700", dot: "bg-orange-400", icon: Truck      },
  // "Delivered":       { color: "bg-green-100 text-green-700", dot: "bg-green-500",  icon: CheckCircle2 },
  "Cancelled":       { color: "bg-red-100 text-red-700",     dot: "bg-red-500",    icon: Ban          },
};

const Orders = ({ token }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({});
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [tempShippingDate, setTempShippingDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [tempTracking, setTempTracking] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempCourier, setTempCourier] = useState("India Post");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newOrder, setNewOrder] = useState({
    items: [{ name: '', price: 0, quantity: 1 }],
    deliveryFee: 125,
    deliveryMethod: 'standard',
    paymentMethod: 'Direct bank transfer'
  });
  const [isNewUser, setIsNewUser] = useState(false);
const [newUserDetails, setNewUserDetails] = useState({
    firstName: '', lastName: '', street: '', city: '', state: '', zipCode: '', phone: ''
});


  const handleUserSearch = async (val) => {
    setUserSearchQuery(val);
    if (val.length > 2) {
      try {
        const res = await axios.get(`${backendUrl}/api/user/search?query=${val}`, { headers: { token } });
        if (res.data.success) setUserSearchResults(res.data.users);
      } catch (err) { console.error(err); }
    } else {
      setUserSearchResults([]);
    }
  };

  const handleAddItem = () => {
    setNewOrder(prev => ({ ...prev, items: [...prev.items, { name: '', price: 0, quantity: 1 }] }));
  };

  const handleRemoveItem = (index) => {
    if (newOrder.items.length > 1) {
      const updatedItems = newOrder.items.filter((_, i) => i !== index);
      setNewOrder(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index][field] = field === 'price' || field === 'quantity' ? Number(value) : value;
    setNewOrder(prev => ({ ...prev, items: updatedItems }));
  };

  const createManualOrder = async () => {
    // 1. Validation Logic
    if (!isNewUser && !selectedUser) {
        return toast.error("Please select an existing Collector or enable 'New Collector' mode.");
    }

    if (isNewUser && (!userSearchQuery || !newUserDetails.firstName)) {
        return toast.error("Email and First Name are required for new collectors.");
    }

    setLoading(true);
    try {
        // 2. Construct the correct payload
        const payload = {
            ...newOrder,
            email: isNewUser ? userSearchQuery : selectedUser.email,
            address: isNewUser ? newUserDetails : selectedUser.defaultAddress,
            isNewUser, // Backend uses this to trigger user creation
            name: isNewUser ? `${newUserDetails.firstName} ${newUserDetails.lastName}` : selectedUser.name
        };

        // 3. Send the request using the payload
        const res = await axios.post(`${backendUrl}/api/order/create-manual`, payload, { 
            headers: { token } 
        });

        if (res.data.success) {
            toast.success(`Order #${res.data.orderNo} Recorded Successfully`);
            
            // 4. Reset All States
            setShowCreateModal(false);
            setSelectedUser(null);
            setIsNewUser(false); // Reset toggle
            setUserSearchQuery("");
            setNewUserDetails({ firstName: '', lastName: '', street: '', city: '', state: '', zipCode: '', phone: '' });
            setNewOrder({ 
                items: [{ name: '', price: 0, quantity: 1 }], 
                deliveryFee: 125, 
                deliveryMethod: 'standard', 
                paymentMethod: 'Direct bank transfer' 
            });

            // Refresh the main registry list
            fetchAllOrders(true);
        } else {
            toast.error(res.data.message);
        }
    } catch (err) {
        console.error("Manual Order Error:", err);
        toast.error("Failed to record registry entry");
    } finally {
        setLoading(false);
    }
};

  // ── FETCH LOGIC ──────────────────────────────────────────────────────────
  // 1. UPDATED FETCH LOGIC
  const fetchAllOrders = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      
      const todayParam = filterStatus === "TODAY" 
        ? `&date=${new Date().toISOString().split('T')[0]}` 
        : "";
  
      // Logic to handle merged statuses
      let statusQuery = filterStatus;
      if (filterStatus === "TODAY") {
        statusQuery = "ALL";
      } else if (filterStatus === "Complete") {
        // Send both to backend
        statusQuery = "Complete,Delivered";
      }
  
      const searchQueryParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : "";
  
      const response = await axios.post(
        `${backendUrl}/api/order/list?page=${currentPage}&limit=${ORDERS_PER_PAGE}&status=${statusQuery}${todayParam}${searchQueryParam}&sort=${sortBy}`, 
        {}, 
        { headers: { token } }
      );
  
      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalOrdersCount(response.data.totalOrders);
        setGlobalStats(response.data.stats || {});
      }
    } catch (err) {
      toast.error("Registry Sync Failed");
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, filterStatus, sortBy, searchQuery]);

  // 2. CONSOLIDATED DEBOUNCE EFFECT
  // This effect handles the delay for searching so we don't spam the server.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        // If we are already on page 1, trigger fetch. 
        // If not, changing page to 1 will trigger the currentPage useEffect.
        if (currentPage === 1) {
            fetchAllOrders(false);
        } else {
            setCurrentPage(1);
        }
    }, 400); // 400ms is standard for search

    return () => clearTimeout(delayDebounceFn);
}, [searchQuery, filterStatus, sortBy]); // Trigger on any search/filter change

// --- PAGINATION LOGIC ---
useEffect(() => {
    fetchAllOrders(false);
}, [currentPage]); // Only trigger when the page actually changes
  const downloadShippingManifestcolumn = async () => {
    const toastId = toast.loading("Generating Shipping Manifest PDF...");
    try {
      
      const response = await axios.post(
        `${backendUrl}/api/order/list?limit=1000&status=${filterStatus}&sort=${sortBy}`, 
        {}, 
        { headers: { token } }
      );

      if (response.data.success) {
        const ordersData = response.data.orders;
        const doc = new jsPDF('l', 'mm', 'a4'); 

        // Header
        doc.setFontSize(18);
        doc.text("PhilaBasket Shipping Registry", 14, 15);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ["Order ID", "Customer Name", "Phone", "Shipping Address", "Status", "Amount"];
        const tableRows = [];

        ordersData.forEach(order => {
          const addr = order.address || {};
          
          // 1. Correctly format the name
          const customerName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || "Guest Collector";
          
          // 2. Resolve the Phone Number (Handles both standard strings and MongoDB $numberLong objects)
          const phoneValue = addr.phone?.$numberLong || addr.phone || "N/A";
          
          // 3. Handle the Address (Note: Check if your schema uses 'zipcode' or 'zipCode')
          const zip = addr.zipcode || addr.zipCode || '';
          const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''},${addr.country} - ${zip}`.trim();
          
          tableRows.push([
            order.orderNo || `#${order._id.slice(-6).toUpperCase()}`,
            customerName,
            phoneValue, // Use the resolved phone value here
            fullAddress || "Address Not Found",
            order.status,
            `INR ${order.amount}`
          ]);
        });

        // FIXED CALL: Use the imported autoTable function directly
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          theme: 'grid',
          styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
          headStyles: { fillColor: [188, 0, 45], textColor: [255, 255, 255] }, 
          columnStyles: {
            3: { cellWidth: 90 }, 
          }
        });

        doc.save(`Shipping_Manifest_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.update(toastId, { render: "Registry Exported Successfully", type: "success", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.update(toastId, { render: "Export Failed: See Console", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  // ── PDF EXPORT LOGIC (SHIPPING MANIFEST) ──────────────────────────────────
  // ── PDF EXPORT LOGIC (SHIPPING MANIFEST) ──────────────────────────────────
  const downloadShippingManifest = async () => {
    const toastId = toast.loading("Generating Archive Labels...");
    try {
        const response = await axios.post(
            `${backendUrl}/api/order/list?limit=1000&status=${filterStatus === "TODAY" ? "ALL" : filterStatus}`, 
            {}, 
            { headers: { token } }
        );

        if (response.data.success) {
            const ordersData = response.data.orders;
            const doc = new jsPDF('p', 'mm', 'a4');

            const labelWidth = 90;
            const startX = 12;
            const startY = 12;
            const marginX = 6;
            const marginY = 8;
            const labelsPerPage = 6;
            const padding = 6; // Increased padding for better border clearance
            const maxTextWidth = labelWidth - (padding * 2);

            ordersData.forEach((order, index) => {
                if (index > 0 && index % labelsPerPage === 0) doc.addPage();

                const pageIndex = index % labelsPerPage;
                const col = pageIndex % 2;
                const row = Math.floor(pageIndex / 2);

                const x = startX + (col * (labelWidth + marginX));
                const y = startY + (row * (marginY + 62)); // Adjusted grid spacing

                const addr = order.address || {};
                const name = `MR. ${(`${addr.firstName || ''} ${addr.lastName || ''}`).toUpperCase()}`;
                const phone = addr.phone?.$numberLong || addr.phone || "N/A";
                
                const addressLines = [
                    addr.street || '',
                    addr.street2 || '',
                    addr.city || '',
                    `${addr.state || ''}, ${addr.country || ''} - ${addr.zipcode || addr.zipCode || ''}`
                ].filter(line => line.trim() !== "");

                // --- CONTENT RENDERING ---
                
                // 1. Order ID & Header (Fixed position)
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                const orderText = `Order: #${order.orderNo || order._id.slice(-6).toUpperCase()}`;
                doc.text(orderText, x + labelWidth - doc.getTextWidth(orderText) - padding, y + 8);
                
                doc.setFont("helvetica", "normal");
                doc.text("To,", x + padding, y + 8);

                // 2. Recipient Name
                let nameFontSize = 8.5;
                doc.setFont("helvetica", "bold");
                while (doc.getTextWidth(name) > maxTextWidth && nameFontSize > 7) {
                    nameFontSize -= 0.5;
                    doc.setFontSize(nameFontSize);
                }
                doc.text(name, x + padding, y + 15);

                // --- THE GAP ---
                // currentY starts lower now to create the gap between name and address
                let currentY = y + 21; 

                // 3. Address Lines
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5); // Slightly smaller for professional registry look
                addressLines.forEach((line) => {
                    const wrappedLine = doc.splitTextToSize(line, maxTextWidth);
                    doc.text(wrappedLine, x + padding, currentY);
                    currentY += (wrappedLine.length * 4.6);
                });

                // 4. Mobile Number (Snapped with small gap)
                currentY += 2.5; 
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.text(`MOB: ${phone}`, x + padding, currentY);

                // --- DYNAMIC BORDER DRAWING ---
                // We add more padding at the bottom (8mm) to ensure it's not too tight
                const finalBoxHeight = (currentY - y) + 6; 
                
                doc.setDrawColor(180);
                doc.setLineWidth(0.1);
                doc.rect(x, y, labelWidth, finalBoxHeight);

                // Small Brand Mark inside the box
                doc.setFontSize(5);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(200);
                doc.text("PB REGISTRY", x + labelWidth - doc.getTextWidth("PB REGISTRY") - 2, y + finalBoxHeight - 2);
                doc.setTextColor(0);
            });

            doc.save(`Compact_Labels_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.update(toastId, { render: "Labels Adjusted", type: "success", isLoading: false, autoClose: 3000 });
        }
    } catch (error) {
        toast.update(toastId, { render: "Export Failed", type: "error", isLoading: false, autoClose: 3000 });
    }
};

  // ── EXPORT LOGIC ──────────────────────────────────────────────────────────
  // ── UPDATED EXPORT LOGIC ──────────────────────────────────────────────────
  const downloadRegistry = async () => {
    const toastId = toast.loading("Synthesizing Line-Item Registry...");
    try {
        // Reduced limit to 2000 for better stability and added specific timeout protection
        const response = await axios.post(
            `${backendUrl}/api/order/list?limit=2000&status=${filterStatus}&sort=${sortBy}`, 
            {}, 
            { headers: { token }, timeout: 30000 }
        );

        if (response.data?.success && response.data.orders?.length > 0) {
            const ordersData = response.data.orders;
            const reportData = [];

            ordersData.forEach((order) => {
                // Check if items exist before mapping
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach((item, index) => {
                        reportData.push({
                            "Order": order.orderNo || `#${order._id.slice(-6).toUpperCase()}`,
                            "First Name": order.address?.firstName || "N/A",
                            "Last Name": order.address?.lastName || "",
                            "Item #": index + 1,
                            "Item Name": item.name || "Unknown Item",
                            "Quantity": item.quantity || 0,
                            "Price": item.price || 0,
                            "Total": (item.price || 0) * (item.quantity || 0),
                            "Status": order.status,
                            "Date": new Date(order.date).toLocaleDateString('en-IN')
                        });
                    });
                }
            });

            const ws = XLSX.utils.json_to_sheet(reportData);
            
            // Set explicit column widths
            ws['!cols'] = [
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
                { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, 
                { wch: 15 }, { wch: 15 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Registry");
            XLSX.writeFile(wb, `PhilaBasket_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            toast.update(toastId, { render: "Registry Exported", type: "success", isLoading: false, autoClose: 3000 });
        } else {
            toast.update(toastId, { render: "No orders found to export", type: "info", isLoading: false, autoClose: 3000 });
        }
    } catch (error) {
        toast.update(toastId, { render: "Export Failed: Server Timeout", type: "error", isLoading: false, autoClose: 3000 });
    }
};

  const updateOrder = async (orderId, status, trackingNumber, shippedDate, courierProvider) => {
    setLoading(true);
    try {
        const res = await axios.post(
            backendUrl + '/api/order/status', 
            { 
                orderId, 
                status, 
                trackingNumber, 
                shippedDate, 
                courierProvider // This sends the 'tempCourier' value to the backend
            }, 
            { headers: { token } }
        );

        if (res.data.success) {
            toast.success(`Status updated to ${status}`);
            setShowTrackingModal(false);
            // This is the key: it refreshes the whole list from the DB
            fetchAllOrders(false); 
        } else {
            toast.error(res.data.message);
        }
    } catch (err) {
        console.error("Update Error:", err);
        toast.error("Network or Server Error");
    } finally {
        setLoading(false);
    }
};

  const totalPages = Math.ceil(totalOrdersCount / ORDERS_PER_PAGE);

  return (
    <div className='bg-[#F7F6F3] min-h-screen p-4 md:p-8' style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className='max-w-7xl mx-auto space-y-6'>

        {/* ── HEADER ── */}
        <div className='flex flex-wrap justify-between items-center gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-2 h-8 bg-[#BC002D] rounded-full' />
            <h1 className='text-2xl font-black text-gray-900'>Orders Registry</h1>
            <span className='bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full'>{totalOrdersCount}</span>
          </div>
          <div className='flex gap-2'>

          <button 
              onClick={() => setShowCreateModal(true)} 
              className='flex items-center gap-2 px-4 py-2.5 bg-[#BC002D] text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-[#BC002D]/20'
            >
              <Plus size={14} /> New Order Entry
            </button>

    {/* PDF Export Button */}
    <button 
      onClick={downloadShippingManifest} 
      className='flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:text-red-600 hover:shadow-md transition-all active:scale-95'
    >
      <FileText size={14} /> Shipping Label PDF
    </button>
    <button 
      onClick={downloadShippingManifestcolumn} 
      className='flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:text-red-600 hover:shadow-md transition-all active:scale-95'
    >
      <FileText size={14} /> Shipping List Pdf
    </button>
            <button onClick={downloadRegistry} className='flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:shadow-md transition-all active:scale-95'>
              <Download size={14} /> Export Excel
            </button>
            <button onClick={() => fetchAllOrders(true)} className='p-2.5 bg-white rounded-xl border hover:bg-gray-50 transition-all'>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3'>
          {[
            { label: "Total", val: totalOrdersCount, bg: "bg-white", color: "text-gray-900" },
            { label: "New", val: globalStats["Order Placed"] || 0, bg: "bg-blue-50", color: "text-blue-600" },
            { label: "Hold", val: globalStats["On Hold"] || 0, bg: "bg-gray-100", color: "text-gray-600" },
            // { label: "Paid", val: globalStats["Money Received"] || 0, bg: "bg-cyan-50", color: "text-cyan-600" },
            { label: "Shipped", val: (globalStats["Shipped"] || 0) + (globalStats["Out for delivery"] || 0), bg: "bg-purple-50", color: "text-purple-600" },
            { 
              label: "Done", 
              val: (globalStats["Delivered"] || 0) + (globalStats["Complete"] || 0), 
              bg: "bg-green-50", 
              color: "text-green-600" 
            },
            { label: "Cancel", val: globalStats["Cancelled"] || 0, bg: "bg-red-50", color: "text-red-600" },
            { label: "Revenue", val: `₹${((globalStats.revenue || 0) / 1000).toFixed(1)}k`, bg: "bg-white", color: "text-gray-900" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} p-4 rounded-2xl border border-white shadow-sm text-center`}>
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
              <p className='text-[9px] uppercase font-bold text-gray-400 mt-1'>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── CONTROLS ── */}
        <div className='bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap justify-between items-center gap-4 shadow-sm'>
        <div className='relative w-full md:w-96'>
        <Search size={14} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
        <input 
            type="text"
            placeholder="Search by Order # or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold outline-none focus:border-[#BC002D] transition-all"
        />
        {searchQuery && (
            <button 
                onClick={() => setSearchQuery("")}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900'
            >
                <X size={14} />
            </button>
        )}
    </div>
        <div className='flex flex-wrap gap-2'>
  {["ALL", "TODAY", "Order Placed","Complete", "On Hold", "Processing", "Shipped", "Delivered", "Cancelled"].map(s => (
    <button
      key={s}
      onClick={() => setFilterStatus(s)}
      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
        filterStatus === s 
          ? 'bg-[#BC002D] text-white' // Highlighting Today/Active in brand red
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {s === "TODAY" ? "📅 Today's Orders" : s}
    </button>
  ))}
</div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className='text-xs font-bold p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none cursor-pointer'
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="AMOUNT">Highest Amount</option>
          </select>
        </div>

        {/* ── TABLE ── */}
        <div className='space-y-3'>
  {loading ? (
    // Show spinner during every fetch to indicate search is working
    <div className='flex justify-center py-20'>
      <RefreshCw className='animate-spin text-[#BC002D]' size={40} />
    </div>
  ) : orders.length === 0 ? (
    <div className='bg-white rounded-3xl border border-gray-100 py-20 text-center shadow-sm'>
      {searchQuery ? (
        <>
          <Search size={48} className='text-gray-200 mx-auto mb-4' />
          <p className='text-sm font-bold text-gray-400 uppercase tracking-widest'>
            No specimens found for "{searchQuery}"
          </p>
          <button 
            onClick={() => setSearchQuery("")} 
            className="mt-4 text-[#BC002D] text-[10px] font-black uppercase tracking-widest border-b border-[#BC002D]"
          >
            Clear Search
          </button>
        </>
      ) : (
        <>
          <Package size={48} className='text-gray-200 mx-auto mb-4' />
          <p className='text-sm font-bold text-gray-400 uppercase tracking-widest'>Registry Empty</p>
        </>
      )}
    </div>
  ) : (
    orders.map((order) => {
      const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["Order Placed"];
      const Icon = cfg.icon;
      return (
        <div key={order._id} className='bg-white rounded-2xl border border-gray-100 hover:border-[#BC002D]/30 hover:shadow-md transition-all overflow-hidden'>
          {/* ... rest of your order row content ... */}
          <div className='grid grid-cols-1 md:grid-cols-[auto_1fr_1.2fr_auto] items-center gap-4 p-4'>
            <div className={`w-1.5 h-12 rounded-full ${cfg.dot} hidden md:block`} />
            
            {/* Clickable Area for Detail View */}
            <div className='min-w-0 cursor-pointer' onClick={() => navigate(`/orders/${order._id}`)}>
              <div className='flex items-center gap-2 mb-1'>
                <span className='text-[10px] font-mono font-bold text-[#BC002D] bg-red-50 px-2 py-0.5 rounded'>
                  {order.orderNo || `#${order._id.slice(-6).toUpperCase()}`}
                </span>
                <p className='font-bold text-gray-900 text-sm truncate'>
  {/* Prioritize the data joined by the new search pipeline */}
  {order.userDetails?.name || 
   order.userId?.name || 
   `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 
   "Guest Collector"}
</p>
              </div>
              <p className='text-[11px] text-gray-500 font-medium truncate max-w-[280px]'>
                {order.items.map(i => `${i.name} x${i.quantity}`).join(' • ')}
              </p>
            </div>

            

            {/* Address Column */}
            <div className='hidden lg:flex flex-col border-l border-gray-100 pl-6'>
              <div className='flex items-start gap-1.5'>
                <MapPin size={10} className='text-gray-400 mt-0.5' />
                <p className='text-[10px] text-gray-500 font-medium truncate max-w-[250px]'>
                  {order.address.street}, {order.address.city}
                </p>
              </div>
            </div>

            {/* Status and Actions */}
            <div className='flex items-center gap-4 ml-auto'>
              <div className='text-right'>
                <p className='text-xs font-black text-gray-900'>₹{order.amount}</p>
                <p className='text-[9px] text-gray-400 uppercase font-bold'>
                  {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <div className='w-32'>
                <span className={`w-full justify-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 ${cfg.color}`}>
                  <Icon size={10} /> {order.status}
                </span>
                {order.trackingNumber && (
      <div className='flex flex-col items-center animate-fade-in'>
        <div className='flex items-center gap-1 text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 uppercase tracking-tighter'>
          <Truck size={8} />
          {order.courierProvider }
        </div>
        <p className='text-[9px] font-mono font-bold text-gray-400 mt-0.5 tracking-tighter'>
          {order.trackingNumber}
        </p>
      </div>
    )}
              </div>
              
              {/* Status Update Select */}
              <select
  className='text-[10px] font-bold p-2 border border-gray-200 rounded-xl bg-gray-50 outline-none cursor-pointer'
  value={order.status}
  onChange={e => {
    if (e.target.value === "Shipped") {
      setActiveOrderId(order._id);
      // Pre-fill modal with existing data if available
      setTempTracking(order.trackingNumber || "");
      setTempCourier(order.courierProvider || "India Post"); 
      setTempShippingDate(new Date().toISOString().split('T')[0]); 
      setShowTrackingModal(true);
    } else {
      // FIX: Added the 5th argument (null) so the function signature matches.
      // This prevents the "Network Error" caused by an undefined variable.
      updateOrder(order._id, e.target.value, null, null, null);
    }
  }}
>
  {Object.keys(STATUS_CONFIG).map(s => (
    <option key={s} value={s}>{s}</option>
  ))}
</select>
                

              <button onClick={() => navigate(`/orders/${order._id}`, { state: { orderData: order } })} className='p-2.5 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl transition-all border border-gray-100'>
                <Eye size={14} />
              </button>
            </div>
          </div>
        </div>
      );
    })
  )}
</div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className='flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm'>
            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest'>Page {currentPage} of {totalPages}</p>
            <div className='flex gap-2'>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className='p-3 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-20 transition-all active:scale-95'>
                <ChevronLeft size={18} />
              </button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className='p-3 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-20 transition-all active:scale-95'>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>


      {showCreateModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4'>
          <div className='bg-white w-full max-w-2xl rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar'>
            <div className='flex justify-between items-center mb-8'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-red-50 text-[#BC002D] rounded-2xl flex items-center justify-center'><ShoppingBag size={20}/></div>
                <h2 className='text-lg font-black uppercase tracking-tight'>Manual Registry Entry</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className='p-2 hover:bg-gray-100 rounded-full transition-colors'><X size={20}/></button>
            </div>

            {/* Step 1: User Search */}
            <div className='relative mb-8'>
    {/* Header with Toggle */}
    <div className='flex justify-between items-center mb-3'>
        <label className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>1. Find or Create Collector</label>
        <button 
            onClick={() => { setIsNewUser(!isNewUser); setSelectedUser(null); }} 
            className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all border ${
                isNewUser ? 'bg-[#BC002D] text-white border-[#BC002D]' : 'bg-gray-100 text-gray-400 border-transparent hover:bg-gray-200'
            }`}
        >
            {isNewUser ? '✓ Adding New Collector' : '+ New Collector'}
        </button>
    </div>

    {!isNewUser ? (
        /* --- MODE A: SEARCH EXISTING --- */
        <div className='relative'>
            <Search size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
            <input 
                className='w-full border-2 border-gray-100 bg-gray-50/50 p-4 pl-12 rounded-2xl text-sm font-bold focus:border-[#BC002D] outline-none transition-all'
                placeholder='Search Name or Email...'
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
            />
            {userSearchResults.length > 0 && (
                <div className='absolute z-50 w-full bg-white border border-gray-100 rounded-2xl mt-2 shadow-xl overflow-hidden'>
                    {userSearchResults.map(user => (
                        <div 
                            key={user._id} 
                            onClick={() => { setSelectedUser(user); setUserSearchResults([]); setUserSearchQuery(user.name); }}
                            className='p-4 hover:bg-red-50 cursor-pointer border-b border-gray-50 last:border-0'
                        >
                            <p className='text-xs font-black text-gray-900'>{user.name}</p>
                            <p className='text-[10px] text-gray-400 font-bold'>{user.email}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    ) : (
        /* --- MODE B: CREATE NEW COLLECTOR --- */
        <div className='grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-300'>
            <input 
                className='border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-[#BC002D] outline-none' 
                placeholder='First Name' 
                value={newUserDetails.firstName}
                onChange={e => setNewUserDetails({...newUserDetails, firstName: e.target.value})} 
            />
            <input 
                className='border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-[#BC002D] outline-none' 
                placeholder='Last Name' 
                value={newUserDetails.lastName}
                onChange={e => setNewUserDetails({...newUserDetails, lastName: e.target.value})} 
            />
            <input 
                className='border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-[#BC002D] outline-none col-span-2' 
                placeholder='Email Address' 
                type="email"
                value={newUserDetails.email}
                onChange={e => setNewUserDetails({...newUserDetails, email: e.target.value})} 
            />
            <input 
                className='border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-[#BC002D] outline-none col-span-2' 
                placeholder='Street Address' 
                value={newUserDetails.street}
                onChange={e => setNewUserDetails({...newUserDetails, street: e.target.value})} 
            />
            <input 
                className='border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-[#BC002D] outline-none' 
                placeholder='City' 
                value={newUserDetails.city}
                onChange={e => setNewUserDetails({...newUserDetails, city: e.target.value})} 
            />
            <input 
                className='border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-[#BC002D] outline-none' 
                placeholder='Zip Code' 
                value={newUserDetails.zipCode}
                onChange={e => setNewUserDetails({...newUserDetails, zipCode: e.target.value})} 
            />
        </div>
    )}

    {/* Selected User Badge */}
    {selectedUser && !isNewUser && (
        <div className='mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between'>
            <div>
                <p className='text-[10px] font-black text-green-700 uppercase tracking-widest'>Collector Linked</p>
                <p className='text-xs font-bold text-green-900'>{selectedUser.name}</p>
            </div>
            <CheckCircle2 className='text-green-500' size={18} />
        </div>
    )}
</div>

            {/* Step 2: Specimens List */}
            <div className='space-y-4 mb-8'>
              <div className='flex justify-between items-center'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>2. Record Specimens</label>
                <button onClick={handleAddItem} className='text-[10px] font-black text-[#BC002D] uppercase flex items-center gap-1 hover:underline'><Plus size={12}/> Add Specimen</button>
              </div>
              
              <div className='space-y-3'>
                {newOrder.items.map((item, idx) => (
                  <div key={idx} className='flex gap-3 items-end animate-in slide-in-from-left duration-200'>
                    <div className='flex-1'>
                      <input 
                        className='w-full border-2 border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#BC002D]' 
                        placeholder='Item Name'
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className='w-24'>
                      <input 
                        className='w-full border-2 border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#BC002D]' 
                        placeholder='Price'
                        type='number'
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      />
                    </div>
                    <div className='w-16'>
                      <input 
                        className='w-full border-2 border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#BC002D]' 
                        placeholder='Qty'
                        type='number'
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <button onClick={() => handleRemoveItem(idx)} className='p-3 text-gray-300 hover:text-red-500 transition-colors'><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Logistics */}
            <div className='grid grid-cols-2 gap-4 mb-8'>
              <div>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block'>Delivery Fee (INR)</label>
                <input 
                  type='number'
                  className='w-full border-2 border-gray-100 p-3 rounded-xl text-xs font-bold'
                  value={newOrder.deliveryFee}
                  onChange={(e) => setNewOrder({...newOrder, deliveryFee: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block'>Total Valuation</label>
                <div className='bg-gray-900 text-white p-3 rounded-xl text-xs font-black flex items-center justify-center'>
                  INR {newOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) + newOrder.deliveryFee}
                </div>
              </div>
            </div>

            <button 
              onClick={createManualOrder}
              disabled={loading}
              className='w-full py-4 bg-gray-900 text-white rounded-[20px] font-black uppercase tracking-[0.2em] text-xs hover:bg-[#BC002D] transition-all flex items-center justify-center gap-2'
            >
              {loading ? <RefreshCw className='animate-spin' size={14}/> : <PackageCheck size={16}/>}
              Create Registry Order
            </button>
          </div>
        </div>
      )}


      {/* ── TRACKING MODAL ── */}
      {showTrackingModal && (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4'>
        <div className='bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200'>
            <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 bg-purple-50 text-purple-600 rounded-lg'><Truck size={20}/></div>
                <h4 className='font-black uppercase text-sm tracking-tight'>Dispatch Registry</h4>
            </div>

            <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block'>Courier Provider</label>
            <div className='flex gap-2 mb-4'>
                {['India Post', 'DTDC'].map(provider => (
                    <button
                        key={provider}
                        onClick={() => setTempCourier(provider)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border-2 transition-all ${
                            tempCourier === provider 
                            ? 'border-[#BC002D] bg-red-50 text-[#BC002D]' 
                            : 'border-gray-100 text-gray-400'
                        }`}
                    >
                        {provider}
                    </button>
                ))}
            </div>

            {/* Tracking ID Input */}
            <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block'>Consignment ID</label>
            <input 
                autoFocus
                className='w-full border-2 border-gray-100 focus:border-[#BC002D] p-3 rounded-xl mb-4 uppercase font-mono text-sm outline-none transition-all' 
                placeholder="AWB / TRACKING #"
                value={tempTracking}
                onChange={e => setTempTracking(e.target.value)}
            />

            {/* Shipping Date Input */}
            <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block'>Dispatch Date</label>
            <input 
                type="date"
                className='w-full border-2 border-gray-100 focus:border-[#BC002D] p-3 rounded-xl mb-6 font-sans text-sm outline-none transition-all' 
                value={tempShippingDate}
                onChange={e => setTempShippingDate(e.target.value)}
            />

            <div className='flex gap-2'>
                <button 
                    onClick={() => updateOrder(activeOrderId, "Shipped", tempTracking, tempShippingDate,tempCourier)} 
                    className='flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#BC002D] transition-colors'
                >
                    Confirm
                </button>
                <button 
                    onClick={() => setShowTrackingModal(false)} 
                    className='flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200'
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)}
    </div>
  );
};

export default Orders;