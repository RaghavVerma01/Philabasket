import orderModel from "../models/orderModel.js";
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

const exportOrders = async (req, res) => {
    try {
        const { format, dateRange, sortBy, sortOrder, statuses } = req.body;

        // 1. Build Query
        let query = {};
        if (dateRange?.start && dateRange?.end) {
            // Set start to beginning of day and end to end of day for accurate filtering
            const start = new Date(dateRange.start).setHours(0, 0, 0, 0);
            const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }
        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }

        // 2. Fetch Data
        const sortDirection = sortOrder === 'Descending' ? -1 : 1;
        const sortField = sortBy === 'Order ID' ? '_id' : 'date';
        
        const orders = await orderModel.find(query)
            .populate('userId', 'name email')
            .sort({ [sortField]: sortDirection });

        // 3. Transformation Logic (Flattening items for Line-Item Registry)
        const reportData = [];
        orders.forEach(order => {
            // For every order, iterate through its products to create individual rows
            order.items.forEach((item, index) => {
                reportData.push({
                    order: order.orderNo || order._id.toString().slice(-6).toUpperCase(),
                    first: order.address.firstName,
                    last: order.address.lastName,
                    itemNo: index + 1, // Restarts from 1 for every new order
                    itemName: item.name,
                    quantity: item.quantity,
                    itemCost: item.price
                });
            });
        });

        // 4. Format Selection Logic
        if (format === 'JSON') {
            return res.status(200).json(reportData);
        }

        if (format === 'XLSX') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Line Item Registry');

            // Define columns based on your specimen image
            worksheet.columns = [
                { header: 'Order', key: 'order', width: 15 },
                { header: 'First', key: 'first', width: 15 },
                { header: 'Last', key: 'last', width: 15 },
                { header: 'Item #', key: 'itemNo', width: 10 },
                { header: 'Item Name', key: 'itemName', width: 60 },
                { header: 'Quantity (- Refund)', key: 'quantity', width: 20 },
                { header: 'Item Cost', key: 'itemCost', width: 15 }
            ];

            // Add the flattened data
            worksheet.addRows(reportData);

            // Corporate Styling (Bank System Vibe)
            worksheet.getRow(1).font = { bold: true, size: 10 };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F2F2F2' }
            };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Registry_Export_${Date.now()}.xlsx`);

            await workbook.xlsx.write(res);
            return res.end();
        }

        if (format === 'CSV') {
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(reportData);
            res.header('Content-Type', 'text/csv');
            res.attachment(`registry-export-${Date.now()}.csv`);
            return res.send(csv);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { exportOrders };