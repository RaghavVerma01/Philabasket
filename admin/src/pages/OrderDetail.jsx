import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { backendUrl } from '../App';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { 
  ChevronLeft, MapPin, Phone, Mail, CreditCard, 
  Clock, Truck, Star, TrendingUp, Copy, CheckCircle2, 
  Landmark, PackageCheck, Ban, RefreshCw, Hash, Save,
  Plus, Trash2, Search, X, Globe
} from 'lucide-react';
import { assets } from '../assets/assets';

const STATUS_CONFIG = {
    "Order Placed":    { color: "bg-blue-50 text-blue-800 border-blue-200",    icon: CheckCircle2 },
    "On Hold":         { color: "bg-slate-50 text-slate-700 border-slate-200", icon: Clock },
    "Money Received":  { color: "bg-teal-50 text-teal-800 border-teal-200",    icon: CreditCard },
    "Packing":         { color: "bg-amber-50 text-amber-800 border-amber-200", icon: PackageCheck },
    "Shipped":         { color: "bg-violet-50 text-violet-800 border-violet-200", icon: Truck },
    "Out for delivery":{ color: "bg-orange-50 text-orange-800 border-orange-200", icon: Truck },
    "Delivered":       { color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
    "Cancelled":       { color: "bg-red-50 text-red-800 border-red-200",        icon: Ban },
};

const OrderDetail = ({ token }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState(location.state?.orderData || null);
  const [loading, setLoading] = useState(!location.state?.orderData);
  const [trackingId, setTrackingId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [shippedDate, setShippedDate] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [customerOrderCount, setCustomerOrderCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userOrdersList, setUserOrdersList] = useState([]);
  const [isEmailing, setIsEmailing] = useState(false);

  // --- EDITING STATES ---
  const [allProducts, setAllProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingItems, setIsSavingItems] = useState(false);


  const downloadInvoice = (order) => {
    try {
      // Initialize jsPDF
      const doc = new jsPDF();
  
      // --- 1. HEADER SECTION (TEXT ONLY) ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text("Phila Basket", 14, 18); // Shifted to left margin since logo is removed
      
      doc.setFontSize(8);
      doc.text("G-3, Prakash Kunj Apartment, Kavi Raman Path, Boring Road", 14, 23);
      doc.text("Patna 800001 Bihar India | philapragya@gmail.com", 14, 27);
      doc.text("GSTIN: 10AGUPJ4257E1ZI", 14, 31);
  
      // Right-aligned Invoice Header
      doc.setFontSize(14);
      doc.text("TAX INVOICE", 140, 18);
      doc.setFontSize(9);
      doc.text(`Order #: ${order.orderNo || 'N/A'}`, 140, 25);
      doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 140, 30);
  
      // --- 2. STATUS LOGIC ---
      let displayStatus = (order.status || "Order Placed").toUpperCase();
      const method = (order.paymentMethod || "").toUpperCase();
      
      if (['RAZORPAY', 'STRIPE', 'UPI'].includes(method)) {
          displayStatus = "PAID";
      } else if (method === 'COD') {
          displayStatus = order.status === 'Delivered' ? "PAID (CASH)" : "PENDING (COD)";
      }
  
      doc.setFontSize(9);
      doc.text(`Status: ${displayStatus}`, 140, 35);
  
      // --- 3. ADDRESSES ---
      const addr = order.address || {};
      const billAddr = order.billingAddress || addr;
      
      doc.setFontSize(10);
      doc.text("BILL TO:", 14, 45);
      doc.setFontSize(8);
      doc.text(`${billAddr.firstName || ''} ${billAddr.lastName || ''}`, 14, 50);
      doc.text(`${billAddr.street || ''}`, 14, 54);
      doc.text(`${billAddr.street2 || ''}`, 14, 54);

      doc.text(`${billAddr.city || ''}, ${billAddr.state || ''} ${billAddr.zipcode || ''}`, 14, 58);
  
      doc.text("SHIP TO:", 110, 45);
      doc.text(`${addr.firstName || ''} ${addr.lastName || ''}`, 110, 50);
      doc.text(`${addr.street || ''}`, 110, 54);
      doc.text(`${addr.street2 || ''}`, 110, 54);

      doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.zipcode || ''}`, 110, 58);
  
      // --- 4. ITEMS TABLE ---
      let totalBaseAmount = 0;
      let totalGSTAmount = 0;
  
      const tableRows = (order.items || []).map((item, index) => {
          const basePriceUnit = Number(item.price || 0);
          const qty = item.quantity || 1;
          const gstUnit = basePriceUnit * 0.05; // 5% GST Logic
          const rowTotalIncl = (basePriceUnit + gstUnit) * qty;
          
          totalBaseAmount += basePriceUnit * qty;
          totalGSTAmount += gstUnit * qty;
  
          return [
            index + 1, 
            item.name || 'Specimen', 
            "9704", 
            qty, 
            basePriceUnit.toFixed(2),
            "5%", 
            rowTotalIncl.toFixed(2)
          ];
      });
  
      autoTable(doc, {
          startY: 70,
          head: [['#', 'Item & Description', 'HSN', 'Qty', 'Rate (Excl.)', 'IGST', 'Amount (Incl.)']],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [188, 0, 45] }, // Phila Basket Brand Red
          styles: { fontSize: 8 }
      });
  
      // --- 5. TOTALS SECTION ---
      const finalY = doc.lastAutoTable.finalY + 10;
      const userCountry = (addr.country || "India").trim().toLowerCase();
      const isIndia = userCountry === 'india';
  
      const itemTotalInclGst = totalBaseAmount + totalGSTAmount;
      let shippingCharge = order.deliveryFee !== undefined ? Number(order.deliveryFee) : (isIndia ? 125 : 750);
      
      // Free Shipping Logic
      if (isIndia && itemTotalInclGst > 4999) {
          shippingCharge = 0;
      }
  
      const couponDiscount = Number(order.discountAmount || 0);
      const pointsDiscount = Number(order.pointsUsed || 0) / 10;
      const finalPayable = Number(order.amount || 0);
  
      autoTable(doc, {
          startY: finalY,
          margin: { left: 105 },
          tableWidth: 90,
          theme: 'plain', 
          styles: { fontSize: 8, cellPadding: 2 },
          body: [
              ['Sub-Total (Base Items)', `Rs. ${totalBaseAmount.toFixed(2)}`],
              ['IGST (5%)', `Rs. ${totalGSTAmount.toFixed(2)}`],
              [`Shipping Charge`, shippingCharge === 0 ? 'FREE' : `Rs. ${shippingCharge.toFixed(2)}`],
              [{ content: 'GST Subsidy', styles: { textColor: [0, 128, 0], fontStyle: 'italic' } }, `Rs. -${totalGSTAmount.toFixed(2)}`],
              [`Discount`, `Rs. -${couponDiscount.toFixed(2)}`],
              [`Archive Credits`, `Rs. -${pointsDiscount.toFixed(2)}`],
              [{ content: 'Total Payable', styles: { fontStyle: 'bold', fontSize: 10, textColor: [188, 0, 45] } }, 
               { content: `Rs. ${finalPayable.toFixed(2)}`, styles: { fontStyle: 'bold', fontSize: 10, textColor: [188, 0, 45] } }]
          ],
          columnStyles: { 1: { halign: 'right' } }
      });
  
      // --- 6. FOOTER ---
      const footerY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(8);
      doc.text("BANKING: HDFC Bank | A/c: 01868730000112 | IFSC: HDFC0000186", 14, footerY);
      
      // Save File
      doc.save(`Invoice_${order.orderNo || 'Order'}.pdf`);
  
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Invoice generation failed.");
    }
  };


  // --- EDITING LOGIC ---
  const fetchAllProducts = async () => {
    try {
        const response = await axios.get(backendUrl + '/api/product/admin-list', { 
            headers: { token } 
        });
        if (response.data.success) setAllProducts(response.data.products);
    } catch (err) { 
        console.error("Registry Access Denied:", err);
    }
  };

  const removeItem = (index) => {
    if (order.items.length <= 1) return toast.warning("Order must contain at least one item.");
    const updatedItems = [...order.items];
    updatedItems.splice(index, 1);
    recalculateTotal(updatedItems);
  };

  const addItem = (product) => {
    const exists = order.items.find(item => item._id === product._id);
    if (exists) return toast.info("Specimen already in list.");
    const updatedItems = [...order.items, { ...product, quantity: 1 }];
    recalculateTotal(updatedItems);
    setShowAddModal(false);
  };

  const updateQty = (index, delta) => {
    const updatedItems = [...order.items];
    const newQty = updatedItems[index].quantity + delta;
    if (newQty < 1) return;
    updatedItems[index].quantity = newQty;
    recalculateTotal(updatedItems);
  };

  const recalculateTotal = (updatedItems) => {
    const itemsSubtotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gst = itemsSubtotal * 0.05;
    const discount = itemsSubtotal * 0.05;
    const shipping = Number(order.deliveryFee || 0);
    const newTotal = (itemsSubtotal + gst - discount + shipping);
    setOrder(prev => ({ ...prev, items: updatedItems, amount: Math.round(newTotal) }));
  };

  const saveOrderEdits = async () => {
    if (!window.confirm("Sync changes with Master Registry?")) return;
    setIsSavingItems(true);
    try {
        const response = await axios.post(backendUrl + '/api/order/update-items', {
            orderId: order._id,
            items: order.items,
            amount: order.amount 
        }, { headers: { token } });
        if (response.data.success) toast.success("Registry Synchronized");
    } catch (err) { toast.error("Sync failed"); } 
    finally { setIsSavingItems(false); }
  };

  const emailInvoice = async () => {
    if (!window.confirm(`Email invoice to ${order.address?.email}?`)) return;
    setIsEmailing(true);
    try {
        const response = await axios.post(backendUrl + '/api/order/email-invoice', { orderId }, { headers: { token } });
        if (response.data.success) toast.success("Invoice Dispatched");
    } catch (err) { toast.error("Email protocol failed"); } 
    finally { setIsEmailing(false); }
  };

  const updateTracking = async () => {
    if (orderStatus === 'Shipped' && !trackingId) return toast.error("Tracking ID required");
    setIsUpdating(true);
    try {
        const response = await axios.post(backendUrl + '/api/order/status', {
            orderId, status: orderStatus, trackingNumber: trackingId,
            shippedDate: shippedDate ? new Date(shippedDate).getTime() : null
        }, { headers: { token } });
        if (response.data.success) {
            toast.success("Logistics updated");
            setOrder(prev => ({ ...prev, trackingNumber: trackingId, status: orderStatus }));
        }
    } catch (err) { toast.error("Update failed"); } 
    finally { setIsUpdating(false); }
  };

  const copyAddress = (addr) => {
    const t = `${addr.firstName} ${addr.lastName}\n${addr.street}\n${addr.street2}\n${addr.city}, ${addr.state} ${addr.zipcode}\n${addr.country}`;
    navigator.clipboard.writeText(t);
    toast.success("Address copied");
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (!order) setLoading(true);
        const response = await axios.post(backendUrl + '/api/order/single', { orderId }, { headers: { token } });
        if (response.data.success) {
            const d = response.data.order;
            setOrder(d);
            setTrackingId(d.trackingNumber || '');
            setOrderStatus(d.status);
            if (d.shippedDate) setShippedDate(new Date(d.shippedDate).toISOString().split('T')[0]);
            const hist = await axios.post(backendUrl + '/api/order/userordersadmin', { userId: d.userId._id }, { headers: { token } });
            if (hist.data.success) {
                setCustomerOrderCount(hist.data.orders.length);
                setUserOrdersList(hist.data.orders);
            }
        }
        fetchAllProducts();
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (token) init();
  }, [orderId, token]);

  if (loading && !order) return <div style={styles.loadingScreen}><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  if (!order) return <div style={styles.loadingScreen}><p>Registry Entry Not Found</p></div>;

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["Order Placed"];

  // --- ADDRESS LOGIC ---
  const delivery = order.address;
  const billing = order.billingAddress;
  const isDifferent = billing && (
    billing.street !== delivery.street || 
    billing.street2 !== delivery.street2 || 

    billing.zipcode !== delivery.zipcode || 
    billing.country !== delivery.country
  );

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.container}>
        {/* Navigation Bar */}
        <div style={styles.topBar}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}><ChevronLeft size={14} /> Back</button>
          <span style={styles.topBarRef}>REGISTRY REF: {order.orderNo || order._id}</span>
        </div>

        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={styles.headerLabel}>Order Details</p>
              {order.deliveryMethod === 'fast' && <span style={styles.priorityBadge}>⚡ Priority</span>}
            </div>
            <h1 style={styles.headerName}>{order.userId?.name }</h1>
            <p style={styles.countryLabel}><Globe size={11} /> {delivery?.country}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div onClick={() => setIsSidebarOpen(true)} style={styles.statsBadge}><TrendingUp size={10} /> {customerOrderCount} Orders</div>
            <div style={styles.statusBadge} className={cfg.color}><cfg.icon size={13} /> {order.status}</div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            {order.userId && (
                <div style={styles.rewardCard}>
                    <div style={styles.rewardIcon}><Star size={14} style={{ color: '#b45309' }} /></div>
                    <div>
                        <p style={styles.rewardLabel}>Reward Balance</p>
                        <p style={styles.rewardValue}>{order.userId.totalRewardPoints || 0} pts</p>
                    </div>
                </div>
            )}
        </div>

        <div style={styles.grid}>
          {/* LEFT COLUMN: Items and Addresses */}
          <div style={styles.leftCol}>
            
            {/* SPECIMEN TABLE */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Specimen Registry</span>
                <button onClick={() => setShowAddModal(true)} style={styles.addBtn}><Plus size={12}/> Add Item</button>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={styles.th}>Product</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Qty</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Total</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i} style={styles.tbodyRow}>
                      <td style={styles.td}>
                        <div style={styles.itemCell}>
                          <img src={item.image?.[0]} style={styles.itemImg} alt="" />
                          <p style={styles.itemName}>{item.name}</p>
                        </div>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <button onClick={() => updateQty(i, -1)} style={styles.qtyBtn}>-</button>
                            <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                            <button onClick={() => updateQty(i, 1)} style={styles.qtyBtn}>+</button>
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>₹{item.price * item.quantity}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button onClick={() => removeItem(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fcfcfc' }}>
                    <td colSpan={2} style={{ ...styles.td, textAlign: 'right', color: '#64748b', fontSize: '10px' }}>Shipping ({order.deliveryMethod})</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>₹{order.deliveryFee}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>Grand Total Valuation</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: '18px', color: '#1e3a5f' }}>₹{order.amount}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ padding: '15px', background: '#f8fafc', textAlign: 'right' }}>
                <button onClick={saveOrderEdits} disabled={isSavingItems} style={styles.saveItemsBtn}>
                    {isSavingItems ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} 
                    SYNC REGISTRY CHANGES
                </button>
              </div>
            </div>

            {/* ADDRESS GRID: Conditional logic for Billing vs Delivery */}
            <div style={{ ...styles.addrGrid, gridTemplateColumns: isDifferent ? '1fr 1fr' : '1fr' }}>
                {/* Delivery (Always Visible) */}
                <div style={styles.addrCard}>
                    <div style={styles.addrHeader}>
                        <div style={styles.addrTitleRow}><MapPin size={14} /> <span style={styles.addrTitle}>Delivery Address</span></div>
                        <button onClick={() => copyAddress(delivery)} style={styles.copyBtn}><Copy size={13}/></button>
                    </div>
                    <div style={styles.addrBody}>
                        <p style={styles.addrName}>{delivery?.firstName} {delivery?.lastName}</p>
                        <p style={styles.addrLine}>{delivery?.street}</p>
                        <p style={styles.addrLine}>{delivery?.street2}</p>

                        <p style={styles.addrLine}>{delivery?.city}, {delivery?.state}</p>
                        <p style={{ ...styles.addrLine, fontWeight: 700 }}>{delivery?.zipcode}, {delivery?.country}</p>
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '11px', color: '#64748b' }}><Phone size={10}/> {delivery?.phone}</p>
                            <p style={{ fontSize: '11px', color: '#64748b' }}><Mail size={10}/> {delivery?.email || order.userId?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Billing (Only if Different) */}
                {isDifferent && (
                    <div style={styles.addrCard}>
                        <div style={styles.addrHeader}>
                            <div style={styles.addrTitleRow}><Landmark size={14} /> <span style={styles.addrTitle}>Billing Address</span></div>
                            <button onClick={() => copyAddress(billing)} style={styles.copyBtn}><Copy size={13}/></button>
                        </div>
                        <div style={styles.addrBody}>
                            <p style={styles.addrName}>{billing?.firstName} {billing?.lastName}</p>
                            <p style={styles.addrLine}>{billing?.street}</p>
                            <p style={styles.addrLine}>{billing?.street2}</p>

                            <p style={styles.addrLine}>{billing?.city}, {billing?.state}</p>
                            <p style={{ ...styles.addrLine, fontWeight: 700 }}>{billing?.zipcode}, {billing?.country}</p>
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* RIGHT COLUMN: Controls */}
          <div style={styles.rightCol}>
            <div style={styles.card}>
                <div style={styles.cardHeader}><span style={styles.cardTitle}>Logistics Record</span><Truck size={15} /></div>
                <div style={styles.cardBody}>
                    <label style={styles.inputLabel}>Current Status</label>
                    <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={styles.select}>
                        {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label style={styles.inputLabel}>Tracking Number</label>
                    <input value={trackingId} onChange={(e) => setTrackingId(e.target.value.toUpperCase())} placeholder="AWB#" style={styles.input} />
                    <label style={styles.inputLabel}>Dispatch Date</label>
                    <input type="date" value={shippedDate} onChange={(e) => setShippedDate(e.target.value)} style={styles.input} />
                    <button onClick={updateTracking} disabled={isUpdating} style={styles.saveBtn}>
                        {isUpdating ? 'SYNCING...' : 'SAVE LOGISTICS'}
                    </button>
                </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}><span style={styles.cardTitle}>Financial summary</span><CreditCard size={14}/></div>
              <div style={styles.cardBody}>
                <div style={styles.summaryRow}><span>Method</span><span style={{fontWeight: 700}}>{order.paymentMethod}</span></div>
                <div style={styles.summaryRow}><span>Dispatch</span><span>{order.deliveryMethod?.toUpperCase()}</span></div>
                <div style={styles.summaryDivider} />
                <button onClick={emailInvoice} disabled={isEmailing} style={styles.secondaryBtn}>
                    {isEmailing ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14}/>} 
                    Email Registry Invoice
                </button>
                <button 
        onClick={() => downloadInvoice(order)} 
        style={{ ...styles.secondaryBtn, marginBottom: '8px', color: '#1e3a5f', borderColor: '#1e3a5f' }}
      >
        <Hash size={14} /> 
        Download PDF Invoice
      </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD SPECIMEN MODAL --- */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>Add Specimen</h3>
                    <X size={18} onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                <div style={styles.searchWrap}>
                    <Search size={14} style={styles.searchIcon} />
                    <input placeholder="Search Registry..." style={styles.searchInput} onChange={(e)=>setSearchQuery(e.target.value)} />
                </div>
                <div style={styles.productList}>
                    {allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                        <div key={p._id} style={styles.productItem}>
                            <img src={p.image[0]} style={{ width: '30px', height: '30px', objectFit: 'contain' }} alt="" />
                            <div style={{ flex: 1 }}><p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>{p.name}</p><p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>₹{p.price}</p></div>
                            <button onClick={() => addItem(p)} style={styles.qtyBtn}><Plus size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div style={{
    ...styles.sidebarOverlay,
    visibility: isSidebarOpen ? 'visible' : 'hidden',
    opacity: isSidebarOpen ? 1 : 0
}} onClick={() => setIsSidebarOpen(false)}>
    <div style={{
        ...styles.sidebarContent,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)'
    }} onClick={(e) => e.stopPropagation()}>
        
        {/* Fixed Header: flex-shrink-0 prevents it from squishing */}
        <div style={styles.sidebarHeader}>
            <div>
                <p style={styles.headerLabel}>Collector History</p>
                <h3 style={{ ...styles.headerName, fontSize: '20px', margin: 0 }}>
                    {order.address?.firstName}'s Orders
                </h3>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}>✕</button>
        </div>
        
        {/* Scrollable Body: flex-1 makes it take up all remaining vertical space */}
        <div style={styles.sidebarBody} className="sidebar-scroll">
            {userOrdersList.map((item) => (
                <div 
                    key={item._id} 
                    onClick={() => { navigate(`/orders/${item._id}`); setIsSidebarOpen(false); }}
                    style={{
                        ...styles.historyItem,
                        borderLeft: item._id === orderId ? '4px solid #BC002D' : '4px solid transparent',
                        background: item._id === orderId ? '#f8fafc' : '#fff'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={styles.historyRef}>#{item.orderNo || item._id.slice(-6)}</span>
                        <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: STATUS_CONFIG[item.status]?.color.includes('emerald') ? '#059669' : '#64748b' 
                        }}>{item.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</span>
                        <span style={{ fontWeight: 700 }}>₹{item.amount}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
</div>

    </div>
  );
};

const styles = {
  sidebarOverlay: {
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.4)', 
    zIndex: 2000, 
    transition: 'all 0.3s ease-in-out', 
    backdropFilter: 'blur(2px)'
  },

  sidebarContent: {
    position: 'absolute', 
    right: 0, 
    top: 0, 
    bottom: 0,
    width: '380px', 
    height: '100vh',           // Lock to viewport height
    background: '#fff', 
    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
    display: 'flex', 
    flexDirection: 'column',   // Stack Header and Body vertically
    transition: 'transform 0.3s ease-in-out'
  },

  sidebarHeader: {
    padding: '24px', 
    borderBottom: '1px solid #f1f5f9',
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexShrink: 0              // Prevent header from collapsing
  },

  sidebarBody: { 
    padding: '20px', 
    overflowY: 'auto',         // Enable scrolling for body only
    flex: 1,                   // Fill all space between Header and Bottom
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px',
    backgroundColor: '#fcfcfc'
  },

  historyItem: {
    padding: '16px', 
    borderRadius: '6px', 
    border: '1px solid #e2e8f0',
    cursor: 'pointer', 
    transition: 'all 0.2s',
    flexShrink: 0              // Prevent items from squishing
  },

  closeBtn: {
    background: '#f1f5f9', 
    border: 'none', 
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    cursor: 'pointer', 
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  page: { minHeight: '100vh', background: '#f8fafc', paddingBottom: '60px', fontFamily: "'Source Sans 3', sans-serif" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' },
  topBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  topBarRef: { fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' },
  headerLabel: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 },
  headerName: { fontFamily: "'Playfair Display', serif", fontSize: '32px', margin: '4px 0', color: '#0f172a' },
  countryLabel: { fontSize: '11px', fontWeight: 800, color: '#BC002D', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' },
  priorityBadge: { background: '#BC002D', color: '#fff', fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' },
  statsBadge: { background: '#1e3a5f', color: '#fff', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 800, cursor: 'pointer' },
  rewardCard: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '20px' },
  rewardIcon: { width: '18px', height: '18px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  rewardLabel: { fontSize: '7px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', margin: 0 },
  rewardValue: { fontSize: '11px', fontWeight: 800, color: '#78350f', margin: 0 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', border: '1px solid' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  cardHeader: { padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' },
  cardBody: { padding: '20px' },
  saveItemsBtn: { background: '#1e3a5f', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  secondaryBtn: { width: '100%', background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 20px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', background: '#f8fafc' },
  td: { padding: '16px 20px', fontSize: '13px', borderBottom: '1px solid #f1f5f9' },
  itemCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  itemImg: { width: '40px', height: '40px', objectFit: 'contain', background: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' },
  itemName: { fontSize: '13px', fontWeight: 600, margin: 0 },
  addBtn: { background: '#1e3a5f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  qtyBtn: { width: '24px', height: '24px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  addrGrid: { display: 'grid', gap: '20px' },
  addrCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  addrHeader: { padding: '12px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addrTitleRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a5f' },
  addrTitle: { fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' },
  copyBtn: { background: '#fff', border: '1px solid #e2e8f0', padding: '5px', borderRadius: '4px', cursor: 'pointer', color: '#64748b' },
  addrBody: { padding: '18px', fontSize: '13px' },
  addrName: { fontWeight: 700, margin: '0 0 4px 0' },
  addrLine: { color: '#64748b', margin: '0 0 2px 0' },
  inputLabel: { fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', outline: 'none', marginBottom: '12px' },
  select: { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', outline: 'none', background: '#fff', marginBottom: '12px' },
  saveBtn: { width: '100%', background: '#1e3a5f', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  modalContent: { background: '#fff', width: '400px', maxHeight: '80vh', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' },
  searchWrap: { position: 'relative', marginBottom: '15px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '10px 10px 10px 36px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', outline: 'none' },
  productList: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  productItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #f1f5f9', borderRadius: '8px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' },
  summaryDivider: { height: '1px', background: '#f1f5f9', margin: '12px 0' },
  // sidebarOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000, transition: 'all 0.3s ease-in-out', backdropFilter: 'blur(2px)' },
  // sidebarContent: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '320px', background: '#fff', padding: '24px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' },
  // sidebarHeader: { borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  // closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  // sidebarBody: { overflowY: 'auto' },
  // historyItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  loadingScreen: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
};

export default OrderDetail;