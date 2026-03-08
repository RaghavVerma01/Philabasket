import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import {
  RefreshCw, Truck, CheckCircle2, ShoppingBag, Ban, 
  ChevronLeft, ChevronRight, Download, Eye, Clock, 
  MapPin, Package, CreditCard, PackageCheck,FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

const ORDERS_PER_PAGE = 10;

const STATUS_CONFIG = {
  "Order Placed":    { color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500",   icon: ShoppingBag  },
  "On Hold":         { color: "bg-gray-100 text-gray-700",   dot: "bg-gray-400",   icon: Clock        },
  "Money Received":  { color: "bg-cyan-100 text-cyan-700",   dot: "bg-cyan-500",   icon: CreditCard   },
  "Packing":         { color: "bg-amber-100 text-amber-700", dot: "bg-amber-400",  icon: PackageCheck },
  "Shipped":         { color: "bg-purple-100 text-purple-700", dot: "bg-purple-500", icon: Truck      },
  "Out for delivery":{ color: "bg-orange-100 text-orange-700", dot: "bg-orange-400", icon: Truck      },
  "Delivered":       { color: "bg-green-100 text-green-700", dot: "bg-green-500",  icon: CheckCircle2 },
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
  
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [tempTracking, setTempTracking] = useState("");

  // ── FETCH LOGIC ──────────────────────────────────────────────────────────
  const fetchAllOrders = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const todayParam = filterStatus === "TODAY" 
      ? `&date=${new Date().toISOString().split('T')[0]}` 
      : "";

      const statusQuery = filterStatus === "TODAY" ? "ALL" : filterStatus;

      const response = await axios.post(
      `${backendUrl}/api/order/list?page=${currentPage}&limit=${ORDERS_PER_PAGE}&status=${statusQuery}${todayParam}&sort=${sortBy}`, 
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
  }, [token, currentPage, filterStatus, sortBy]);

  useEffect(() => {
    fetchAllOrders(currentPage === 1);
  }, [fetchAllOrders]);

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, sortBy]);

  // ── PDF EXPORT LOGIC (SHIPPING MANIFEST) ──────────────────────────────────
  // ── PDF EXPORT LOGIC (SHIPPING MANIFEST) ──────────────────────────────────
  const downloadShippingManifest = async () => {
    const toastId = toast.loading("Generating Archive Labels...");
    try {
      const todayParam = filterStatus === "TODAY" 
            ? `&date=${new Date().toISOString().split('T')[0]}` 
            : "";
        
        const statusQuery = filterStatus === "TODAY" ? "ALL" : filterStatus;

        // 2. UPDATE URL: Include the todayParam in the request
        const response = await axios.post(
            `${backendUrl}/api/order/list?limit=1000&status=${statusQuery}${todayParam}&sort=${sortBy}`, 
            {}, 
            { headers: { token } }
        );
        

        if (response.data.success) {
            const ordersData = response.data.orders;
            const doc = new jsPDF('l', 'mm', 'a4');

            // Grid Configuration
            const labelWidth = 65;
            const labelHeight = 45;
            const startX = 15;
            const startY = 15;
            const marginX = 5;
            const marginY = 5;
            const labelsPerRow = 4;
            const labelsPerPage = 8;
            const padding = 4; // Inner padding for the text

            ordersData.forEach((order, index) => {
                if (index > 0 && index % labelsPerPage === 0) {
                    doc.addPage();
                }

                const pageIndex = index % labelsPerPage;
                const col = pageIndex % labelsPerRow;
                const row = Math.floor(pageIndex / labelsPerRow);

                const x = startX + (col * (labelWidth + marginX));
                const y = startY + (row * (labelHeight + marginY));

                // Draw Label Border
                doc.setDrawColor(220);
                doc.rect(x, y, labelWidth, labelHeight);

                const addr = order.address || {};
                const name = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
                const phone = addr.phone?.$numberLong || addr.phone || "N/A";
                
                // --- TEXT WRAPPING LOGIC ---
                const zip = addr.zipcode || addr.zipCode || '';
                const rawAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${zip}`;
                
                doc.setFontSize(8);
                // splitTextToSize breaks the string so it doesn't exceed labelWidth minus padding
                const wrappedAddress = doc.splitTextToSize(rawAddress, labelWidth - (padding * 2));

                // 1. Order Number
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`Od No - ${order.orderNo || order._id.slice(-6).toUpperCase()}`, x + padding, y + 7);

                // 2. "To,"
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text("To,", x + padding, y + 13);

                // 3. Name
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`Mr. ${name}`, x + padding, y + 18);

                // 4. Wrapped Address
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                // Render the array of lines starting at y + 23
                doc.text(wrappedAddress, x + padding, y + 23);

                // 5. Mobile (Positioned relative to the end of the address to avoid overlap)
                // Determine how many lines the address took to offset the phone number
                const addressHeight = wrappedAddress.length * 4; 
                doc.text(`Mob - ${phone}`, x + padding, y + 24 + addressHeight);
            });

            doc.save(`Shipping_Labels_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.update(toastId, { render: "Labels Exported Successfully", type: "success", isLoading: false, autoClose: 3000 });
        }
    } catch (error) {
        console.error("Label Export Error:", error);
        toast.update(toastId, { render: "Export Failed", type: "error", isLoading: false, autoClose: 3000 });
    }
};

  // ── EXPORT LOGIC ──────────────────────────────────────────────────────────
  // ── UPDATED EXPORT LOGIC ──────────────────────────────────────────────────
  const downloadRegistry = async () => {
    const toastId = toast.loading("Synthesizing Line-Item Registry...");
    try {
      // Fetch up to 10,000 orders based on current filters
      const response = await axios.post(
        `${backendUrl}/api/order/list?limit=10000&status=${filterStatus}&sort=${sortBy}`, 
        {}, 
        { headers: { token } }
      );

      if (response.data.success) {
        const ordersData = response.data.orders;
        const reportData = [];

        // FLATTENING LOGIC: Create one row per product specimen
        ordersData.forEach((order) => {
          order.items.forEach((item, index) => {
            reportData.push({
              "Order": order.orderNo || `#${order._id.slice(-6).toUpperCase()}`,
              "First": order.address?.firstName || "",
              "Last": order.address?.lastName || "",
              "Item #": index + 1, // Sequential numbering resets for every new order
              "Item Name": item.name,
              "Quantity (- Refund)": item.quantity,
              "Item Cost": item.price,
              "Total Cost": item.price * item.quantity,
              "Status": order.status,
              "Date": new Date(order.date).toLocaleDateString('en-IN')
            });
          });
        });

        // Generate Excel Worksheet
        const ws = XLSX.utils.json_to_sheet(reportData);
        
        // Define Column Widths for a clean corporate look
        const wscols = [
          { wch: 12 }, // Order
          { wch: 15 }, // First
          { wch: 15 }, // Last
          { wch: 8 },  // Item #
          { wch: 50 }, // Item Name
          { wch: 18 }, // Quantity
          { wch: 12 }, // Item Cost
          { wch: 12 }, // Total Cost
          { wch: 15 }, // Status
          { wch: 12 }  // Date
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Line Item Registry");
        
        // Finalize Download
        XLSX.writeFile(wb, `PhilaBasket_Detailed_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        toast.update(toastId, { render: "Registry Exported Successfully", type: "success", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.update(toastId, { render: "Export Failed: Sync Error", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const updateOrder = async (orderId, status, trackingNumber) => {
    setLoading(true);
    try {
      const res = await axios.post(backendUrl + '/api/order/status', { orderId, status, trackingNumber }, { headers: { token } });
      if (res.data.success) {
        toast.success(`Status updated to ${status}`);
        setShowTrackingModal(false);
        fetchAllOrders(false);
      }
    } catch {
      toast.error("Update Error");
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
    {/* PDF Export Button */}
    <button 
      onClick={downloadShippingManifest} 
      className='flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:text-red-600 hover:shadow-md transition-all active:scale-95'
    >
      <FileText size={14} /> Shipping PDF
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
            { label: "Paid", val: globalStats["Money Received"] || 0, bg: "bg-cyan-50", color: "text-cyan-600" },
            { label: "Transit", val: (globalStats["Shipped"] || 0) + (globalStats["Out for delivery"] || 0), bg: "bg-purple-50", color: "text-purple-600" },
            { label: "Done", val: globalStats["Delivered"] || 0, bg: "bg-green-50", color: "text-green-600" },
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
        <div className='flex flex-wrap gap-2'>
  {["ALL", "TODAY", "Order Placed", "On Hold", "Money Received", "Shipped", "Delivered", "Cancelled"].map(s => (
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
          {loading && orders.length === 0 ? (
            <div className='flex justify-center py-20'><RefreshCw className='animate-spin text-gray-300' size={40} /></div>
          ) : orders.length === 0 ? (
            <div className='bg-white rounded-3xl border border-gray-100 py-20 text-center shadow-sm'>
              <Package size={48} className='text-gray-200 mx-auto mb-4' />
              <p className='text-sm font-bold text-gray-400 uppercase tracking-widest'>Registry Empty</p>
            </div>
          ) : (
            orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["Order Placed"];
              const Icon = cfg.icon;
              return (
                <div key={order._id} className='bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden'>
                  <div className='grid grid-cols-1 md:grid-cols-[auto_1fr_1.2fr_auto] items-center gap-4 p-4'>
                    <div className={`w-1.5 h-12 rounded-full ${cfg.dot} hidden md:block`} />

                    <div className='min-w-0 cursor-pointer' onClick={() => navigate(`/orders/${order._id}`)}>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-[10px] font-mono font-bold text-[#BC002D] bg-red-50 px-2 py-0.5 rounded'>
                          {order.orderNo || `#${order._id.slice(-6).toUpperCase()}`}
                        </span>
                        <p className='font-bold text-gray-900 text-sm truncate'>
                          {order.address.firstName} {order.address.lastName}
                        </p>
                      </div>
                      <p className='text-[11px] text-gray-500 font-medium truncate max-w-[280px]'>
                        {order.items.map(i => `${i.name} x${i.quantity}`).join(' • ')}
                      </p>
                    </div>

                    <div className='hidden lg:flex flex-col border-l border-gray-100 pl-6'>
                      <div className='flex items-start gap-1.5'>
                        <MapPin size={10} className='text-gray-400 mt-0.5' />
                        <p className='text-[10px] text-gray-500 font-medium truncate max-w-[250px]'>
                          {order.address.street}, {order.address.city}
                        </p>
                      </div>
                    </div>

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
                      </div>

                      <select
                        className='text-[10px] font-bold p-2 border border-gray-200 rounded-xl bg-gray-50 outline-none cursor-pointer'
                        value={order.status}
                        onChange={e => {
                          if (e.target.value === "Shipped") {
                            setActiveOrderId(order._id);
                            setTempTracking("");
                            setShowTrackingModal(true);
                          } else {
                            updateOrder(order._id, e.target.value, order.trackingNumber);
                          }
                        }}
                      >
                        {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
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

      {/* ── TRACKING MODAL ── */}
      {showTrackingModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4'>
          <div className='bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-purple-50 text-purple-600 rounded-lg'><Truck size={20}/></div>
              <h4 className='font-black uppercase text-sm tracking-tight'>Dispatch Registry</h4>
            </div>
            <input 
              autoFocus
              className='w-full border-2 border-gray-100 focus:border-purple-500 p-4 rounded-xl mb-4 uppercase font-mono text-sm outline-none transition-all' 
              placeholder="CONSIGNMENT ID"
              value={tempTracking}
              onChange={e => setTempTracking(e.target.value)}
            />
            <div className='flex gap-2'>
                <button onClick={() => updateOrder(activeOrderId, "Shipped", tempTracking)} className='flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#BC002D] transition-colors'>Confirm</button>
                <button onClick={() => setShowTrackingModal(false)} className='flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200'>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;