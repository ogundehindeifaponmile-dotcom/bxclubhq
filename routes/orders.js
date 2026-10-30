const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { sendOrderNotification, sendCustomerConfirmation } = require('../config/mailer');

// Create Stripe Checkout Session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, customer } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    metadata: { productId: item.id, collection: item.collection }
                },
                unit_amount: Math.round(item.price * 100), // Stripe uses cents
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: customer?.email,
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'AE', 'SA']
            },
            line_items: lineItems,
            success_url: `${process.env.CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/?cancelled=true`,
            metadata: {
                customerName: customer?.name || '',
                customerPhone: customer?.phone || ''
            }
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Stripe Webhook — fires when payment succeeds
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Avoid duplicate processing
        const existing = await Order.findOne({ stripeSessionId: session.id });
        if (existing) return res.json({ received: true });

        // Fetch line items for full product details
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        const order = new Order({
            stripeSessionId: session.id,
            customer: {
                name: session.customer_details?.name || session.metadata?.customerName || 'Guest',
                email: session.customer_details?.email,
                phone: session.customer_details?.phone || session.metadata?.customerPhone,
                address: session.shipping_details?.address?.line1,
                city: session.shipping_details?.address?.city,
                zip: session.shipping_details?.address?.postal_code,
                country: session.shipping_details?.address?.country
            },
            items: lineItems.data.map(li => ({
                productId: parseInt(li.metadata?.productId) || 0,
                name: li.description,
                collection: li.metadata?.collection || '',
                price: li.amount_total / 100 / li.quantity,
                quantity: li.quantity
            })),
            total: session.amount_total / 100,
            status: 'paid',
            paidAt: new Date()
        });

        await order.save();

        // Notify company + customer
        await sendOrderNotification(order);
        await sendCustomerConfirmation(order);

        console.log(`💾 Order saved: ${order._id}`);
    }

    res.json({ received: true });
});

// Get order by session ID (for success page)
router.get('/session/:sessionId', async (req, res) => {
    try {
        const order = await Order.findOne({ stripeSessionId: req.params.sessionId });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;