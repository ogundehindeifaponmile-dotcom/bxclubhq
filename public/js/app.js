// Product Data
const products = [
    { id: 1, name: "No. 01 Midnight Oud", collection: "lumiere", collectionName: "Lumière", price: 85, type: "candle" },
    { id: 2, name: "No. 02 Blanc Sable", collection: "lumiere", collectionName: "Lumière", price: 85, type: "candle" },
    { id: 3, name: "No. 03 Noir Fumé", collection: "lumiere", collectionName: "Lumière", price: 95, type: "candle" },
    { id: 4, name: "No. 04 Velours Blanc", collection: "lumiere", collectionName: "Lumière", price: 95, type: "candle" },
    { id: 5, name: "No. 05 Obsidian Rose", collection: "aura", collectionName: "Aura", price: 120, type: "diffuser" },
    { id: 6, name: "No. 06 Ivory Mist", collection: "aura", collectionName: "Aura", price: 120, type: "diffuser" },
    { id: 7, name: "No. 07 Onyx & Amber", collection: "aura", collectionName: "Aura", price: 140, type: "diffuser" }
];

// Cart lives in memory only (no localStorage)
let cart = [];
let currentFilter = 'all';

// Render products
function renderProducts(filter) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    const filtered = filter === 'all' ? products : products.filter(p => p.collection === filter);
    
    filtered.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`;
        const visualClass = product.type === 'candle' ? 'visual-candle' : 'visual-diffuser';
        
        card.innerHTML = `
            <div class="product-image">
                <div class="product-visual ${visualClass}"></div>
            </div>
            <div class="product-info">
                <div class="product-collection">${product.collectionName}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price}.00</div>
                <button class="add-to-bag" onclick="addToCart(${product.id})">Add to Bag</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderProducts(currentFilter);
    });
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const filter = link.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        currentFilter = filter;
        renderProducts(currentFilter);
    });
});

// Cart operations (memory only)
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });
    updateCartUI();
    toggleCart(true);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    countEl.textContent = totalQty;
    totalEl.textContent = `$${totalPrice.toFixed(2)}`;
    checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
        itemsEl.innerHTML = '<div class="empty-cart">Your bag is currently empty.</div>';
        return;
    }

    itemsEl.innerHTML = cart.map(item => {
        const visualClass = item.type === 'candle' ? 'visual-candle' : 'visual-diffuser';
        return `
            <div class="cart-item">
                <div class="cart-item-img">
                    <div class="mini-visual ${visualClass}"></div>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price}.00 × ${item.qty}</div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleCart(forceOpen = false) {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (forceOpen) {
        overlay.classList.add('active');
        drawer.classList.add('active');
    } else {
        overlay.classList.toggle('active');
        drawer.classList.toggle('active');
    }
}

// Stripe Checkout
async function handleCheckout() {
    if (cart.length === 0) return;

    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';

    const payload = {
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            collection: item.collection,
            price: item.price,
            quantity: item.qty
        })),
        customer: {} // Stripe will collect shipping/billing; optional prefill here
    };

    try {
        const res = await fetch('/api/orders/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Checkout failed');

        // Redirect to Stripe
        window.location.href = data.url;
    } catch (err) {
        alert('Unable to start checkout: ' + err.message);
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceed to Checkout';
    }
}

// Initial render
renderProducts('all');