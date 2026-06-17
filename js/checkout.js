const skeletonLoader = document.getElementById('skeletonLoader');
const emptyCartState = document.getElementById('emptyCartState');
const checkoutWithItems = document.getElementById('checkoutWithItems');
const orderSuccess = document.getElementById('orderSuccess');
const toastEl = document.getElementById('toastNotification');
const toastMessageSpan = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

function showToast(message, isError = false) {
    toastMessageSpan.innerText = message;
    if (isError) {
        toastEl.classList.add('error');
        toastIcon.setAttribute('name', 'alert-circle');
    } else {
        toastEl.classList.remove('error');
        toastIcon.setAttribute('name', 'checkmark-circle');
    }
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function setMinDeliveryDate() {
    const dateInput = document.getElementById('deliveryDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
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

function renderSummary(cart) {
    const itemsList = document.getElementById('orderItemsList');
    const summaryCount = document.getElementById('summaryItemCount');
    itemsList.innerHTML = '';

    let totalMonthly = 0;
    let totalDeposit = 0;

    cart.forEach(item => {
        const product = item.product;
        const monthlyRent = product.monthlyRent || 0;
        const deposit = product.securityDeposit || 0;
        const monthlyTotal = monthlyRent * item.quantity;
        totalMonthly += monthlyTotal;
        totalDeposit += deposit * item.quantity;

        let imgHtml = product.image
            ? `<img src="${product.image}" class="summary-item-img" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">`
            : `<div class="summary-item-img"><ion-icon name="image-outline"></ion-icon></div>`;

        const div = document.createElement('div');
        div.className = 'summary-item';
        div.innerHTML = `
            ${imgHtml}
            <div class="summary-item-info">
                <div class="summary-item-name">${escapeHtml(product.name)}</div>
                <div class="summary-item-meta">${item.tenureMonths || 3}mo · Qty ${item.quantity}</div>
            </div>
            <div class="summary-item-price">₹${monthlyTotal.toLocaleString()}/mo</div>
        `;
        itemsList.appendChild(div);
    });

    summaryCount.innerText = `(${cart.length} item${cart.length !== 1 ? 's' : ''})`;
    document.getElementById('totalMonthly').innerText = `₹${totalMonthly.toLocaleString()}/mo`;
    document.getElementById('totalDeposit').innerText = `₹${totalDeposit.toLocaleString()}`;
    document.getElementById('firstMonthTotal').innerText = `₹${(totalMonthly + totalDeposit).toLocaleString()}`;
}

function validateForm() {
    let isValid = true;

    // Reset
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const deliveryDate = document.getElementById('deliveryDate').value;

    if (name.length < 2) {
        showFieldError('nameError', 'customerName', 'Name must be at least 2 characters');
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
        showFieldError('emailError', 'customerEmail', 'Enter a valid email address');
        isValid = false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showFieldError('phoneError', 'customerPhone', 'Enter a valid 10-digit phone number');
        isValid = false;
    }

    if (address.length < 10) {
        showFieldError('addressError', 'deliveryAddress', 'Please enter a complete address (min 10 characters)');
        isValid = false;
    }

    if (!deliveryDate) {
        showFieldError('dateError', 'deliveryDate', 'Please select a delivery date');
        isValid = false;
    } else {
        const selected = new Date(deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
            showFieldError('dateError', 'deliveryDate', 'Delivery date cannot be in the past');
            isValid = false;
        }
    }

    return isValid;
}

function showFieldError(errId, inputId, msg) {
    const errDiv = document.getElementById(errId);
    const input = document.getElementById(inputId);
    if (errDiv) { errDiv.innerText = msg; errDiv.classList.add('show'); }
    if (input) input.classList.add('error');
}

async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const deliveryDate = document.getElementById('deliveryDate').value;
    const notes = document.getElementById('notes').value.trim();

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const placeOrderText = document.getElementById('placeOrderText');
    placeOrderBtn.disabled = true;
    placeOrderBtn.classList.add('btn-loading');
    placeOrderText.innerText = 'Placing Order...';

    try {
        // Simulate API delay
        await new Promise(r => setTimeout(r, 900));

        const cart = window.DataService.getCart();
        const rentals = window.DataService.getRentals();
        const orderId = 'O' + Date.now();

        // Convert cart items to rentals
        cart.forEach(item => {
            const tenureMonths = item.tenureMonths || 3;
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + tenureMonths);

            rentals.push({
                id: 'R' + Date.now() + Math.floor(Math.random() * 1000),
                orderId: orderId,
                productId: item.productId,
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                deliveryAddress: address,
                deliveryDate: deliveryDate,
                notes: notes || '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                monthlyRent: item.product.monthlyRent,
                tenureMonths: tenureMonths,
                status: 'active'
            });
        });

        localStorage.setItem('rentals', JSON.stringify(rentals));
        localStorage.setItem('cart', JSON.stringify([]));
        updateCartBadge(0);

        // Show success screen
        checkoutWithItems.style.display = 'none';
        orderSuccess.style.display = 'block';
        document.getElementById('orderConfirmMsg').innerText = `Order #${orderId} is confirmed! Your items will be delivered by ${deliveryDate}.`;
        showToast(`Order #${orderId} placed successfully!`);

    } catch (err) {
        showToast("Error placing order. Please try again.", true);
        placeOrderBtn.disabled = false;
        placeOrderBtn.classList.remove('btn-loading');
        placeOrderText.innerText = 'Place Order';
    }
}

async function loadCheckoutPage() {
    skeletonLoader.style.display = 'flex';
    emptyCartState.style.display = 'none';
    checkoutWithItems.style.display = 'none';
    orderSuccess.style.display = 'none';

    // Simulate API delay
    await new Promise(r => setTimeout(r, 400));

    const cart = window.DataService.getCart();
    skeletonLoader.style.display = 'none';
    updateCartBadge(cart.length);

    if (cart.length === 0) {
        emptyCartState.style.display = 'block';
        return;
    }

    checkoutWithItems.style.display = 'grid';
    renderSummary(cart);
    setMinDeliveryDate();
}

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutPage();

    const form = document.getElementById('checkoutForm');
    if (form) form.addEventListener('submit', handleSubmit);
});
