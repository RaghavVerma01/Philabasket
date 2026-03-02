import settingsModel from "../models/settingModel.js";

/**
 * GET SETTINGS
 * Retrieves the single financial protocol document. 
 * If none exists, it initializes the database with defaults.
 */
export const getSettings = async (req, res) => {
    try {
        // Find the first document in the collection
        let settings = await settingsModel.findOne({});

        // If the collection is empty, create the initial entry
        if (!settings) {
            settings = await settingsModel.create({ 
                rate: 83, 
                indiaFee: 120, 
                globalFee: 750 
            });
        }

        res.json({ success: true, settings });
    } catch (error) {
        console.error("Fetch Settings Error:", error.message);
        res.json({ success: false, message: "Could not load Registry Protocols." });
    }
};

/**
 * UPDATE SETTINGS
 * Updates the existing document. Ensures numbers are saved correctly.
 */
export const updateSettings = async (req, res) => {
    try {
        const { rate, indiaFee, globalFee } = req.body;

        // Force convert incoming strings to Numbers to prevent CastErrors in MongoDB
        const updatedData = {
            rate: Number(rate),
            indiaFee: Number(indiaFee),
            globalFee: Number(globalFee)
        };

        // Validate that the conversion resulted in valid numbers
        if (Object.values(updatedData).some(val => isNaN(val))) {
            return res.json({ success: false, message: "Registry Error: Invalid numeric data." });
        }

        // Use findOneAndUpdate with an empty filter {} to target the singleton
        // upsert: true ensures it creates the doc if it was accidentally deleted
        // new: true returns the document AFTER the update
        const settings = await settingsModel.findOneAndUpdate(
            {}, 
            updatedData, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ 
            success: true, 
            message: "Registry Protocols Updated Successfully", 
            settings 
        });

    } catch (error) {
        console.error("Update Settings Error:", error.message);
        // This message will be caught by your frontend toast.error(res.data.message)
        res.json({ success: false, message: error.message });
    }
};