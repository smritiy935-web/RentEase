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
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getOrderIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id ? parseInt(id) : null;
}

async function loadOrderDetail() {
    const skeleton = document.getElementById('skeletonLoader');
    const notFoundState = document.getElementById('notFoundState');
    const orderDetailDiv = document.getElementById('orderDetail');
    
    skeleton.style.display = 'flex';
    notFoundState.style.display = 'none';
    orderDetailDiv.style.display = 'none';
    
    const orderId = getOrderIdFromUrl();
    
    try {
        await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay
        
        const orders = window.DataService.getOrders();
        // If orderId is not found or not in URL, for demo we just pick the first order
        let order = orders.find(o => o.id === orderId);
        if (!order && orders.length > 0) {
             order = orders[0];
        }
        
        if (!order) {
            throw new Error("Order not found");
        }
        
        document.getElementById('orderIdHeader').innerText = `Order #${order.id}`;
        
        const statusBadge = document.getElementById('orderStatusBadge');
        statusBadge.innerText = order.status || 'pending';
        statusBadge.className = `badge ${getBadgeClass(order.status || 'pending')}`;
        
        document.getElementById('customerName').innerText = escapeHtml(order.customerName);
        document.getElementById('customerEmail').innerText = escapeHtml(order.customerEmail);
        document.getElementById('customerPhone').innerText = escapeHtml(order.customerPhone);
        document.getElementById('deliveryDate').innerText = formatDate(order.deliveryDate);
        document.getElementById('deliveryAddress').innerText = escapeHtml(order.deliveryAddress);
        
        const itemsCountSpan = document.getElementById('itemsCount');
        const itemsList = document.getElementById('itemsList');
        itemsCountSpan.innerText = `(${order.items.length})`;
        itemsList.innerHTML = '';
        
        let totalMonthlyRent = 0;
        let totalDeposit = 0;
        
        const products = window.DataService.getProducts();

        order.items.forEach((item, idx) => {
            // Find product details
            const product = products.find(p => p.id === item.productId) || { name: 'Unknown Product', monthlyRent: 0, securityDeposit: 0 };
            const mRent = item.price || product.monthlyRent; 
            const sDep = item.deposit || product.securityDeposit;
            
            const monthlyTotal = mRent * item.quantity;
            totalMonthlyRent += monthlyTotal;
            totalDeposit += (sDep * item.quantity);
            
            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.padding = '12px 0';
            itemDiv.style.borderBottom = '1px solid var(--border-light)';
            if (idx === order.items.length - 1) {
                itemDiv.style.borderBottom = 'none';
            }
            
            itemDiv.innerHTML = `
                <div>
                    <p style="font-weight: 500; font-size: 14px; color: var(--text-main);">${escapeHtml(product.name)}</p>
                    <p style="font-size: 12px; color: var(--text-muted);">${item.tenureMonths || 6} months &middot; Qty: ${item.quantity}</p>
                </div>
                <p style="font-weight: 500; font-size: 14px; color: var(--text-main);">${formatCurrency(monthlyTotal)}/mo</p>
            `;
            itemsList.appendChild(itemDiv);
        });
        
        if (order.totalMonthlyRent) totalMonthlyRent = order.totalMonthlyRent;
        if (order.totalDeposit) totalDeposit = order.totalDeposit;

        const firstMonthTotal = totalMonthlyRent + totalDeposit;
        
        document.getElementById('totalMonthly').innerHTML = `${formatCurrency(totalMonthlyRent)}<span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">/mo</span>`;
        document.getElementById('totalDeposit').innerText = formatCurrency(totalDeposit);
        document.getElementById('firstMonthTotal').innerText = formatCurrency(firstMonthTotal);
        
        skeleton.style.display = 'none';
        orderDetailDiv.style.display = 'block';
        
    } catch (error) {
        console.error("Error loading order:", error);
        skeleton.style.display = 'none';
        notFoundState.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    loadOrderDetail();
});
