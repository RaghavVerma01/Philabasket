import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import { 
    Truck, RefreshCw, Download, PackageCheck, ExternalLink, 
    MessageSquare, Camera, X, Star, Landmark, Smartphone, MapPin, Mail 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
  const { backendUrl, token, fetchUserData } = useContext(ShopContext);
  const [rawOrders, setRawOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // --- FEEDBACK STATES ---
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // --- PAYMENT INFO STATES ---
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState(null);

  const loadOrderData = useCallback(async (isManual = false) => {
    try {
      if (!token) return;
      if (isManual) setSyncing(true);
      const response = await axios.post(`${backendUrl}/api/order/userorders`, {}, { headers: { token } });
      if (response.data.success) {
        setRawOrders(response.data.orders);
        fetchUserData(); 
        if (isManual) toast.success("Ledger Synchronized");
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [backendUrl, token, fetchUserData]);

  useEffect(() => {
    if (token) loadOrderData();
  }, [token, loadOrderData]);

  // --- FEEDBACK HANDLER ---
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() && !feedbackImage) return toast.error("Please add text or an image");

    setSubmitting(true);
    const formData = new FormData();
    formData.append("orderId", currentOrder._id);
    formData.append("orderNo", currentOrder.orderNo);
    formData.append("text", feedbackText);
    formData.append("rating", rating);
    if (feedbackImage) formData.append("image", feedbackImage);

    try {
      const response = await axios.post(`${backendUrl}/api/feedback/add`, formData, { 
        headers: { token } 
      });

      if (response.data.success) {
        toast.success("Feedback recorded in the Archive");
        setShowFeedbackModal(false);
        setFeedbackText("");
        setFeedbackImage(null);
        setRating(5);
      } else {
        toast.error(response.data.message || "Archive sync failed.");
      }
    } catch (error) {
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- INVOICE GENERATOR ---
 // --- INVOICE GENERATOR ---
 const downloadInvoice = (order) => {
  try {
      const doc = new jsPDF();
      const logoImg = assets.og; 
      doc.addImage(logoImg, 'PNG', 10, 10, 20, 20);

      // --- HEADER CONFIG ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text("Phila Basket", 35, 18);
      doc.setFontSize(8);
      doc.text("G-3, Prakash Kunj Apartment, Kavi Raman Path, Boring Road", 35, 23);
      doc.text("Patna 800001 Bihar India | philapragya@gmail.com", 35, 27);
      doc.text("GSTIN: 10AGUPJ4257E1ZI", 35, 31);

      doc.setFontSize(14);
      doc.text("TAX INVOICE", 140, 18);
      doc.setFontSize(9);
      doc.text(`Order #: ${order.orderNo || 'N/A'}`, 140, 25);
      doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 140, 30);

      // --- STATUS LOGIC ---
      let displayStatus = (order.status || "Order Placed").toUpperCase();
      const method = (order.paymentMethod || "").toUpperCase();
      if (['RAZORPAY', 'STRIPE', 'UPI'].includes(method)) {
          displayStatus = "PAID";
      } else if (method === 'COD') {
          displayStatus = order.status === 'Delivered' ? "PAID (CASH)" : "PENDING (COD)";
      }

      doc.setFontSize(9);
      doc.text(`Status: ${displayStatus}`, 140, 35);

      const addr = order.address || {};
      const billAddr = order.billingAddress || addr;
      
      // --- ADDRESSES ---
      doc.setFontSize(10);
      doc.text("BILL TO:", 14, 45);
      doc.setFontSize(8);
      doc.text(`${billAddr.firstName || ''} ${billAddr.lastName || ''}`, 14, 50);
      doc.text(`${billAddr.street || ''}`, 14, 54);
      doc.text(`${billAddr.city || ''}, ${billAddr.state || ''} ${billAddr.zipcode || ''}`, 14, 58);

      doc.setFontSize(10);
      doc.text("SHIP TO:", 110, 45);
      doc.setFontSize(8);
      doc.text(`${addr.firstName || ''} ${addr.lastName || ''}`, 110, 50);
      doc.text(`${addr.street || ''}`, 110, 54);
      doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.zipcode || ''}`, 110, 58);

      // --- ITEMS TABLE LOGIC (MATCHING SCREENSHOT) ---
      let totalBaseAmount = 0;
      let totalGSTAmount = 0;
      

      const tableRows = (order.items || []).map((item, index) => {
          // Per screenshot: item.price is the Base Rate (Excl.)
          const basePriceUnit = Number(item.price || 0);
          const qty = item.quantity || 1;
          
          // Calculate 5% GST on the base
          const gstUnit = basePriceUnit * 0.05;
          const rowTotalIncl = (basePriceUnit + gstUnit) * qty;
          
          totalBaseAmount += basePriceUnit * qty;
          totalGSTAmount += gstUnit * qty;

          return [
            index + 1, 
            item.name || 'Specimen', 
            "9704", 
            qty, 
            basePriceUnit.toFixed(2), // Rate (Excl.)
            "5%", 
            rowTotalIncl.toFixed(2)   // Amount (Incl.)
          ];
      });

      autoTable(doc, {
          startY: 70,
          head: [['#', 'Item & Description', 'HSN', 'Qty', 'Rate (Excl.)', 'IGST', 'Amount (Incl.)']],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [188, 0, 45] },
          styles: { fontSize: 8 }
      });

      // --- TOTALS & SUBSIDY SECTION ---
      const finalY = doc.lastAutoTable.finalY + 10;
      
      const userCountry = (addr.country || "India").trim().toLowerCase();
      const isIndia = userCountry === 'india';
      
      // Fetch dynamic fee from order object
      const shippingCharge = order.deliveryFee !== undefined ? Number(order.deliveryFee) : (isIndia ? 125 : 750); 
      
      const couponDiscount = Number(order.discountAmount || 0);
      const pointsDiscount = Number(order.pointsUsed || 0) / 10;
      const finalPayable = Number(order.amount || 0);

      autoTable(doc, {
          startY: finalY,
          margin: { left: 110 }, 
          tableWidth: 85,
          theme: 'plain', 
          styles: { fontSize: 8, cellPadding: 2 },
          body: [
              ['Sub-Total (Base Items)', `Rs. ${totalBaseAmount.toFixed(2)}`],
              ['IGST (5%)', `Rs. ${totalGSTAmount.toFixed(2)}`],
              [`Shipping Charge (${isIndia ? 'Domestic' : 'Global'})`, `Rs. ${shippingCharge.toFixed(2)}`],
              // Negative subsidy to cancel out the GST
              [{ 
                  content: 'Exclusive GST Subsidy (Shop Discount)', 
                  styles: { textColor: [0, 128, 0], fontStyle: 'italic' } 
              }, `Rs. -${totalGSTAmount.toFixed(2)}`],
              [`Coupon Discount [${order.couponUsed || 'N/A'}]`, `Rs. -${couponDiscount.toFixed(2)}`],
              [`Archive Credit [${order.pointsUsed || 0} PTS]`, `Rs. -${pointsDiscount.toFixed(2)}`],
              [{ 
                  content: 'Final Payable Amount', 
                  styles: { fontStyle: 'bold', fontSize: 10, textColor: [188, 0, 45], borderTop: [0.1, 188, 0, 45] } 
              }, 
              { 
                  content: `Rs. ${finalPayable.toFixed(2)}`, 
                  styles: { fontStyle: 'bold', fontSize: 10, textColor: [188, 0, 45], borderTop: [0.1, 188, 0, 45] } 
              }]
          ],
          columnStyles: { 1: { halign: 'right' } }
      });

      // --- FOOTER ---
      const summaryY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(8);
      doc.text("BANKING DETAILS: HDFC Bank | A/c: 01868730000112 | IFSC: HDFC0000186", 14, summaryY);
      doc.save(`PhilaBasket_Invoice_${order.orderNo}.pdf`);
  } catch (err) {
      console.error(err);
      toast.error("Invoice generation failed.");
  }
};

const [submittedOrderIds, setSubmittedOrderIds] = useState([]);

const fetchFeedbackStatus = useCallback(async () => {
    try {
        const response = await axios.get(`${backendUrl}/api/feedback/user-feedback`, { 
            headers: { token } 
        });
        if (response.data.success) {
            setSubmittedOrderIds(response.data.feedbacks);
        }
    } catch (error) {
        console.error("Feedback Status Error:", error);
    }
}, [backendUrl, token]);

useEffect(() => {
    if (token) fetchFeedbackStatus();
}, [token, fetchFeedbackStatus]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to terminate this acquisition protocol?")) return;
    try {
        const response = await axios.post(`${backendUrl}/api/order/cancel`, { orderId }, { headers: { token } });
        if (response.data.success) {
            toast.success(response.data.message);
            loadOrderData();
        } else {
            toast.error(response.data.message);
        }
    } catch (error) {
        toast.error("Registry connection failed.");
    }
  };

  const handleTrackAsset = (trackingNumber) => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    toast.info("ID Secured to Clipboard. Opening Registry...");
    setTimeout(() => {
        window.open(`https://t.17track.net/en#nums=${trackingNumber}`, "_blank");
    }, 600);
  };

  const processedOrders = useMemo(() => {
    return [...rawOrders].reverse().map((order) => ({
      ...order,
      rewardPoints: Math.floor((order.amount || 0) * 0.10),
      formattedDate: new Date(order.date).toDateString()
    }));
  }, [rawOrders]);

  if (loading) return (
    <div className='min-h-screen bg-[#FCF9F4] flex items-center justify-center'>
      <RefreshCw className='animate-spin text-[#BC002D]' size={32} />
    </div>
  );

  return (
    <div className='bg-[#FCF9F4] min-h-screen pt-24 pb-20 px-6 md:px-16 lg:px-24 text-black select-none animate-fade-in'>
      
      {/* STATS HEADER */}
      <div className='max-w-6xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-white border border-black/5 p-4 rounded-sm'>
          <p className='text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1'>Total Consignments</p>
          <p className='text-2xl font-black tracking-tighter'>{processedOrders.length}</p>
        </div>
        <div className='bg-white border border-black/5 p-4 rounded-sm'>
          <p className='text-[8px] text-[#BC002D] font-black uppercase tracking-widest mb-1'>Delivered Units</p>
          <p className='text-2xl font-black tracking-tighter'>{processedOrders.filter(o => o.status === 'Delivered').length}</p>
        </div>
        <div className='bg-white border border-black/5 p-4 rounded-sm hidden md:block'>
          <p className='text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1'>Active Transit</p>
          <p className='text-2xl font-black tracking-tighter'>{processedOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}</p>
        </div>
        <div className='bg-white border border-black/5 p-4 rounded-sm hidden md:block'>
          <p className='text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1'>Total Ledger Value</p>
          <p className='text-2xl font-black tracking-tighter'>₹{processedOrders.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className='text-3xl mb-12 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
           <Title text1={'CONSIGNMENT'} text2={'LEDGER'} />
           {syncing && <RefreshCw size={16} className='animate-spin text-[#BC002D]' />}
        </div>
      </div>

      {/* --- PAYMENT PROTOCOL MODAL --- */}
      {showPaymentInfo && (
        <div className='fixed inset-0 z-[6000] flex items-center justify-center p-6'>
          <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={() => setShowPaymentInfo(false)}></div>
          <div className='bg-white w-full max-w-lg relative z-10 p-8 rounded-sm shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]'>
            <div className='flex justify-between items-center mb-6 border-b border-black/5 pb-4'>
              <h3 className='font-black uppercase tracking-widest text-sm'>Payment Protocol Details</h3>
              <X className='cursor-pointer' onClick={() => setShowPaymentInfo(false)} />
            </div>
            <div className='space-y-6'>
              <div className='bg-[#FCF9F4] p-5 border border-black/5'>
                  <div className='flex items-center gap-2 mb-4'>
                      <Landmark size={16} className='text-[#BC002D]' />
                      <p className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>Bank Ledger Details</p>
                  </div>
                  <div className='text-[11px] font-bold space-y-2 uppercase'>
                      <p className='flex justify-between'><span>A/C Name:</span> <span className='text-black'>PhilaBasket.com</span></p>
                      <p className='flex justify-between'><span>Bank:</span> <span className='text-black'>ICICI Bank</span></p>
                      <p className='flex justify-between'><span>A/C Number:</span> <span className='text-black'>072105001250</span></p>
                      <p className='flex justify-between'><span>IFSC:</span> <span className='text-black'>ICIC0000721</span></p>
                  </div>
              </div>
              <div className='bg-[#FCF9F4] p-5 border border-black/5'>
                  <div className='flex items-center gap-2 mb-4'>
                      <Smartphone size={16} className='text-[#BC002D]' />
                      <p className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>UPI Protocol</p>
                  </div>
                  <p className='text-[11px] font-bold uppercase'>Google Pay / PhonePe: <span className='text-black font-black'>9999167799</span></p>
              </div>
              <div className='bg-white p-5 border border-dashed border-gray-200'>
                  <div className='flex items-center gap-2 mb-4'>
                      <MapPin size={16} className='text-[#BC002D]' />
                      <p className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>Mailing Address</p>
                  </div>
                  <div className='text-[11px] font-bold space-y-1 uppercase leading-relaxed text-gray-600'>
                      <p className='text-black'>PhilaBasket.com</p>
                      <p>C/O Bhavyansh Prakhar Rastogi, S–606/607 School Block–2, Park End Apartment, ShakarPur-110092, Delhi (India)</p>
                      <p className='mt-2 flex items-center gap-2 font-black italic'><Mail size={12}/> admin@philabasket.com</p>
                  </div>
              </div>
            </div>
            <button onClick={() => setShowPaymentInfo(false)} className='w-full mt-8 bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#BC002D] transition-all'>Acknowledge</button>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className='fixed inset-0 z-[5000] flex items-center justify-center p-6'>
          <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={() => setShowFeedbackModal(false)}></div>
          <div className='bg-white w-full max-w-lg relative z-10 p-8 rounded-sm shadow-2xl animate-fade-in'>
             <div className='flex justify-between items-center mb-6'>
                <h3 className='font-black uppercase tracking-widest text-sm'>Consignment Feedback</h3>
                <p className='text-[10px] font-bold text-[#BC002D]'>REGISTRY ID: #{currentOrder?.orderNo}</p>
                <X className='cursor-pointer' onClick={() => setShowFeedbackModal(false)} />
             </div>
             <form onSubmit={handleFeedbackSubmit} className='flex flex-col gap-6'>
                <div className='flex flex-col items-center gap-2 py-4 border-b border-gray-50'>
                   <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Specimen Grade</p>
                   <div className='flex items-center gap-2'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" className='transition-transform hover:scale-125' onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
                          <Star size={24} className={`transition-colors ${(hoverRating || rating) >= star ? 'fill-[#BC002D] text-[#BC002D]' : 'text-gray-200'}`} />
                        </button>
                      ))}
                   </div>


                   {/* --- IMAGE UPLOAD SECTION --- */}
<div className='flex flex-col gap-3'>
    <p className='text-[10px] font-black uppercase tracking-widest text-gray-400'>Upload Specimen Photo (Optional)</p>
    <div className='flex items-center gap-4'>
        <label className='flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#BC002D] transition-colors'>
            {feedbackImage ? (
                <div className='relative w-full h-full p-1'>
                    <img 
                        src={URL.createObjectURL(feedbackImage)} 
                        alt="Preview" 
                        className='w-full h-full object-cover rounded-md' 
                    />
                    <div className='absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5' onClick={(e) => { e.preventDefault(); setFeedbackImage(null); }}>
                        <X size={12} />
                    </div>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center'>
                    <Camera size={20} className='text-gray-300' />
                    <span className='text-[8px] font-bold text-gray-400 mt-1'>ADD PHOTO</span>
                </div>
            )}
            <input 
                type="file" 
                accept="image/*" 
                className='hidden' 
                onChange={(e) => setFeedbackImage(e.target.files[0])} 
            />
        </label>
        
        {feedbackImage && (
            <p className='text-[10px] font-bold text-green-600 uppercase italic'>
                Specimen Image Ready for Sync
            </p>
        )}
    </div>
</div>

{/* <textarea 
    className='w-full border border-gray-100 p-4 text-xs outline-none focus:border-[#BC002D]' 
    rows="3" 
    placeholder="Describe quality..." 
    value={feedbackText} 
    onChange={(e) => setFeedbackText(e.target.value)}
></textarea> */}

                </div>
                <textarea className='w-full border border-gray-100 p-4 text-xs outline-none focus:border-[#BC002D]' rows="4" placeholder="Describe quality..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}></textarea>
                <button type="submit" disabled={submitting} className='bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#BC002D] transition-all disabled:bg-gray-400'>
                  {submitting ? <RefreshCw className='animate-spin' size={14} /> : "Submit to Archive"}
                </button>
             </form>
          </div>
        </div>
      )}

      <div className='max-w-6xl mx-auto'>
        {processedOrders.length === 0 ? (
          <div className='py-32 text-center bg-white border border-black/5'><p className='text-gray-400 font-serif uppercase tracking-[0.2em]'>Registry is empty</p></div>
        ) : (
          processedOrders.map((order) => (
            <div key={order._id} className='py-8 border border-black/5 bg-white flex flex-col gap-6 px-8 mb-8 rounded-sm shadow-sm hover:border-[#BC002D]/30 transition-all duration-500'>
              <div className='flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-4'>
                <div className='flex items-center gap-6'>
                    <div><p className='text-[8px] text-gray-400 uppercase tracking-widest font-black'>Registry ID</p><span className='text-sm font-mono font-bold text-black'>#{order.orderNo}</span></div>
                    <div className='flex items-center gap-3'><div className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'Delivered' ? 'bg-green-500' : order.status === 'Cancelled' ? 'bg-gray-400' : 'bg-[#BC002D]'}`}></div><p className='text-xs font-black tracking-[0.4em] uppercase text-black'>{order.status}</p></div>
                </div>
                <div className='flex flex-wrap items-center gap-6'>
                    {(order.paymentMethod === 'Direct Bank Transfer' || order.paymentMethod === 'Cheque' || order.status === 'On Hold') && (
                        <button onClick={() => { setSelectedOrderInfo(order); setShowPaymentInfo(true); }} className='flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 hover:underline'><Landmark size={14} /> Payment Info</button>
                    )}
                    {order.status === 'Order Placed' && <button onClick={() => cancelOrder(order._id)} className='text-[10px] font-black uppercase text-red-500 hover:bg-red-50 px-3 py-2'>Cancel Order</button>}
                    
                    
                    {/* <button onClick={() => { setCurrentOrder(order); setShowFeedbackModal(true); }} className='flex items-center gap-2 text-[10px] font-black uppercase text-gray-400'><MessageSquare size={14} /> Feedback</button> */}
                    {submittedOrderIds.includes(order._id) ? (
    <div className='flex items-center gap-2 text-[10px] font-black uppercase text-green-600 cursor-default py-2 px-3 bg-green-50 rounded-sm'>
        <PackageCheck size={14} /> 
        Feedback Recieved
    </div>
) : (
    <button 
        onClick={() => { setCurrentOrder(order); setShowFeedbackModal(true); }} 
        className='flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-[#BC002D] transition-colors'
    >
        <MessageSquare size={14} /> 
        Feedback
    </button>
)}
                    {/* <button onClick={() => downloadInvoice(order)} className='flex items-center gap-2 text-[10px] font-black uppercase text-[#BC002D]'><Download size={14} /> Invoice</button> */}
                    {order.allowInvoice ? (
        <button 
            onClick={() => downloadInvoice(order)} 
            className='flex items-center gap-2 text-[10px] font-black uppercase text-[#BC002D] hover:opacity-80 transition-all'
        >
            <Download size={14} /> 
            Invoice
        </button>
    ) : (
        <div 
            className='flex items-center gap-2 text-[10px] font-black uppercase text-gray-300 cursor-not-allowed'
            title="Invoice will be available once the consignment is verified by the admin."
        >
            {/* <Download size={14} /> 
            Invoice Pending */}
        </div>
    )}
                </div>
              </div>
              <div className='flex flex-col gap-6'>
                {order.items.map((item, idx) => (
                  <div key={idx} className='flex items-center gap-6'>
                    <div className='w-16 h-20 bg-[#F9F9F9] border border-black/5 flex items-center justify-center shrink-0'><img src={item.image?.[0] || assets.logo} alt="" className='w-full h-full object-contain p-1' /></div>
                    <div className='flex-1'><p className='text-md font-serif text-black tracking-tight'>{item.name}</p><div className='flex items-center gap-4 mt-1'><p className='text-[10px] text-gray-400 uppercase font-black'>Quantity: {item.quantity}</p><p className='text-[10px] text-gray-400 uppercase font-black'>{order.formattedDate}</p></div></div>
                  </div>
                ))}
              </div>
              <div className='bg-[#FCF9F4] p-6 rounded-sm flex flex-col lg:flex-row items-center justify-between gap-6'>
                <div className='flex flex-wrap items-center gap-8'>
                  <div><p className='text-[8px] text-[#BC002D] font-black uppercase tracking-[0.3em] mb-1'>Ledger Value</p><p className='text-xl font-black tracking-tighter'>₹{order.amount.toFixed(2)}</p></div>
                  <div className={`flex items-center gap-2 py-2 px-4 border rounded-sm ${order.status === 'Delivered' ? 'border-green-100 bg-green-50' : 'border-[#BC002D]/10 bg-white'}`}><PackageCheck size={14} className={order.status === 'Delivered' ? 'text-green-600' : 'text-[#BC002D]'} /><p className='text-[10px] font-black uppercase tracking-widest text-black'>Vault Credit: +{order.rewardPoints} PTS</p></div>
                </div>
                <div className='flex gap-4 w-full lg:w-auto'>
                  {order.trackingNumber && <button onClick={() => handleTrackAsset(order.trackingNumber)} className='flex-1 lg:flex-none bg-black text-white px-8 py-4 text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2'><Truck size={14} /> Track Asset <ExternalLink size={10} /></button>}
                  <button onClick={() => loadOrderData(true)} className='flex-1 lg:flex-none bg-white border border-black/10 px-8 py-4 text-[9px] font-black uppercase tracking-[0.4em]'>Refresh</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;