const getOrderHtmlTemplate = (orderData, activeFee = null, trackingNumber = null) => {
    // Destructure orderData
    const { 
        address, 
        items, 
        amount, 
        currency, 
        paymentMethod, 
        orderNo, 
        date, 
        pointsUsed, 
        couponUsed, 
        discountAmount,
        deliveryFee 
    } = orderData;

    const symbol = currency === 'USD' ? '$' : '₹';
    const accentColor = "#BC002D"; 
    const secondaryColor = "#1a1a1a";
    const bgColor = "#FCF9F4";

    // --- LOGIC CALCULATIONS ---
    const rawSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gstAmount = rawSubtotal * 0.05;
    const pbExclusiveDiscount = rawSubtotal * 0.05;
    const pointsValue = pointsUsed ? pointsUsed / 10 : 0; 

    // --- PROTOCOL FEE RESOLUTION ---
    // Priority: 1. Explicitly passed activeFee | 2. Stored deliveryFee | 3. Hard fallback
    const finalFee = activeFee !== null ? activeFee : (deliveryFee || 0);
    const displayShipping = Number(finalFee).toFixed(2);
// --- SHIPPING FEE DISPLAY LOGIC ---
const isFreeShipping = currency === 'INR' && amount >= 4999;
const shippingDisplayValue = isFreeShipping 
    ? `<span style="color: #2e7d32; font-weight: 900;">COMPLIMENTARY</span>` 
    : `${symbol}${displayShipping}`;

// ... inside the return template table ...


    const itemRows = items.map(item => `
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 12px 0;">
                <p style="margin: 0; font-weight: bold; color: ${secondaryColor}; font-size: 14px;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #888; font-size: 11px; text-transform: uppercase;">Specimen ID: ${item._id.toString().slice(-6)}</p>
            </td>
            <td style="padding: 12px 0; text-align: center; color: ${secondaryColor}; font-weight: bold;">x${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; color: ${accentColor}; font-weight: bold;">${symbol}${item.price.toFixed(2)}</td>
        </tr>`).join('');

    return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${secondaryColor};">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgColor}; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        <tr>
                            <td style="background-color: ${accentColor}; padding: 40px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900;">PhilaBasket</h1>
                                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">The World of Philately</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 15px 0; font-size: 20px;">Order ${trackingNumber ? 'Dispatched' : 'Confirmed'}</h2>
                                <p style="font-size: 15px; color: #555; line-height: 1.6;">Hi ${address.firstName},</p>
                                <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                    ${trackingNumber 
                                        ? `Your philatelic acquisition has been dispatched. Track ID: <strong>${trackingNumber}</strong>.` 
                                        : `Your acquisition request has been received. Our curators are currently authenticating your specimens.`}
                                </p>

                                <table width="100%" style="margin: 25px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 15px 0;">
                                    <tr>
                                        <td><span style="font-size: 11px; color: #999; text-transform: uppercase;">Registry ID</span><br><strong>#${orderNo}</strong></td>
                                        <td align="right"><span style="font-size: 11px; color: #999; text-transform: uppercase;">Acquisition Date</span><br><strong>${new Date(date).toLocaleDateString()}</strong></td>
                                    </tr>
                                </table>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                    <thead>
                                        <tr style="text-align: left; font-size: 11px; color: #999; text-transform: uppercase;">
                                            <th style="padding-bottom: 10px;">Specimen</th>
                                            <th style="padding-bottom: 10px; text-align: center;">Qty</th>
                                            <th style="padding-bottom: 10px; text-align: right;">Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody>${itemRows}</tbody>
                                </table>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                                    <tr>
                                        <td width="70%" style="padding: 4px 0; font-size: 13px; color: #777;">Asset Subtotal</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold;">${symbol}${rawSubtotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #777;">GST Protocol (5%)</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold;">${symbol}${gstAmount.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">Exclusive PB Discount (5%)</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">- ${symbol}${pbExclusiveDiscount.toFixed(2)}</td>
                                    </tr>
                                    
                                    ${discountAmount > 0 ? `
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">Coupon Applied (${couponUsed})</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">- ${symbol}${discountAmount.toFixed(2)}</td>
                                    </tr>` : ''}

                                    ${pointsUsed > 0 ? `
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: ${accentColor}; font-weight: bold;">Archive Credit Redemption (${pointsUsed} PTS)</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; color: ${accentColor}; font-weight: bold;">- ${symbol}${pointsValue.toFixed(2)}</td>
                                    </tr>` : ''}

                                    <tr>
    <td style="padding: 4px 0; font-size: 13px; color: #777;">Registry Shipping Fee (${address.country})</td>
    <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold;">
        ${shippingDisplayValue}
    </td>
</tr>
                                    <tr>
                                        <td style="padding: 15px 0 5px 0; font-size: 16px; font-weight: 900; text-transform: uppercase; border-top: 2px solid ${secondaryColor};">Final Asset Valuation</td>
                                        <td align="right" style="padding: 15px 0 5px 0; font-size: 18px; font-weight: 900; color: ${accentColor}; border-top: 2px solid ${secondaryColor};">${symbol}${amount.toLocaleString()}</td>
                                    </tr>
                                </table>
                                <table width="100%" style="margin-top: 30px;">
                                    <tr>
                                        <td width="50%" valign="top">
                                            <h4 style="margin: 0 0 10px 0; font-size: 11px; color: #999; text-transform: uppercase;">Shipping Registry</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.5;">
                                                ${address.firstName} ${address.lastName}<br>
                                                ${address.street}<br>
                                                ${address.city}, ${address.state} ${address.zipcode}
                                            </p>
                                        </td>
                                        <td width="50%" valign="top">
                                            <h4 style="margin: 0 0 10px 0; font-size: 11px; color: #999; text-transform: uppercase;">Payment Protocol</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.5;">${paymentMethod}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};