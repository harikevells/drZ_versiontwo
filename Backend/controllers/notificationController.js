const Notification = require('../models/Notification');

// Create a new notification
const createNotification = async (role, identifier, title, message, type = 'info') => {
    try {
        const notification = new Notification({
            role,
            identifier,
            title,
            message,
            type,
            isRead: false
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// Get notifications for a user/role
const getNotifications = async (req, res) => {
    try {
        const { role, identifier } = req.params;
        
        const notifications = await Notification.find({ role, identifier })
                                              .sort({ createdAt: -1 })
                                              .limit(50);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Failed to update notification", error: error.message });
    }
};

// Mark all as read for a specific user
const markAllAsRead = async (req, res) => {
    try {
        const { role, identifier } = req.params;
        await Notification.updateMany({ role, identifier }, { isRead: true });
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update notifications", error: error.message });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};
