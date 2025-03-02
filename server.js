require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

connectDB();

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const healthRoutes = require('./routes/healthRoutes');

app.use('/api/projects', projectRoutes);
app.use('/api', healthRoutes);  // Add health route

// Cron job to check health every 4 minutes
cron.schedule('*/4 * * * *', async () => {
    try {
        const response = await axios.get(`https://code-fix-backend.onrender.com/api/health`);
        console.log(`Health Check: ${response.data.status} at ${response.data.timestamp}`);
    } catch (error) {
        console.error('Health check failed:', error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
