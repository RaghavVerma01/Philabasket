import settingsModel from "../models/settingModel.js";

/**
 * GET SETTINGS
 * Initializes with the 4 fee options and toggles if empty.
 */
export const getSettings = async (req, res) => {
    try {
        let settings = await settingsModel.findOne({});

        if (!settings) {
            settings = await settingsModel.create({ 
                rate: 83, 
                indiaFee: 125, 
                indiaFeeFast: 250,      // New
                globalFee: 750, 
                globalFeeFast: 1500,    // New
                isIndiaFastActive: false, // On/Off Switch
                isGlobalFastActive: false // On/Off Switch
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
 * Saves the 4 fees and the 2 active toggles.
 */
export const updateSettings = async (req, res) => {
    try {
        const { 
            rate, 
            indiaFee, 
            indiaFeeFast, 
            globalFee, 
            globalFeeFast, 
            isIndiaFastActive, 
            isGlobalFastActive 
        } = req.body;

        const updatedData = {
            rate: Number(rate),
            indiaFee: Number(indiaFee),
            indiaFeeFast: Number(indiaFeeFast),
            globalFee: Number(globalFee),
            globalFeeFast: Number(globalFeeFast),
            // Booleans don't need Number() conversion
            isIndiaFastActive: !!isIndiaFastActive, 
            isGlobalFastActive: !!isGlobalFastActive 
        };

        if (Object.values(updatedData).filter(v => typeof v === 'number').some(val => isNaN(val))) {
            return res.json({ success: false, message: "Registry Error: Invalid numeric data." });
        }

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
        res.json({ success: false, message: error.message });
    }
};