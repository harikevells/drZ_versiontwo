const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drz');
        const users = await User.find({ role: 'admin' });
        console.log(users.map(u => ({
            name: u.name,
            email: u.email,
            isActive: u.isActive,
            accessStartDate: u.accessStartDate,
            accessStartTime: u.accessStartTime,
            accessEndDate: u.accessEndDate,
            accessEndTime: u.accessEndTime
        })));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkAdmin();
