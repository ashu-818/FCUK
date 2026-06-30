/* ═══════════════════════════════════════════════
   FCUK – Shared Product Data & Helpers
   Used by: shop.html · favorites.html · product.html · cart.html
   ═══════════════════════════════════════════════ */

// ─── Product Data ───
const PRODUCTS = [
    { id: 1,  name: 'Air Max 1',        category: 'Lifestyle',   price: 129.99, original: null,      badge: 'new',       rating: 4.8, reviews: 124 },
    { id: 2,  name: 'Runner Pro',       category: 'Performance', price: 149.99, original: null,      badge: 'bestseller', rating: 4.9, reviews: 312 },
    { id: 3,  name: 'Classic Low',      category: 'Lifestyle',   price: 89.99,  original: null,      badge: null,        rating: 4.6, reviews: 89  },
    { id: 4,  name: 'Trail Blazer',     category: 'Outdoor',     price: 119.99, original: 139.99,    badge: 'new',       rating: 4.7, reviews: 56  },
    { id: 5,  name: 'Urban Flex',       category: 'Lifestyle',   price: 109.99, original: null,      badge: null,        rating: 4.5, reviews: 203 },
    { id: 6,  name: 'Retro Wing',       category: 'Heritage',    price: 139.99, original: null,      badge: 'limited',   rating: 4.9, reviews: 78  },
    { id: 7,  name: 'Speed X',          category: 'Performance', price: 159.99, original: 189.99,    badge: null,        rating: 4.7, reviews: 167 },
    { id: 8,  name: 'Heritage 85',      category: 'Heritage',    price: 99.99,  original: 129.99,    badge: 'sale',      rating: 4.6, reviews: 245 },
    { id: 9,  name: 'Street Glide',     category: 'Skate',       price: 124.99, original: null,      badge: null,        rating: 4.4, reviews: 93  },
    { id: 10, name: 'Cortex',           category: 'Lifestyle',   price: 144.99, original: null,      badge: 'new',       rating: 4.8, reviews: 41  },
    { id: 11, name: 'Phantom',          category: 'Performance', price: 179.99, original: null,      badge: 'limited',   rating: 5.0, reviews: 34  },
    { id: 12, name: 'Apex',             category: 'Training',    price: 169.99, original: null,      badge: null,        rating: 4.7, reviews: 118 },
    { id: 13, name: 'Drift',            category: 'Lifestyle',   price: 114.99, original: 134.99,    badge: 'sale',      rating: 4.5, reviews: 76  },
    { id: 14, name: 'Monarch',          category: 'Heritage',    price: 134.99, original: null,      badge: null,        rating: 4.6, reviews: 152 },
    { id: 15, name: 'Pulse',            category: 'Performance', price: 94.99,  original: null,      badge: 'new',       rating: 4.4, reviews: 67  },
    { id: 16, name: 'Vertex',           category: 'Training',    price: 154.99, original: null,      badge: null,        rating: 4.7, reviews: 89  },
    { id: 17, name: 'Nomad',            category: 'Outdoor',     price: 104.99, original: null,      badge: null,        rating: 4.3, reviews: 44  },
    { id: 18, name: 'Forge',            category: 'Training',    price: 129.99, original: null,      badge: 'bestseller', rating: 4.8, reviews: 198 },
    { id: 19, name: 'Eclipse',          category: 'Performance', price: 189.99, original: null,      badge: 'limited',   rating: 4.9, reviews: 27  },
    { id: 20, name: 'Origin',           category: 'Lifestyle',   price: 79.99,  original: 99.99,     badge: 'sale',      rating: 4.5, reviews: 330 },
];

// ─── Image path ───
const PRODUCT_IMG = 'frames/ezgif-frame-240.jpg';

// ─── Favorites (localStorage) ───
function getFavorites() {
    try {
        const data = localStorage.getItem('fcuk_favorites');
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveFavorites(ids) {
    localStorage.setItem('fcuk_favorites', JSON.stringify(ids));
}

function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx > -1) { favs.splice(idx, 1); return false; }
    else { favs.push(id); return true; }
}

function isFavorite(id) {
    return getFavorites().indexOf(id) > -1;
}

function getFavoriteProducts() {
    const ids = getFavorites();
    return PRODUCTS.filter(p => ids.indexOf(p.id) > -1);
}

// ─── Cart (localStorage) ───
const CART_KEY = 'fcuk_cart';

function getCart() {
    try {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addToCart(id, size, quantity) {
    if (quantity === undefined) quantity = 1;
    const items = getCart();
    // Look for existing item with same id + size
    const idx = items.findIndex(item => item.id === id && item.size === size);
    if (idx > -1) {
        items[idx].quantity += quantity;
    } else {
        items.push({ id: Number(id), size: Number(size), quantity: quantity });
    }
    saveCart(items);
    updateCartBadge();
    return items;
}

function removeFromCart(id, size) {
    let items = getCart();
    items = items.filter(item => !(item.id === id && item.size === size));
    saveCart(items);
    updateCartBadge();
    return items;
}

function updateQuantity(id, size, qty) {
    if (qty < 1) return removeFromCart(id, size);
    const items = getCart();
    const idx = items.findIndex(item => item.id === id && item.size === size);
    if (idx > -1) {
        items[idx].quantity = qty;
        saveCart(items);
        updateCartBadge();
    }
    return items;
}

function getCartCount() {
    const items = getCart();
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
    const products = getCartProducts();
    return products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function getCartProducts() {
    const items = getCart();
    return items.map(item => {
        const product = getProductById(item.id);
        return product ? { ...item, product } : null;
    }).filter(Boolean);
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}

function updateCartBadge() {
    const count = getCartCount();
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ─── Helpers ───
function getProductById(id) {
    return PRODUCTS.find(p => p.id === Number(id)) || null;
}

function getBadgeLabel(badge) {
    if (!badge) return '';
    const map = { 'new': 'New', 'sale': 'Sale', 'limited': 'Limited', 'bestseller': 'Best Seller' };
    return map[badge] || badge;
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '★';
    if (half) stars += '☆';
    const total = 5;
    const empty = total - full - (half ? 1 : 0);
    for (let i = 0; i < empty; i++) stars += '★';
    return `<span class="stars">${stars}</span>`;
}

function formatPrice(amount) {
    return '$' + amount.toFixed(2);
}

function getDiscountPercent(original, current) {
    if (!original) return 0;
    return Math.round((1 - current / original) * 100);
}
