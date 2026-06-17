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

function updateCartBadge() {
    const cart = window.DataService.getCart();
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
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

const tenureLabels = { 3: "3 months", 6: "6 months", 9: "9 months", 12: "12 months" };

let selectedTenure = 6;
let quantity = 1;
let currentProduct = null;

function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id ? parseInt(id) : null;
}

function updateUI() {
    if (!currentProduct) return;
    
    const monthlyTotal = currentProduct.monthlyRent * quantity;
    const depositTotal = currentProduct.securityDeposit * quantity;
    
    document.getElementById('summaryLabel').innerHTML = `Monthly total (${quantity} item${quantity > 1 ? 's' : ''})`;
    document.getElementById('summaryTotal').innerHTML = `₹${monthlyTotal.toLocaleString()}<span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">/mo</span>`;
    document.getElementById('summaryDeposit').innerHTML = `₹${depositTotal.toLocaleString()}`;
}

async function loadProductDetail() {
    const skeleton = document.getElementById('skeletonLoader');
    const notFound = document.getElementById('notFoundState');
    const productDetail = document.getElementById('productDetail');
    
    skeleton.style.display = 'grid';
    notFound.style.display = 'none';
    productDetail.style.display = 'none';
    
    const productId = getProductIdFromUrl();
    
    try {
        await new Promise(r => setTimeout(r, 500));
        
        const products = window.DataService.getProducts();
        currentProduct = products.find(p => p.id === productId);
        
        if (!currentProduct) {
            throw new Error("Product not found");
        }
        
        // Determine availability from rentals
        const rentals = window.DataService.getRentals();
        const activeRentals = rentals.filter(r => r.status === 'active').map(r => r.productId);
        const isAvailable = !activeRentals.includes(currentProduct.id);
        
        const imgContainer = document.getElementById('productImageContainer');
        if (currentProduct.image && currentProduct.image.trim()) {
            imgContainer.innerHTML = `<img src="${currentProduct.image}" alt="${escapeHtml(currentProduct.name)}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            imgContainer.innerHTML = `<ion-icon name="image-outline" style="font-size: 64px; color: var(--border-light);"></ion-icon>`;
        }
        
        document.getElementById('productCategoryBadge').innerHTML = escapeHtml(currentProduct.category);
        document.getElementById('productName').innerHTML = escapeHtml(currentProduct.name);
        document.getElementById('productDescription').innerHTML = "Premium quality rental furniture/appliance. Ready to elevate your home experience. Insured and maintained by RentEase professionals.";
        document.getElementById('monthlyRent').innerHTML = `₹${currentProduct.monthlyRent.toLocaleString()}`;
        document.getElementById('securityDeposit').innerHTML = `₹${currentProduct.securityDeposit.toLocaleString()}`;
        
        const tenureContainer = document.getElementById('tenureOptions');
        tenureContainer.innerHTML = '';
        const tenureOpts = [3, 6, 12];
        selectedTenure = tenureOpts[1];
        
        tenureOpts.forEach(tenure => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 rounded-lg text-sm font-medium border transition-all ${tenure === selectedTenure ? 'tenure-active' : 'tenure-inactive'}`;
            btn.style.padding = '8px 16px';
            btn.style.borderRadius = '8px';
            btn.style.fontSize = '14px';
            btn.style.fontWeight = '500';
            btn.style.border = '1px solid';
            btn.style.cursor = 'pointer';
            
            btn.innerText = tenureLabels[tenure] || `${tenure} months`;
            btn.addEventListener('click', () => {
                selectedTenure = tenure;
                Array.from(tenureContainer.children).forEach(btnEl => {
                    const t = parseInt(btnEl.innerText.split(' ')[0]);
                    if (t === tenure) {
                        btnEl.className = `tenure-active`;
                        btnEl.style.background = 'var(--primary)';
                        btnEl.style.color = 'white';
                        btnEl.style.borderColor = 'var(--primary)';
                    } else {
                        btnEl.className = `tenure-inactive`;
                        btnEl.style.background = 'white';
                        btnEl.style.color = 'var(--text-main)';
                        btnEl.style.borderColor = 'var(--border-light)';
                    }
                });
                updateUI();
            });
            
            if (tenure === selectedTenure) {
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--primary)';
            } else {
                btn.style.background = 'white';
                btn.style.color = 'var(--text-main)';
                btn.style.borderColor = 'var(--border-light)';
            }
            
            tenureContainer.appendChild(btn);
        });
        
        quantity = 1;
        document.getElementById('quantityValue').innerText = quantity;
        
        updateUI();
        
        const addBtn = document.getElementById('addToCartBtn');
        if (!isAvailable) {
            addBtn.disabled = true;
            addBtn.style.opacity = '0.5';
            addBtn.style.cursor = 'not-allowed';
            document.getElementById('addToCartText').innerText = 'Currently Rented';
        } else {
            addBtn.disabled = false;
            document.getElementById('addToCartText').innerText = 'Add to Cart';
        }
        
        skeleton.style.display = 'none';
        productDetail.style.display = 'grid';
        
    } catch (error) {
        skeleton.style.display = 'none';
        notFound.style.display = 'block';
    }
}

function setupEventListeners() {
    const qtyDecrease = document.getElementById('qtyDecrease');
    const qtyIncrease = document.getElementById('qtyIncrease');
    const quantitySpan = document.getElementById('quantityValue');
    
    qtyDecrease.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            quantitySpan.innerText = quantity;
            updateUI();
        }
    });
    
    qtyIncrease.addEventListener('click', () => {
        quantity++;
        quantitySpan.innerText = quantity;
        updateUI();
    });
    
    const addBtn = document.getElementById('addToCartBtn');
    addBtn.addEventListener('click', () => {
        if (!currentProduct) return;
        
        const cart = window.DataService.getCart();
        const existing = cart.find(item => item.productId === currentProduct.id);
        
        if (existing) {
            existing.quantity += quantity;
            existing.tenureMonths = selectedTenure;
        } else {
            cart.push({
                id: Date.now(),
                productId: currentProduct.id,
                product: currentProduct,
                quantity: quantity,
                tenureMonths: selectedTenure
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        showToast(`${currentProduct.name} added to cart`);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    setupEventListeners();
    loadProductDetail();
});
