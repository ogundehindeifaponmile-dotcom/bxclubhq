require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const ordersRouter = require('./routes/orders');

const app = express();

// Connect to MongoDB Atlas (Cloud)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/orders', ordersRouter);

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🖤 BXCLUB server running on port ${PORT}`);
});