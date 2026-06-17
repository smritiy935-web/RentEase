document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

const categoriesGrid = document.getElementById('categoriesGrid');
const featuredProductsGrid = document.getElementById('featuredProductsGrid');
const stepsGrid = document.getElementById('stepsGrid');
const categoryFilters = document.getElementById('categoryFilters');
const toastEl = document.getElementById('toastNotification');
const toastMessageSpan = document.getElementById('toastMessage');

function showToast(message) {
    toastMessageSpan.innerText = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
}

function updateCartBadge() {
    const cart = window.DataService.getCart();
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

// Categories Data Map for Icons
const categoryIcons = {
    'furniture': 'bed-outline',
    'appliances': 'flash-outline',
    'electronics': 'tv-outline',
    'fitness': 'barbell-outline'
};

const stepsData = [
    { num: "01", title: "Browse & Select", desc: "Choose from our curated catalog of furniture and appliances" },
    { num: "02", title: "Pick Your Plan", desc: "Select a rental tenure from 3 to 12 months" },
    { num: "03", title: "Schedule Delivery", desc: "Choose your delivery date and address" },
    { num: "04", title: "Enjoy & Return", desc: "Use it, and we'll pick it up when you're done" }
];

function initApp() {
    updateCartBadge();
    renderCategories();
    renderProducts();
    renderSteps();
}

function renderCategories() {
    if (!categoriesGrid) return;
    categoriesGrid.innerHTML = '';
    
    // Group products by category to get counts
    const products = window.DataService.getProducts();
    const catCounts = {};
    products.forEach(p => {
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });

    const uniqueCategories = Object.keys(catCounts);

    uniqueCategories.forEach((catId, idx) => {
        const iconName = categoryIcons[catId] || 'cube-outline';
        const displayName = catId.charAt(0).toUpperCase() + catId.slice(1);
        
        const card = document.createElement('div');
        card.className = 'animate-fadeScale hover-lift';
        card.style.animationDelay = `${idx * 0.08}s`;
        card.style.opacity = '0';
        card.style.animationFillMode = 'forwards';
        card.style.background = 'white';
        card.style.border = '1px solid var(--border-light)';
        card.style.borderRadius = '12px';
        card.style.padding = '24px 16px';
        card.style.textAlign = 'center';
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
            <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 12px; background: rgba(249, 115, 22, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                <ion-icon name="${iconName}" style="font-size: 24px;"></ion-icon>
            </div>
            <p style="font-weight: 600; color: var(--text-main);">${escapeHtml(displayName)}</p>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${catCounts[catId]} items</p>
        `;
        
        card.addEventListener('click', () => {
            // Filter products
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            const filterBtn = document.querySelector(`.filter-btn[data-category="${catId}"]`);
            if(filterBtn) filterBtn.classList.add('active');
            renderProducts(catId);
            document.getElementById('featuredProductsGrid').scrollIntoView({ behavior: 'smooth' });
        });
        
        categoriesGrid.appendChild(card);
        
        // Populate filters if not already there
        if (categoryFilters && !document.querySelector(`.filter-btn[data-category="${catId}"]`)) {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-category', catId);
            btn.innerText = displayName;
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderProducts(catId);
            });
            categoryFilters.appendChild(btn);
        }
    });

    // Handle "All" filter
    const allBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            renderProducts();
        });
    }
}

function renderProducts(categoryId = 'all') {
    if (!featuredProductsGrid) return;
    featuredProductsGrid.innerHTML = '';
    
    let products = window.DataService.getProducts();
    if (categoryId !== 'all') {
        products = products.filter(p => p.category === categoryId);
    }
    
    // Determine active status from rentals
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const activeRentals = rentals.filter(r => r.status === 'active').map(r => r.productId);

    products.forEach((product, idx) => {
        const isAvailable = !activeRentals.includes(product.id);
        
        let imgHtml = product.image 
            ? `<img src="${product.image}" class="product-img-hover" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted);"><ion-icon name="image-outline" style="font-size: 48px;"></ion-icon></div>`;

        const card = document.createElement('div');
        card.className = 'animate-fadeScale group hover-lift';
        card.style.animationDelay = `${idx * 0.08}s`;
        card.style.opacity = '0';
        card.style.animationFillMode = 'forwards';
        card.style.background = 'white';
        card.style.border = '1px solid var(--border-light)';
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        
        card.innerHTML = `
            <div style="aspect-ratio: 4/3; background: #f1f5f9; overflow: hidden; cursor: pointer;" onclick="window.location.href='product-details.html?id=${product.id}'">
                ${imgHtml}
            </div>
            <div style="padding: 16px;">
                <p style="font-size: 12px; color: var(--primary); font-weight: 500; margin-bottom: 4px; text-transform: capitalize; cursor: pointer;" onclick="window.location.href='product-details.html?id=${product.id}'">${escapeHtml(product.category)}</p>
                <h3 style="font-weight: 600; color: var(--text-main); margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;" onclick="window.location.href='product-details.html?id=${product.id}'">${escapeHtml(product.name)}</h3>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
                    <div>
                        <p style="font-size: 18px; font-weight: 700; color: var(--text-main);">₹${Number(product.monthlyRent || 0).toLocaleString()}<span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">/mo</span></p>
                        <p style="font-size: 12px; color: var(--text-muted);">Deposit: ₹${Number(product.securityDeposit || 0).toLocaleString()}</p>
                    </div>
                    <span class="badge ${isAvailable ? 'badge-available' : 'badge-rented'}" style="font-size: 11px;">${isAvailable ? 'Available' : 'Rented'}</span>
                </div>
                
                <button class="btn btn-primary" style="width: 100%; padding: 10px;" ${!isAvailable ? 'disabled' : ''}>
                    ${isAvailable ? 'Add to Cart' : 'Currently Rented'}
                </button>
            </div>
        `;
        
        if (isAvailable) {
            const btn = card.querySelector('button');
            btn.addEventListener('click', () => {
                addToCart(product);
            });
        }
        
        featuredProductsGrid.appendChild(card);
    });
}

function addToCart(product) {
    const cart = window.DataService.getCart();
    
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            productId: product.id,
            product: product,
            quantity: 1,
            tenureMonths: 6 // default
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} added to cart`);
}

function renderSteps() {
    if (!stepsGrid) return;
    stepsGrid.innerHTML = '';
    
    stepsData.forEach((step, idx) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'animate-fadeScale';
        stepDiv.style.animationDelay = `${idx * 0.1}s`;
        stepDiv.style.opacity = '0';
        stepDiv.style.animationFillMode = 'forwards';
        stepDiv.style.textAlign = 'center';
        stepDiv.style.position = 'relative';
        
        if (idx < stepsData.length - 1) {
            stepDiv.classList.add('step-connector');
        }
        
        stepDiv.innerHTML = `
            <div style="position: relative; z-index: 10; display: inline-flex; width: 48px; height: 48px; border-radius: 50%; background: var(--primary); color: white; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                ${step.num}
            </div>
            <h3 style="font-weight: 600; color: var(--text-main); margin-bottom: 8px;">${escapeHtml(step.title)}</h3>
            <p style="font-size: 14px; color: var(--text-muted);">${escapeHtml(step.desc)}</p>
        `;
        
        stepsGrid.appendChild(stepDiv);
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
