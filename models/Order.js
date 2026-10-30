const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    stripeSessionId: { type: String, required: true, unique: true },
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: String,
        address: { type: String, required: true },
        city: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true }
    },
    items: [{
        productId: Number,
        name: String,
        collection: String,
        price: Number,
        quantity: Number
    }],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);