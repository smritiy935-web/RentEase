function updateCartBadge() {
    const cart = window.DataService.getCart();
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function getBadgeClass(status) {
    switch(status) {
        case 'pending': return 'badge-pending';
        case 'active': return 'badge-active';
        case 'delivered': return 'badge-delivered';
        case 'cancelled': return 'badge-cancelled';
        case 'completed': return 'badge-completed';
        default: return '';
    }
}

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString();
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function renderOrders() {
    const skeleton = document.getElementById('skeletonLoader');
    const emptyState = document.getElementById('emptyState');
    const ordersList = document.getElementById('ordersList');
    
    skeleton.style.display = 'flex';
    emptyState.style.display = 'none';
    ordersList.style.display = 'none';
    ordersList.innerHTML = '';
    
    await new Promise(r => setTimeout(r, 500)); // Simulate delay
    
    const orders = window.DataService.getOrders();
    
    skeleton.style.display = 'none';
    
    if (!orders || orders.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    ordersList.style.display = 'flex';
    
    // Sort orders by id descending (newest first)
    orders.sort((a,b) => b.id - a.id).forEach((order, idx) => {
        const itemCount = order.items?.length || 0;
        const itemText = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
        const badgeClass = getBadgeClass(order.status || 'pending');
        
        let totalMonthly = 0;
        if (order.totalMonthlyRent) {
            totalMonthly = order.totalMonthlyRent;
        } else {
            // calculate if not there (fallback)
            const products = window.DataService.getProducts();
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const mRent = item.price || (product ? product.monthlyRent : 0);
                totalMonthly += (mRent * item.quantity);
            });
        }
        
        const card = document.createElement('a');
        card.href = `order-details.html?id=${order.id}`;
        card.className = 'order-card animate-fadeSlide';
        card.style.opacity = '0';
        card.style.animationDelay = `${idx * 0.06}s`;
        
        card.innerHTML = `
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(249, 115, 22, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <ion-icon name="cube-outline" style="font-size: 24px;"></ion-icon>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                    <p style="font-weight: 600; color: var(--text-main);">Order #${order.id}</p>
                    <span class="badge ${badgeClass}" style="text-transform: capitalize; font-size: 11px;">${order.status || 'pending'}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${itemText} &middot; Delivery: ${formatDate(order.deliveryDate)}
                </p>
                <p style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-top: 4px;">
                    ${formatCurrency(totalMonthly)}<span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">/mo</span>
                </p>
            </div>
            <ion-icon name="chevron-forward-outline" style="color: var(--text-muted); flex-shrink: 0;"></ion-icon>
        `;
        
        ordersList.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    renderOrders();
});
