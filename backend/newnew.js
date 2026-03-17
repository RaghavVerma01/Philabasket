import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import orderModel from './models/orderModel.js'; // Ensure path is correct

dotenv.config();

const syncFromCsv = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce`)

        console.log("Connected to PhilaBasket Registry...");

        const results = [];
        // Use the updated CSV file generated in the previous step
        fs.createReadStream('/Users/parthpankajsingh/Desktop/ML Projects/test/e-commerce.orders_updated.csv')
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Parsing ${results.length} orders for synchronization...`);

                const bulkOps = [];

                for (const row of results) {
                    const orderNo = parseInt(row.orderNo);
                    if (!orderNo) continue;

                    // Reconstruct the items array from the flattened CSV columns
                    const items = [];
                    let i = 0;
                    while (row[`items[${i}].name`]) {
                        items.push({
                            name: row[`items[${i}].name`],
                            price: parseFloat(row[`items[${i}].price`]) || 0,
                            quantity: parseInt(row[`items[${i}].quantity`]) || 1
                        });
                        i++;
                    }

                    // Calculate the new total amount (including delivery fee)
                    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    const deliveryFee = parseFloat(row.deliveryFee) || 0;
                    const finalAmount = subtotal + deliveryFee;

                    // Prepare the bulk update operation
                    bulkOps.push({
                        updateOne: {
                            filter: { orderNo: orderNo },
                            update: { 
                                $set: { 
                                    items: items,
                                    amount: finalAmount
                                } 
                            }
                        }
                    });

                    // Execute in batches of 500 for memory efficiency
                    if (bulkOps.length === 500) {
                        await orderModel.bulkWrite(bulkOps);
                        bulkOps.length = 0;
                        console.log(`Synced 500 orders...`);
                    }
                }

                // Final batch
                if (bulkOps.length > 0) {
                    await orderModel.bulkWrite(bulkOps);
                }

                console.log("✨ Registry Prices Synced Successfully!");
                mongoose.connection.close();
                process.exit(0);
            });
    } catch (error) {
        console.error("❌ Sync Error:", error);
        process.exit(1);
    }
};

syncFromCsv();