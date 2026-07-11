const PushNotification = require('../models/PushNotification');
const Patient = require('../models/Patient');
const admin = require('firebase-admin');

// Create a new push notification
const createPushNotification = async (req, res) => {
    try {
        const { title, description, fromDate, toDate, image, activeStatus, role } = req.body;

        const pushNotification = new PushNotification({
            title,
            description,
            fromDate,
            toDate,
            image,
            activeStatus: activeStatus || false,
            role: role || 'admin'
        });

        await pushNotification.save();

        // If active, broadcast to all patients
        if (activeStatus) {
            await broadcastToPatients(title, description);
        }

        res.status(201).json({ message: "Push notification created successfully", data: pushNotification });
    } catch (error) {
        console.error("Error creating push notification:", error);
        res.status(500).json({ message: "Failed to create push notification", error: error.message });
    }
};

// Get all push notifications (for Admin/Doctor)
const getAllPushNotifications = async (req, res) => {
    try {
        const notifications = await PushNotification.find({}).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching push notifications:", error);
        res.status(500).json({ message: "Failed to fetch push notifications", error: error.message });
    }
};

// Get active push notifications (for Patient App)
const getActivePushNotifications = async (req, res) => {
    try {
        const notifications = await PushNotification.find({ activeStatus: true }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching active push notifications:", error);
        res.status(500).json({ message: "Failed to fetch active push notifications", error: error.message });
    }
};

// Update a push notification
const updatePushNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Prevent changing id
        delete updateData.id;

        const updated = await PushNotification.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updated) {
            return res.status(404).json({ message: "Push notification not found" });
        }

        // If changed to active, we might want to broadcast again (optional, depending on logic)
        // Here we just update the record.

        res.status(200).json({ message: "Push notification updated successfully", data: updated });
    } catch (error) {
        console.error("Error updating push notification:", error);
        res.status(500).json({ message: "Failed to update push notification", error: error.message });
    }
};

// Delete a push notification
const deletePushNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await PushNotification.findByIdAndDelete(id);
        res.status(200).json({ message: "Push notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting push notification:", error);
        res.status(500).json({ message: "Failed to delete push notification", error: error.message });
    }
};

// Helper function to broadcast to all patients
const broadcastToPatients = async (title, body) => {
    try {
        const patients = await Patient.find({});
        const tokens = patients.map(p => p.fcmToken).filter(token => token && typeof token === 'string' && token.trim() !== '');

        if (tokens.length === 0) {
            console.log("No patient FCM tokens found for broadcast.");
            return;
        }

        // Send multicast message
        // Firebase admin.messaging().sendMulticast accepts max 500 tokens at a time
        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
            const chunk = tokens.slice(i, i + chunkSize);
            const message = {
                tokens: chunk,
                notification: {
                    title: title,
                    body: body
                },
                data: {
                    type: 'push_notification'
                }
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log(`Broadcast chunk sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
        }
    } catch (error) {
        console.error("Error broadcasting to patients:", error);
    }
};

module.exports = {
    createPushNotification,
    getAllPushNotifications,
    getActivePushNotifications,
    updatePushNotification,
    deletePushNotification
};
