import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { 
  ChevronLeft, MapPin, Phone, Mail, CreditCard, 
  Clock, Truck, Star, TrendingUp, Copy, CheckCircle2, 
  Landmark, PackageCheck, Ban, RefreshCw, Hash, Save
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
  const [allowInvoice, setAllowInvoice] = useState(false);
const [isInvoiceUpdating, setIsInvoiceUpdating] = useState(false);
const [shippedDate, setShippedDate] = useState('');
const [orderStatus, setOrderStatus] = useState('');
const [customerOrderCount, setCustomerOrderCount] = useState(0);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [userOrdersList, setUserOrdersList] = useState([]);
const [isEmailing, setIsEmailing] = useState(false);

const emailInvoice = async () => {
    const message = `Dispatch electronic invoice for Order #${order.orderNo} to ${order.address?.email || order.userId?.email}?`;
    
    if (!window.confirm(message)) return;

    setIsEmailing(true);
    try {
        const response = await axios.post(backendUrl + '/api/order/email-invoice', {
            orderId
        }, { headers: { token } });

        if (response.data.success) {
            toast.success("Registry Invoice Dispatched");
        } else {
            toast.error(response.data.message);
        }
    } catch (err) {
        toast.error("Email protocol failed");
        console.error(err);
    } finally {
        setIsEmailing(false);
    }
}; // To store full order objects

useEffect(() => {
  const fetchOrderAndHistory = async () => {
    try {
      if (!order) setLoading(true);
      
      // 1. Fetch current order
      const response = await axios.post(backendUrl + '/api/order/single', { orderId }, { headers: { token } });
      
      if (response.data.success) {
          const orderData = response.data.order;
          setOrder(orderData);
          setTrackingId(orderData.trackingNumber || '');
          setAllowInvoice(orderData.allowInvoice || false);
          setOrderStatus(orderData.status);

          // 2. Fetch User's Total History using the Admin Token
          const historyResponse = await axios.post(backendUrl + '/api/order/userordersadmin', 
            { userId: orderData.userId._id }, 
            { headers: { token } } // Admin token used here
          );
          
          if (historyResponse.data.success) {
            setCustomerOrderCount(historyResponse.data.orders.length);
            setUserOrdersList(historyResponse.data.orders); // Save full list for the sidebar
        }
      }
    } catch (err) { 
        console.error("Fetch error:", err);
    } finally { setLoading(false); }
  };
  if (token) fetchOrderAndHistory();
}, [orderId, token]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!order) setLoading(true);
        const response = await axios.post(backendUrl + '/api/order/single', { orderId }, { headers: { token } });
        if (response.data.success) {
            setOrder(response.data.order);
            setTrackingId(response.data.order.trackingNumber || '');
            setAllowInvoice(response.data.order.allowInvoice || false);
            setOrderStatus(response.data.order.status);
            if (response.data.order.shippedDate) {
              setShippedDate(new Date(response.data.order.shippedDate).toISOString().split('T')[0]);
            }
        }
      } catch (err) { 
          console.error("API Fetch error:", err);
          if (!order) toast.error("Failed to load order.");
      } finally { setLoading(false); }
    };
    if (token) fetchOrder();
  }, [orderId, token]);



