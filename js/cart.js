document.addEventListener('DOMContentLoaded', () => {
    initCart();
});

const skeletonLoader = document.getElementById('skeletonLoader');
const emptyCartState = document.getElementById('emptyCartState');
const cartWithItems = document.getElementById('cartWithItems');
const cartItemsList = document.getElementById('cartItemsList');
const cartItemCount = document.getElementById('cartItemCount');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const toastEl = document.getElementById('toastNotification');
const toastMessageSpan = document.getElementById('toastMessage');

function showToast(message) {
    toastMessageSpan.innerText = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

async function initCart() {
    skeletonLoader.style.display = 'flex';
    emptyCartState.style.display = 'none';
    cartWithItems.style.display = 'none';
    clearCartBtn.style.display = 'none';
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 400));
    
    const cart = window.DataService.getCart();
    updateCartBadge(cart.length);
    
    skeletonLoader.style.display = 'none';
    
    if (cart.length === 0) {
        emptyCartState.style.display = 'block';
        cartItemCount.innerText = "0 items";
    } else {
        cartWithItems.style.display = 'grid'; // display grid for .cart-container
        clearCartBtn.style.display = 'inline-flex';
        cartItemCount.innerText = `${cart.length} item${cart.length !== 1 ? 's' : ''}`;
        renderCartItems(cart);
        updateTotals(cart);
    }
}

function renderCartItems(cart) {
    cartItemsList.innerHTML = '';
    
    cart.forEach((item, idx) => {
        const product = item.product;
        // In case our local storage product isn't perfectly formed from older interactions:
        const monthlyRent = product.monthlyRent || 0;
        const securityDeposit = product.securityDeposit || 0;
        const monthlyTotal = monthlyRent * item.quantity;
        const depositTotal = securityDeposit * item.quantity;
        
        let imgHtml = product.image 
            ? `<img src="${product.image}" class="cart-item-image">`
            : `<div class="cart-item-image"><ion-icon name="image-outline"></ion-icon></div>`;
            
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style.animation = `fadeUp 0.3s ease forwards`;
        div.style.animationDelay = `${idx * 0.05}s`;
        div.style.opacity = '0';
        
        div.innerHTML = `
            ${imgHtml}
            <div class="cart-item-details">
                <div class="cart-item-title">${escapeHtml(product.name)}</div>
                <div class="cart-item-meta">${item.tenureMonths || 3} months · Qty: ${item.quantity}</div>
                <div class="cart-item-price-row">
                    <div>
                        <div class="cart-item-price">₹${monthlyTotal.toLocaleString()}/mo</div>
                        <div style="font-size: 12px; color: var(--text-muted);">Deposit: ₹${depositTotal.toLocaleString()}</div>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            </div>
        `;
        
        cartItemsList.appendChild(div);
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            handleRemoveItem(id);
        });
    });
}

function updateTotals(cart) {
    let totalMonthly = 0;
    let totalDeposit = 0;
    
    cart.forEach(item => {
        totalMonthly += (item.product.monthlyRent || 0) * item.quantity;
        totalDeposit += (item.product.securityDeposit || 0) * item.quantity;
    });
    
    document.getElementById('totalMonthly').innerText = `₹${totalMonthly.toLocaleString()}/mo`;
    document.getElementById('totalDeposit').innerText = `₹${totalDeposit.toLocaleString()}`;
    document.getElementById('firstMonthTotal').innerText = `₹${(totalMonthly + totalDeposit).toLocaleString()}`;
}

async function handleRemoveItem(itemId) {
    const cart = window.DataService.getCart();
    const updated = cart.filter(item => String(item.id) !== String(itemId));
    localStorage.setItem('cart', JSON.stringify(updated));
    showToast("Item removed");
    await initCart();
}

if(clearCartBtn) {
    clearCartBtn.addEventListener('click', async () => {
        localStorage.setItem('cart', JSON.stringify([]));
        showToast("Cart cleared");
        await initCart();
    });
}

if(checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });
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
