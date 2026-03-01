import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx'
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import {
  Bell, RefreshCw, X, Truck, AlertCircle, CheckCircle2,
  PackageCheck, ShoppingBag, Ban, ChevronLeft, ChevronRight,
  Download, Eye, Copy, Clock, MapPin, Phone, Mail,
  CreditCard, Package, Star, Users, TrendingUp, Filter
} from 'lucide-react';

const ORDERS_PER_PAGE = 10;

const STATUS_CONFIG = {
  "Order Placed":    { color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500",   icon: ShoppingBag  },
  "On Hold":         { color: "bg-gray-100 text-gray-700",   dot: "bg-gray-400",   icon: Clock        }, // New: For Cheque/Bank initial state
  "Money Received":  { color: "bg-cyan-100 text-cyan-700",   dot: "bg-cyan-500",   icon: CreditCard   }, // New: Clearance status
  "Packing":         { color: "bg-amber-100 text-amber-700", dot: "bg-amber-400",  icon: Package      },
  "Shipped":         { color: "bg-purple-100 text-purple-700", dot: "bg-purple-500", icon: Truck      },
  "Out for delivery":{ color: "bg-orange-100 text-orange-700", dot: "bg-orange-400", icon: Truck      },
  "Delivered":       { color: "bg-green-100 text-green-700", dot: "bg-green-500",  icon: CheckCircle2 },
  "Cancelled":       { color: "bg-red-100 text-red-700",     dot: "bg-red-500",    icon: Ban          },
};

const Orders = ({ token }) => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [sortBy, setSortBy]         = useState("DATE_DESC");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showAddressModal, setShowAddressModal]   = useState(false);
  const [activeOrder, setActiveOrder]   = useState(null);
  const [tempTracking, setTempTracking] = useState("");
  const prevOrdersRef = useRef([]);
  const notifIdRef    = useRef(0);

  // ── helpers ──────────────────────────────────────────────────────────────
  const addNotif = (notif) => {
    const id = ++notifIdRef.current;
    setNotifications(prev => [{ ...notif, id, time: new Date() }, ...prev].slice(0, 50));
    // auto-dismiss toast style
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 8000);
  };

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchAllOrders = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
      if (response.data.success) {
        const incoming = response.data.orders;

        if (prevOrdersRef.current.length > 0) {
          // detect new orders
          incoming.forEach(newOrd => {
            const old = prevOrdersRef.current.find(o => o._id === newOrd._id);
            if (!old) {
              addNotif({ type: "NEW", status: "Order Placed",
                message: `New order from ${newOrd.address.firstName} ${newOrd.address.lastName}`,
                sub: `₹${newOrd.amount.toFixed(2)} • ${newOrd.items.length} item(s)`,
                orderId: newOrd._id });
            } else if (old.status !== newOrd.status) {
              addNotif({ type: "UPDATE", status: newOrd.status,
                message: `Order #${String(newOrd._id).slice(-6)} → ${newOrd.status}`,
                sub: `${newOrd.address.firstName} ${newOrd.address.lastName}`,
                orderId: newOrd._id });
            }
          });
          // detect cancellations
          incoming.filter(o => o.status === "Cancelled")
            .forEach(o => {
              const old = prevOrdersRef.current.find(p => p._id === o._id);
              if (old && old.status !== "Cancelled") {
                addNotif({ type: "CANCEL", status: "Cancelled",
                  message: `Order #${String(o._id).slice(-6)} was cancelled`,
                  sub: `${o.address.firstName} ${o.address.lastName}`,
                  orderId: o._id });
              }
            });
        }

        setOrders(incoming);
        prevOrdersRef.current = incoming;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllOrders(true);
      const interval = setInterval(() => fetchAllOrders(false), 15000);
      return () => clearInterval(interval);
    }
  }, [token, fetchAllOrders]);

  // ── sort + filter + paginate ──────────────────────────────────────────────
  const processed = useMemo(() => {
    const priority = { 
      "Order Placed": 1, 
      "On Hold": 2, 
      "Money Received": 3, 
      "Packing": 4, 
      "Shipped": 5, 
      "Out for delivery": 6, 
      "Delivered": 7, 
      "Cancelled": 8 
    };
    let list = Array.isArray(orders) ? [...orders] : [];
    if (filterStatus !== "ALL") list = list.filter(o => o.status === filterStatus);
    if (sortBy === "DATE_DESC")      list.sort((a,b) => new Date(b.date)-new Date(a.date));
    else if (sortBy === "DATE_ASC")  list.sort((a,b) => new Date(a.date)-new Date(b.date));
    else if (sortBy === "AMOUNT")    list.sort((a,b) => b.amount - a.amount);
    else if (sortBy === "STATUS_PRIORITY") list.sort((a,b) => (priority[a.status]||99)-(priority[b.status]||99));
    return list;
  }, [orders, sortBy, filterStatus]);

  const totalPages    = Math.max(1, Math.ceil(processed.length / ORDERS_PER_PAGE));
  const paginated     = processed.slice((currentPage-1)*ORDERS_PER_PAGE, currentPage*ORDERS_PER_PAGE);
  const unreadCount   = notifications.length;

  // reset to page 1 on filter/sort change
  useEffect(() => setCurrentPage(1), [sortBy, filterStatus]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     orders.length,
    new:       orders.filter(o => o.status === "Order Placed").length,
    onHold:    orders.filter(o => o.status === "On Hold").length, // Tracking Cheque/Bank pending
    received:  orders.filter(o => o.status === "Money Received").length, // Tracking Payment Cleared
    packing:   orders.filter(o => o.status === "Packing").length,
    shipped:   orders.filter(o => o.status === "Shipped" || o.status === "Out for delivery").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    cancelled: orders.filter(o => o.status === "Cancelled").length,
    revenue:   orders.filter(o => o.status !== "Cancelled").reduce((s,o) => s+o.amount, 0),
  }), [orders]);

  // ── CSV ───────────────────────────────────────────────────────────────────
  const downloadCSV = (data, filename) => {
    if (!data || !data.length) { 
        toast.error("Registry Archive Empty for this filter"); 
        return; 
    }

    // 1. Prepare and Format the Data for Excel
    const worksheetData = data.map(o => ({
        "Order ID": `#${String(o._id).slice(-8)}`,
        "Date": new Date(o.date).toLocaleDateString('en-IN'),
        "Customer": `${o.address?.firstName || ''} ${o.address?.lastName || ''}`.trim(),
        "Email": o.address?.email || 'N/A',
        "Phone": String(o.address?.phone || ''), // Force string to keep leading zeros
        "Items": o.items.map(i => `${i.name} (x${i.quantity})`).join(' | '),
        "Amount (INR)": o.amount,
        "Status": o.status,
        "Payment": o.paymentMethod || 'N/A',
        "Tracking": o.trackingNumber || 'N/A',
        "City": o.address?.city || '',
        "State": o.address?.state || ''
    }));

    // 2. Create Workbook and Worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Registry");

    // 3. Set Column Widths for better readability
    const wscols = [
        { wch: 15 }, // Order ID
        { wch: 12 }, // Date
        { wch: 20 }, // Customer
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 40 }, // Items
        { wch: 12 }, // Amount
        { wch: 15 }, // Status
        { wch: 15 }, // Payment
        { wch: 20 }, // Tracking
        { wch: 15 }, // City
        { wch: 15 }, // State
    ];
    worksheet['!cols'] = wscols;

    // 4. Generate and Trigger Download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Excel Registry Exported Successfully");
};

  // ── update ────────────────────────────────────────────────────────────────
  const updateOrder = async (orderId, status, trackingNumber) => {
    if (status !== "Shipped" && !window.confirm(`Change status to "${status}"?`)) {
      fetchAllOrders(true); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(backendUrl+'/api/order/status',
        { orderId, status, trackingNumber }, { headers: { token } });
      if (res.data.success) {
        toast.success(`Status → ${status}`);
        setShowTrackingModal(false);
        fetchAllOrders(true);
      }
    } catch { toast.error("Update Failed"); }
    finally { setLoading(false); }
  };

  const copyAddress = (addr) => {
    const t = `${addr.firstName} ${addr.lastName}\n${addr.phone}\n${addr.street}\n${addr.city}, ${addr.state} ${addr.zipcode}`;
    navigator.clipboard.writeText(t);
    toast.success("Address copied");
  };

  // ── loading screen ────────────────────────────────────────────────────────
  if (loading && orders.length === 0) return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4'>
      <RefreshCw className='animate-spin text-[#BC002D]' size={40}/>
      <p className='text-xs font-black uppercase tracking-widest text-gray-400'>Loading Orders...</p>
    </div>
  );

  const notifColor = { NEW:"bg-blue-500", UPDATE:"bg-amber-500", CANCEL:"bg-red-500" };
  const notifIcon  = { NEW: ShoppingBag, UPDATE: PackageCheck, CANCEL: Ban };

  return (
    <div className='bg-[#F7F6F3] min-h-screen' style={{fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ── NOTIFICATION TOASTS ───────────────────────────────────────── */}
      <div className='fixed top-5 right-5 z-[400] flex flex-col gap-2 max-w-xs w-full pointer-events-none'>
        {notifications.slice(0,3).map(n => {
          const Icon = notifIcon[n.type] || Bell;
          return (
            <div key={n.id} className='bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex gap-3 items-start pointer-events-auto animate-in slide-in-from-right duration-300'>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${notifColor[n.type]}`}>
                <Icon size={14}/>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-bold leading-snug'>{n.message}</p>
                <p className='text-[10px] text-gray-400 mt-0.5'>{n.sub}</p>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className='text-gray-500 hover:text-white'>
                <X size={14}/>
              </button>
            </div>
          );
        })}
      </div>

      <div className='max-w-7xl mx-auto px-5 py-8 space-y-6'>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <div className='w-2 h-8 bg-[#BC002D] rounded-full'/>
              <h1 className='text-2xl font-black text-gray-900 tracking-tight'>Orders</h1>
              <span className='bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-full'>{orders.length}</span>
            </div>
            <p className='text-xs text-gray-400 font-medium ml-5 mt-0.5'>Live order management & dispatch</p>
          </div>

          <div className='flex items-center gap-3'>
            {/* Notification Bell */}
            <div className='relative'>
              <button onClick={() => setShowNotifPanel(!showNotifPanel)}
                className='relative w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:border-gray-400 transition-all shadow-sm'>
                <Bell size={16} className='text-gray-600'/>
                {unreadCount > 0 && (
                  <span className='absolute -top-1 -right-1 w-4 h-4 bg-[#BC002D] text-white text-[9px] font-black rounded-full flex items-center justify-center'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {showNotifPanel && (
                <div className='absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] overflow-hidden'>
                  <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
                    <p className='text-xs font-black uppercase tracking-wider text-gray-700'>Notifications</p>
                    <button onClick={() => setNotifications([])} className='text-[10px] font-bold text-gray-400 hover:text-red-500'>Clear all</button>
                  </div>
                  <div className='max-h-80 overflow-y-auto divide-y divide-gray-50'>
                    {notifications.length === 0 ? (
                      <div className='py-8 text-center text-xs text-gray-300 font-bold uppercase'>No notifications</div>
                    ) : notifications.map(n => {
                      const Icon = notifIcon[n.type] || Bell;
                      return (
                        <div key={n.id} className='flex gap-3 px-4 py-3 hover:bg-gray-50 transition-all'>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${notifColor[n.type]}`}>
                            <Icon size={12} className='text-white'/>
                          </div>
                          <div>
                            <p className='text-xs font-bold text-gray-800'>{n.message}</p>
                            <p className='text-[10px] text-gray-400'>{n.sub}</p>
                            <p className='text-[9px] text-gray-300 mt-0.5'>{n.time?.toLocaleTimeString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => fetchAllOrders(true)}
              className='flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-[#BC002D] transition-colors shadow-sm'>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
            </button>
          </div>
        </div>

        {/* ── STATS ROW ────────────────────────────────────────────────── */}
        <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3'> {/* Adjusted grid cols */}
  {[
    { label:"Total",     value: stats.total,     color:"text-gray-900",  bg:"bg-white" },
    { label:"New",       value: stats.new,       color:"text-blue-600",  bg:"bg-blue-50" },
    { label:"On Hold",   value: stats.onHold,    color:"text-gray-600",  bg:"bg-gray-100" }, // Added
    { label:"Paid",      value: stats.received,  color:"text-cyan-600",  bg:"bg-cyan-50" },  // Added
    { label:"Packing",   value: stats.packing,   color:"text-amber-600", bg:"bg-amber-50" },
    { label:"In Transit",value: stats.shipped,   color:"text-purple-600",bg:"bg-purple-50" },
    { label:"Delivered", value: stats.delivered, color:"text-green-600", bg:"bg-green-50" },
    { label:"Cancelled", value: stats.cancelled, color:"text-red-600",   bg:"bg-red-50" },
    { label:"Revenue",   value: `₹${(stats.revenue/1000).toFixed(1)}k`, color:"text-gray-900", bg:"bg-white" },
  ].map(s => (
    <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white shadow-sm text-center`}>
      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
      <p className='text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5'>{s.label}</p>
    </div>
  ))}
</div>

        {/* ── CONTROLS ─────────────────────────────────────────────────── */}
        <div className='bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center gap-3 shadow-sm'>
    {/* Corrected Filter Tabs Section */}
    <div className='flex flex-wrap gap-1.5'>
        {["ALL", "Order Placed", "On Hold", "Money Received", "Packing", "Shipped", "Out for delivery", "Delivered", "Cancelled"].map(s => (
            <button 
                key={s} 
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                ${filterStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
                {s === "ALL" ? "All" : s}
                {/* Re-adding the dynamic count helper */}
                {s !== "ALL" && (
                    <span className='ml-1 opacity-60'>{orders.filter(o => o.status === s).length}</span>
                )}
            </button>
        ))}
    </div>

    {/* Dropdown should NOT be here - it belongs inside the table map() only */}

    <div className='flex items-center gap-3 ml-auto'>
        <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className='bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none cursor-pointer'
        >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="STATUS_PRIORITY">Workflow Priority</option>
            <option value="AMOUNT">Highest Amount</option>
        </select>

        <div className='flex gap-1.5'>
            <button 
                onClick={() => downloadCSV(orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()), "Today")}
                className='flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-bold hover:bg-amber-100 transition-all'
            >
                <Download size={12}/> Today
            </button>
            <button 
                onClick={() => downloadCSV(processed, "Filtered")}
                className='flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-all'
            >
                <Download size={12}/> Export
            </button>
        </div>
    </div>
</div>

        {/* ── ORDERS TABLE ─────────────────────────────────────────────── */}
        <div className='space-y-2'>
          {paginated.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-200 py-16 text-center'>
              <Package size={40} className='text-gray-200 mx-auto mb-3'/>
              <p className='text-sm font-bold text-gray-400'>No orders match this filter</p>
            </div>
          ) : paginated.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["Order Placed"];
            const Icon = cfg.icon;
            return (
              <div key={order._id}
                className='bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden'>
                <div className='grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-0 items-center'>

                  {/* Status stripe */}
                  <div className={`w-1.5 self-stretch ${cfg.dot} hidden md:block`}/>

                  {/* Customer + Items */}
                  <div className='p-5 cursor-pointer' onClick={() => { setActiveOrder(order); setShowAddressModal(true); }}>
                    <div className='flex items-start gap-3'>
                      <div className='w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                        <span className='text-xs font-black text-gray-500'>{order.address.firstName?.[0]}{order.address.lastName?.[0]}</span>
                      </div>
                      <div>
                        <p className='text-sm font-bold text-gray-900'>{order.address.firstName} {order.address.lastName}</p>
                        <p className='text-[10px] text-gray-400 font-medium'>{order.address.city}, {order.address.state}</p>
                        <p className='text-[10px] text-gray-500 mt-1 font-medium line-clamp-1'>
                          {order.items.map(i=>`${i.name} ×${i.quantity}`).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className='px-4 py-3 text-center border-l border-gray-100 hidden md:block'>
                    <p className='text-sm font-black text-gray-900'>₹{order.amount.toFixed(0)}</p>
                    <p className='text-[9px] text-gray-400 font-bold uppercase'>{order.items.reduce((a,i)=>a+i.quantity,0)} units</p>
                  </div>

                  {/* Date */}
                  <div className='px-4 py-3 text-center border-l border-gray-100 hidden md:block'>
                    <p className='text-[11px] font-bold text-gray-700'>{new Date(order.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</p>
                    <p className='text-[9px] text-gray-400 font-medium'>{new Date(order.date).getFullYear()}</p>
                  </div>

                  {/* Payment */}
                  <div className='px-4 py-3 text-center border-l border-gray-100 hidden lg:block'>
                    <span className='text-[9px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded-lg'>{order.paymentMethod || 'N/A'}</span>
                  </div>

                  {/* Tracking */}
                  <div className='px-4 py-3 text-center border-l border-gray-100 hidden lg:block'>
                    {order.trackingNumber ? (
                      <span className='text-[9px] font-mono font-bold text-purple-600 flex items-center justify-center gap-1'>
                        <Truck size={10}/> {order.trackingNumber}
                      </span>
                    ) : (
                      <span className='text-[9px] text-gray-300 font-bold uppercase'>No tracking</span>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div className='px-4 py-3 border-l border-gray-100 flex items-center gap-3'>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>
                      <Icon size={10}/> {order.status}
                    </span>

                    <select
                      value={order.status}
                      onChange={e => {
                        if (e.target.value === "Shipped") {
                          setActiveOrder(order); setTempTracking(order.trackingNumber||""); setShowTrackingModal(true);
                        } else { updateOrder(order._id, e.target.value, order.trackingNumber); }
                      }}
                      className='text-[10px] font-bold border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none cursor-pointer'
                    >
                      {["On Hold","Money Received","Order Placed","Packing","Shipped","Out for delivery","Delivered","Cancelled"].map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>

                    <button onClick={() => { setActiveOrder(order); setShowAddressModal(true); }}
                      className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0'>
                      <Eye size={14} className='text-gray-500'/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PAGINATION ───────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm'>
            <p className='text-xs text-gray-400 font-medium'>
              Showing <span className='font-bold text-gray-700'>{(currentPage-1)*ORDERS_PER_PAGE+1}–{Math.min(currentPage*ORDERS_PER_PAGE, processed.length)}</span> of <span className='font-bold text-gray-700'>{processed.length}</span> orders
            </p>
            <div className='flex items-center gap-2'>
              <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
                className='w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all'>
                <ChevronLeft size={16} className='text-gray-600'/>
              </button>

              {Array.from({length: totalPages}, (_,i) => i+1)
                .filter(p => p===1 || p===totalPages || Math.abs(p-currentPage)<=1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx-1] !== p-1) acc.push('...');
                  acc.push(p); return acc;
                }, [])
                .map((p,i) => p === '...' ? (
                  <span key={`dot-${i}`} className='w-9 text-center text-gray-400 text-xs font-bold'>…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${currentPage===p ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))
              }

              <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                className='w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all'>
                <ChevronRight size={16} className='text-gray-600'/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ORDER DETAIL MODAL ─────────────────────────────────────────── */}
      {showAddressModal && activeOrder && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4'>
          <div className='bg-white w-full max-w-3xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden'>

            {/* Header */}
            <div className='flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0'>
              <div>
                <p className='text-[10px] font-black text-[#BC002D] uppercase tracking-widest mb-0.5'>Order Detail</p>
                <h3 className='text-lg font-black text-gray-900'>{activeOrder.address.firstName} {activeOrder.address.lastName}</h3>
                <p className='text-xs text-gray-400 font-mono'>#{String(activeOrder._id).slice(-10).toUpperCase()}</p>
              </div>
              <div className='flex items-center gap-3'>
                {(() => { const cfg = STATUS_CONFIG[activeOrder.status]; const Icon = cfg.icon;
                  return <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${cfg.color}`}><Icon size={12}/>{activeOrder.status}</span>; })()}
                <button onClick={() => setShowAddressModal(false)} className='w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all'>
                  <X size={16}/>
                </button>
              </div>
            </div>

            <div className='overflow-y-auto p-7 space-y-6'>
              {/* Items */}
              <div>
                <p className='text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3'>Items Ordered</p>
                <div className='space-y-2'>
                  {activeOrder.items.map((item,i) => (
                    <div key={i} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden'>
                          <img src={item.image?.[0]||assets.logo} className='max-w-full max-h-full object-contain' alt={item.name}/>
                        </div>
                        <div>
                          <p className='text-xs font-bold text-gray-800'>{item.name}</p>
                          <p className='text-[10px] text-gray-400'>{item.category?.[0]||'Product'}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-black text-gray-900'>×{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Grid */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[
                  { icon: CreditCard, label:"Amount",   value:`₹${activeOrder.amount.toFixed(2)}` },
                  { icon: CreditCard, label:"Payment",  value: activeOrder.paymentMethod || 'N/A' },
                  { icon: Clock,      label:"Date",     value: new Date(activeOrder.date).toLocaleDateString('en-IN') },
                  { icon: Truck,      label:"Tracking", value: activeOrder.trackingNumber || 'Pending' },
                ].map(({icon:Icon,label,value}) => (
                  <div key={label} className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
                    <div className='flex items-center gap-1.5 mb-1'>
                      <Icon size={11} className='text-gray-400'/>
                      <p className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>{label}</p>
                    </div>
                    <p className='text-sm font-bold text-gray-900 font-mono'>{value}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className='bg-gray-50 rounded-2xl p-5 border border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-2'>
                    <MapPin size={14} className='text-[#BC002D]'/>
                    <p className='text-[10px] font-black uppercase tracking-widest text-gray-600'>Delivery Address</p>
                  </div>
                  <button onClick={() => copyAddress(activeOrder.address)}
                    className='flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all bg-white px-3 py-1.5 rounded-lg border border-gray-200'>
                    <Copy size={11}/> Copy
                  </button>
                </div>
                <div className='grid md:grid-cols-2 gap-4 text-sm'>
                  <div className='space-y-2'>
                    <p className='font-bold text-gray-800'>{activeOrder.address.firstName} {activeOrder.address.lastName}</p>
                    <p className='text-gray-600 font-medium'>{activeOrder.address.street}</p>
                    <p className='text-gray-600'>{activeOrder.address.city}, {activeOrder.address.state} – <span className='font-bold text-[#BC002D]'>{activeOrder.address.zipcode}</span></p>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-gray-600'>
                      <Phone size={12}/> <span className='font-medium'>{activeOrder.address.phone}</span>
                    </div>
                    {(activeOrder.userId?.email || activeOrder.address.email) && (
                      <div className='flex items-center gap-2 text-gray-600'>
                        <Mail size={12}/> <span className='font-medium text-xs'>{activeOrder.userId?.email || activeOrder.address.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Profile */}
              {activeOrder.userId && (
                <div className='grid grid-cols-3 gap-3'>
                  {[
                    { icon: Star,  label:"Reward Points", value: activeOrder.userId.totalRewardPoints||0, color:"text-amber-600 bg-amber-50" },
                    { icon: Users, label:"Referrals",     value: `${activeOrder.userId.referralCount||0}/3`, color:"text-blue-600 bg-blue-50" },
                    { icon: TrendingUp, label:"Member ID", value: String(activeOrder.userId._id).slice(-6).toUpperCase(), color:"text-gray-600 bg-gray-50" },
                  ].map(({icon:Icon,label,value,color}) => (
                    <div key={label} className={`${color} rounded-xl p-4 border border-white`}>
                      <Icon size={14} className='mb-2 opacity-70'/>
                      <p className='text-base font-black'>{value}</p>
                      <p className='text-[9px] font-bold uppercase opacity-60 mt-0.5'>{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TRACKING MODAL ────────────────────────────────────────────── */}
      {showTrackingModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4'>
          <div className='bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden'>
            <div className='px-7 py-5 border-b border-gray-100'>
              <div className='flex items-center gap-2.5'>
                <div className='w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center'>
                  <Truck size={16} className='text-purple-600'/>
                </div>
                <div>
                  <h4 className='text-sm font-black text-gray-900'>Enter Tracking Number</h4>
                  <p className='text-[10px] text-gray-400 font-medium'>India Post consignment ID</p>
                </div>
              </div>
            </div>
            <div className='p-7 space-y-4'>
              <input autoFocus
                placeholder="e.g. EX123456789IN"
                className='w-full border-2 border-gray-200 focus:border-gray-900 p-4 rounded-2xl font-mono text-sm uppercase outline-none transition-all tracking-widest'
                value={tempTracking}
                onChange={e => setTempTracking(e.target.value.toUpperCase())}
              />
              <div className='flex gap-2'>
                <button disabled={loading} onClick={() => updateOrder(activeOrder._id, "Shipped", tempTracking)}
                  className='flex-1 bg-gray-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase hover:bg-[#BC002D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2'>
                  {loading ? <RefreshCw size={14} className='animate-spin'/> : <PackageCheck size={14}/>}
                  {loading ? "Saving..." : "Mark Shipped"}
                </button>
                <button onClick={() => setShowTrackingModal(false)}
                  className='flex-1 bg-gray-100 text-gray-500 py-3.5 rounded-2xl font-black text-xs uppercase hover:bg-gray-200 transition-colors'>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;