const updateTracking = async () => {
  // 1. Logic Change: Don't block if trackingId is empty, 
  // unless you are specifically moving to "Shipped" status.
  if (orderStatus === 'Shipped' && !trackingId) {
      return toast.error("Tracking ID is required for Shipped status");
  }

  setIsUpdating(true);
  try {
      const response = await axios.post(backendUrl + '/api/order/status', {
          orderId,
          status: orderStatus, // FIXED: Use the new state from your dropdown
          trackingNumber: trackingId,
          shippedDate: shippedDate ? new Date(shippedDate).getTime() : null
      }, { headers: { token } });

      if (response.data.success) {
          toast.success("Registry updated successfully");
          
          // 2. Sync Local State
          setOrder(prev => ({ 
              ...prev, 
              trackingNumber: trackingId,
              status: orderStatus, // Now correctly reflects the dropdown choice
              shippedDate: shippedDate ? new Date(shippedDate).getTime() : prev.shippedDate 
          }));
      }
  } catch (err) {
      console.error(err);
      toast.error("Update failed");
  } finally { 
      setIsUpdating(false); 
  }
};

  const copyAddress = (addr) => {
    if (!addr) return;
    const t = `${addr.firstName} ${addr.lastName}\n${addr.street}\n${addr.city}, ${addr.state} ${addr.zipcode}`;
    navigator.clipboard.writeText(t);
    toast.success("Address copied");
  };

  if (loading && !order) return (
    <div style={styles.loadingScreen}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', color: '#1e3a5f' }} />
      <p style={styles.loadingText}>Loading order details...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={styles.loadingScreen}>
      <p style={{ ...styles.loadingText, color: '#64748b' }}>Order not found.</p>
      <button onClick={() => navigate('/orders')} style={styles.backLinkBtn}>← Return to Orders</button>
    </div>
  );

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["Order Placed"];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .row-hover:hover { background: #f8fafc !important; }
        .btn-save:hover { background: #122d4f !important; }
        .copy-btn:hover { background: #f1f5f9 !important; }
        .back-btn:hover { color: #1e3a5f !important; }
      `}</style>

      <div style={styles.container}>

        {/* Top bar */}
        <div style={styles.topBar}>
          <button onClick={() => navigate(-1)} className="back-btn" style={styles.backBtn}>
            <ChevronLeft size={14} /> Back to Orders
          </button>
          <span style={styles.topBarRef}>REF: {order.orderNo || order._id}</span>
        </div>

        {/* --- INVOICE CONTROL CARD --- */}
        <div style={styles.card}>
    <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>Digital Dispatch</span>
        <Mail size={15} style={{ color: '#64748b' }} />
    </div>
    <div style={styles.cardBody}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Email Registry Invoice</p>
                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Send Philately-themed PDF/HTML to user</p>
            </div>
            <button 
                onClick={emailInvoice}
                disabled={isEmailing}
                style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    backgroundColor: '#1e3a5f',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                {isEmailing ? (
                    <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : <Mail size={12} />}
                {isEmailing ? 'SENDING...' : 'DISPATCH EMAIL'}
            </button>
        </div>
    </div>
</div>






        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.headerLabel}>Order Details</p>
            <h1 style={styles.headerName}>{order.address?.firstName} {order.address?.lastName}</h1>
          </div>

          <div 
    onClick={() => setIsSidebarOpen(true)}
    style={{
        background: '#1e3a5f',
        padding: '2px 8px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer', // Added for feedback
        transition: 'transform 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
>
    <TrendingUp size={10} style={{ color: '#ffffff' }} />
    <span style={{ fontSize: '9px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
        {customerOrderCount} Lifetime Orders
    </span>
</div>

{order.userId && (
              <div style={styles.rewardCard}>
                <div style={styles.rewardIcon}><Star size={18} style={{ color: '#b45309' }} /></div>
                <div>
                  <p style={styles.rewardLabel}>Reward Balance</p>
                  <p style={styles.rewardValue}>{order.userId.totalRewardPoints || 0} pts</p>
                </div>
              </div>
            )}


          <div style={styles.statusBadge} className={cfg.color}>
            <cfg.icon size={13} />
            <span>{order.status}</span>
          </div>
        </div>
        {(() => {
              const delivery = order.address;
              const billing = order.billingAddress;
              const isSame = !billing ||
                (billing.firstName === delivery?.firstName &&
                 billing.lastName  === delivery?.lastName &&
                 billing.street    === delivery?.street &&
                 billing.city      === delivery?.city &&
                 billing.state     === delivery?.state &&
                 billing.zipcode   === delivery?.zipcode);
              const sections = [
                { title: "Delivery Address", data: delivery, Icon: MapPin },
                ...(!isSame ? [{ title: "Billing Address", data: billing, Icon: Landmark }] : []),
              ];
              return (
                <div style={{ ...styles.addrGrid, gridTemplateColumns: isSame ? '1fr' : '1fr 1fr' }}>
                  {sections.map(({ title, data, Icon }) => (
                    <div key={title} style={styles.addrCard}>
                      <div style={styles.addrHeader}>
                        <div style={styles.addrTitleRow}>
                          <Icon size={14} style={{ color: '#1e3a5f' }} />
                          <span style={styles.addrTitle}>{title}</span>
                        </div>
                        <button onClick={() => copyAddress(data)} className="copy-btn" style={styles.copyBtn} title="Copy address">
                          <Copy size={13} />
                        </button>
                      </div>
                      <div style={styles.addrBody}>
                        <p style={styles.addrName}>{data?.firstName} {data?.lastName}</p>
                        <p style={styles.addrLine}>{data?.street}</p>
                        <p style={styles.addrLine}>{data?.city}, {data?.state}</p>
                        <p style={{ ...styles.addrLine, fontWeight: 600, color: '#1e3a5f' }}>{data?.zipcode}</p>
                        <div style={styles.addrContacts}>
                          <div style={styles.contactRow}><Phone size={11} style={{ color: '#94a3b8' }} /><span>{data?.phone}</span></div>
                          <div style={styles.contactRow}><Mail size={11} style={{ color: '#94a3b8' }} /><span>{data?.email || order.userId?.email}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

        <div style={styles.grid}>

        

          {/* ── LEFT COLUMN ── */}
          <div style={styles.leftCol}>

            {/* Items Table */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Order Items</span>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={{ ...styles.th, textAlign: 'left' }}>Product</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Qty</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i} className="row-hover" style={styles.tbodyRow}>
                      <td style={{ ...styles.td, textAlign: 'left' }}>
                        <div style={styles.itemCell}>
                          <img src={item.image?.[0] || assets.logo} style={styles.itemImg} alt="" />
                          <div>
                            <p style={styles.itemName}>{item.name}</p>
                            <p style={styles.itemCat}>{item.category?.[0] || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: '#64748b' }}>₹{item.price}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={3} style={{ ...styles.td, textAlign: 'right', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Grand Total
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: '18px', color: '#1e3a5f' }}>
                      ₹{order.amount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Addresses */}
           
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={styles.rightCol}>

            {/* Tracking */}
            {/* Tracking Card */}
{/* Shipment Tracking Card */}
<div style={styles.card}>
  <div style={styles.cardHeader}>
    <span style={styles.cardTitle}>Logistics & Status</span>
    <Truck size={15} style={{ color: '#64748b' }} />
  </div>
  <div style={styles.cardBody}>
    
    {/* --- STATUS SELECTOR --- */}
    <label style={styles.inputLabel}>Order Status</label>
    <div style={styles.inputWrap}>
      <PackageCheck size={14} style={styles.inputIcon} />
      <select
        value={orderStatus}
        onChange={(e) => setOrderStatus(e.target.value)}
        style={{ ...styles.input, paddingLeft: '36px', appearance: 'none', cursor: 'pointer' }}
      >
        {Object.keys(STATUS_CONFIG).map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </div>

    <label style={{ ...styles.inputLabel, marginTop: '8px' }}>Tracking ID</label>
    <div style={styles.inputWrap}>
      <Hash size={14} style={styles.inputIcon} />
      <input
        value={trackingId}
        onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
        placeholder="Enter tracking number"
        style={styles.input}
      />
    </div>

    <label style={{ ...styles.inputLabel, marginTop: '8px' }}>Shipment Date</label>
    <div style={styles.inputWrap}>
      <Clock size={14} style={styles.inputIcon} />
      <input
        type="date"
        value={shippedDate}
        onChange={(e) => setShippedDate(e.target.value)}
        style={{ ...styles.input, fontFamily: 'inherit', paddingLeft: '36px' }}
      />
    </div>

    <button onClick={updateTracking} disabled={isUpdating} className="btn-save" style={styles.saveBtn}>
      {isUpdating
        ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Synchronizing…</>
        : <><Save size={13} /> Save All Changes</>
      }
    </button>
  </div>
</div>

            {/* Payment Summary */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Payment Summary</span>
                <CreditCard size={15} style={{ color: '#64748b' }} />
              </div>
              <div style={styles.cardBody}>
                {[
                  { label: 'Method',   value: order.paymentMethod || '—' },
                  { label: 'Date',     value: new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label} style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>{label}</span>
                    <span style={styles.summaryValue}>{value}</span>
                  </div>
                ))}
                <div style={styles.summaryDivider} />
                <div style={styles.summaryRow}>
                  <span style={{ ...styles.summaryLabel, color: '#1e3a5f', fontWeight: 700 }}>Total Amount</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a5f', fontFamily: "'Playfair Display', serif" }}>₹{order.amount}</span>
                </div>
              </div>
            </div>

            {/* Reward Points */}

          </div>

        </div>
      </div>
      {/* --- CUSTOMER HISTORY SIDEBAR --- */}
<div style={{
    ...styles.sidebarOverlay,
    visibility: isSidebarOpen ? 'visible' : 'hidden',
    opacity: isSidebarOpen ? 1 : 0
}} onClick={() => setIsSidebarOpen(false)}>
    <div style={{
        ...styles.sidebarContent,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)'
    }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.sidebarHeader}>
            <div>
                <p style={styles.headerLabel}>Collector History</p>
                <h3 style={{ ...styles.headerName, fontSize: '20px' }}>{order.address?.firstName}'s Orders</h3>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}>✕</button>
        </div>
        
        <div style={styles.sidebarBody}>
            {userOrdersList.map((item) => (
                <div 
                    key={item._id} 
                    onClick={() => { navigate(`/orders/${item._id}`); setIsSidebarOpen(false); }}
                    style={{
                        ...styles.historyItem,
                        borderLeft: item._id === orderId ? '4px solid #1e3a5f' : '4px solid transparent',
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
                        <span style={styles.historyAmount}>₹{item.amount}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
</div>
    </div>
  );
};

/* ── Styles ── */
const styles = {

  sidebarOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000,
    transition: 'all 0.3s ease-in-out', backdropFilter: 'blur(2px)'
  },
  sidebarContent: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: '350px', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease-in-out'
  },
  sidebarHeader: {
    padding: '24px', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8'
  },
  sidebarBody: { padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' },
  historyItem: {
    padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0',
    cursor: 'pointer', transition: 'all 0.2s'
  },
  historyRef: { fontSize: '12px', fontWeight: 700, color: '#1e3a5f', fontFamily: 'monospace' },
  historyDate: { fontSize: '11px', color: '#94a3b8' },
  historyAmount: { fontSize: '14px', fontWeight: 700, color: '#0f172a' },

  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    paddingTop: '15px',
    paddingBottom: '64px',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: '#f1f5f9',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  loadingText: {
    fontSize: '12px',
    color: '#94a3b8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  backLinkBtn: {
    fontSize: '12px',
    color: '#1e3a5f',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    transition: 'color 0.15s',
    padding: 0,
  },
  topBarRef: {
    fontSize: '10px',
    color: '#94a3b8',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #cbd5e1',
  },
  headerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  headerName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '30px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    border: '1px solid',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '24px',
    alignItems: 'start',
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#334155',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 20px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  tbodyRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.1s',
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'middle',
  },
  itemCell: { display: 'flex', alignItems: 'center', gap: '14px' },
  itemImg: {
    width: '44px',
    height: '44px',
    objectFit: 'contain',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '4px',
    flexShrink: 0,
  },
  itemName: { fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 },
  itemCat: { fontSize: '10px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' },
  addrGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  addrCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  addrHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  addrTitleRow: { display: 'flex', alignItems: 'center', gap: '7px' },
  addrTitle: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#334155',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#64748b',
    transition: 'background 0.15s',
  },
  addrBody: { padding: '16px 18px' },
  addrName: { fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' },
  addrLine: { fontSize: '13px', color: '#64748b', marginBottom: '2px' },
  addrContacts: { marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '12px',
    color: '#64748b',
  },
  inputLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '11px 14px 11px 36px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#0f172a',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '0.05em',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    width: '100%',
    background: '#1e3a5f',
    color: '#fff',
    border: 'none',
    padding: '12px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
  summaryDivider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '4px 0',
  },
  rewardCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px', 
    marginTop: '5px',           // Reduced gap for header layout
    padding: '2px 2px',      // Slimmer padding to match other badges
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',     // Increased to match the 10px of your Lifetime Orders badge
    minHeight: '32px',        // Ensures consistent height across the row
  },
  rewardIcon: {
    width: '20px',            // Scaled down from 44px for header context
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    border: '1px solid #fde68a',
    borderRadius: '4px',
    flexShrink: 0,
  },
  rewardTextContent: {        // Added a wrapper style for better alignment
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px'
  },
  rewardLabel: {
    fontSize: '8px',          // Smaller for secondary context
    fontWeight: 800,
    color: '#92400e',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  rewardValue: {
    fontFamily: "'Source Sans 3', sans-serif", // Matched your primary sans font for badges
    fontSize: '12px',
    fontWeight: 800,
    color: '#78350f',
  },
};

export default OrderDetail;