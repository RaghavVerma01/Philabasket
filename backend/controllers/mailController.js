import nodemailer from 'nodemailer';
import 'dotenv/config'
import userModel from '../models/userModel.js';
import subscriberModel from '../models/subscriberModel.js';

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Your 16-digit App Password (NOT your login pass)
    },

});





// Generic Bulk Mail Function
export const sendBulkMail = async (req, res) => {
    try {
        const { target, subject, message, excludedEmails, selectedIds, bannerImage, templateType } = req.body;
        let finalRecipients = [];

        // 1. SMART AUDIENCE RETRIEVAL
        if (target === 'customers') {
            if (selectedIds && selectedIds.length > 0) {
                // WHITELIST MODE: Explicitly selected users (Highly efficient for small groups)
                const users = await userModel.find({ 
                    _id: { $in: selectedIds } 
                }, 'email');
                finalRecipients = users.map(u => u.email);
            } else {
                // BLACKLIST MODE: Everyone except excluded IDs (Used for mass dispatch)
                const users = await userModel.find({ 
                    _id: { $nin: excludedEmails || [] } 
                }, 'email');
                finalRecipients = users.map(u => u.email);
            }
        } 
        else if (target === 'subscribers') {
            const subs = await subscriberModel.find({ 
                email: { $nin: excludedEmails || [] } 
            }, 'email');
            finalRecipients = subs.map(s => s.email);
        }

        // 2. SAFETY CHECK
        if (finalRecipients.length === 0) {
            return res.json({ success: false, message: "No recipients found in the targeted segment." });
        }

        // 3. Template Generation
        // const isDark = templateType === 'dark';
       // --- NEW & IMPROVED TEMPLATE GENERATION ---
const accentColor = "#BC002D"; // PhilaBasket Red
const isDark = templateType === 'dark';
const bgColor = isDark ? '#111111' : '#F9FAFB';
const cardColor = isDark ? '#1A1A1A' : '#FFFFFF';
const textColor = isDark ? '#EEEEEE' : '#374151';
const secondaryText = isDark ? '#9CA3AF' : '#6B7280';

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgColor}; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: ${cardColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid ${isDark ? '#333' : '#E5E7EB'};">
                    
                    <tr>
                        <td align="center" style="padding: 30px 0; border-bottom: 1px solid ${isDark ? '#333' : '#F3F4F6'};">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 4px; color: ${accentColor}; text-transform: uppercase;">PhilaBasket</h1>
                            <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 700; color: ${secondaryText}; letter-spacing: 2px; text-transform: uppercase;">Global Philatelic Registry</p>
                        </td>
                    </tr>

                    ${bannerImage ? `
                    <tr>
                        <td style="padding: 0;">
                            <img src="${bannerImage}" width="600" style="width: 100%; max-width: 600px; height: auto; display: block; object-fit: cover;" alt="Newsletter Banner" />
                        </td>
                    </tr>
                    ` : ''}

                    <tr>
                        <td style="padding: 40px 50px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 800; color: ${isDark ? '#FFFFFF' : '#111827'}; line-height: 1.2;">
                                ${subject}
                            </h2>
                            <div style="font-size: 16px; line-height: 1.8; color: ${textColor}; font-weight: 400;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>

                            <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 35px;">
                                <tr>
                                    <td align="center" bgcolor="${accentColor}" style="border-radius: 6px;">
                                        <a href="https://new.philabasket.in/collection" target="_blank" style="padding: 14px 28px; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; display: inline-block; text-transform: uppercase; letter-spacing: 1.5px;">Explore Collection</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 30px 50px; background-color: ${isDark ? '#151515' : '#FDFDFD'}; border-top: 1px solid ${isDark ? '#333' : '#F3F4F6'};">
                            <p style="margin: 0; font-size: 11px; color: ${secondaryText}; line-height: 1.6;">
                                &copy; ${new Date().getFullYear()} PhilaBasket Registry. All Rights Reserved.<br>
                                Patna 800001, Bihar, India.
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 10px; color: ${secondaryText}; text-transform: uppercase; letter-spacing: 1px;">
                                You are receiving this as a verified member of the Registry Archive.
                            </p>
                        </td>
                    </tr>
                </table>

                <table width="600" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding: 20px; font-size: 11px; color: ${secondaryText};">
                            <a href="#" style="color: ${accentColor}; text-decoration: none; font-weight: 700;">Unsubscribe from Registry Alerts</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

        // 4. Dispatch
        const BATCH_SIZE = 100;
        let totalSent = 0;

        for (let i = 0; i < finalRecipients.length; i += BATCH_SIZE) {
            const currentBatch = finalRecipients.slice(i, i + BATCH_SIZE);
            
            await transporter.sendMail({
                from: `"PhilaBasket Registry" <${process.env.EMAIL_USER}>`,
                bcc: currentBatch,
                subject: subject,
                html: htmlContent,
            });

            totalSent += currentBatch.length;
            console.log(`Mission Progress: ${totalSent}/${finalRecipients.length} Dispatched.`);
            
            // 500ms cooldown to keep SMTP health high
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        res.json({ 
            success: true, 
            message: `Strategic dispatch successful. ${totalSent} collectors notified.` 
        });

    } catch (error) {
        console.error("Mail Dispatch Error:", error);
        res.json({ success: false, message: "Registry transmission failed: " + error.message });
    }
};