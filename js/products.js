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

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString();
}

let currentSearch = "";
let currentCategory = "all";
let debounceTimer = null;

const categories = [
    { id: "furniture", name: "Furniture", icon: "bed-outline" },
    { id: "appliances", name: "Appliances", icon: "flash-outline" },
    { id: "electronics", name: "Electronics", icon: "tv-outline" },
    { id: "fitness", name: "Fitness", icon: "barbell-outline" }
];

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.setAttribute('data-category', cat.id);
        btn.className = 'filter-inactive';
        btn.style.cssText = `padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px; white-space: nowrap;`;
        
        btn.innerHTML = `<ion-icon name="${cat.icon}"></ion-icon> ${cat.name}`;
        
        btn.addEventListener('click', () => handleCategory(cat.id));
        container.appendChild(btn);
    });
}

function handleCategory(categoryId) {
    currentCategory = categoryId;
    
    const buttons = document.querySelectorAll('#categoryFilters button');
    buttons.forEach(btn => {
        const cat = btn.getAttribute('data-category');
        if (cat === categoryId) {
            btn.className = 'filter-active';
            btn.style.backgroundColor = 'var(--primary)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--primary)';
        } else {
            btn.className = 'filter-inactive';
            btn.style.backgroundColor = 'white';
            btn.style.color = 'var(--text-main)';
            btn.style.borderColor = 'var(--border-light)';
        }
    });
    
    renderProducts();
}

function handleSearch(value) {
    currentSearch = value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        renderProducts();
    }, 300);
}

async function renderProducts() {
    const skeleton = document.getElementById('skeletonLoader');
    const emptyState = document.getElementById('emptyState');
    const productsGrid = document.getElementById('productsGrid');
    const productCountSpan = document.getElementById('productCountText');
    
    productsGrid.style.display = 'none';
    emptyState.style.display = 'none';
    skeleton.style.display = 'grid';
    productsGrid.innerHTML = '';
    
    await new Promise(r => setTimeout(r, 400));
    
    let products = window.DataService.getProducts();
    const rentals = window.DataService.getRentals();
    const activeRentals = rentals.filter(r => r.status === 'active').map(r => r.productId);
    
    if (currentCategory !== 'all') {
        products = products.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
    }
    
    if (currentSearch.trim()) {
        const searchLower = currentSearch.toLowerCase().trim();
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower)
        );
    }
    
    skeleton.style.display = 'none';
    
    if (products.length === 0) {
        emptyState.style.display = 'block';
        productCountSpan.innerText = `0 products available`;
        return;
    }
    
    productsGrid.style.display = 'grid';
    productCountSpan.innerText = `${products.length} product${products.length !== 1 ? 's' : ''} available`;
    
    products.forEach((product, idx) => {
        const isAvailable = !activeRentals.includes(product.id);
        
        const imgHtml = product.image && product.image.trim()
            ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--border-light);"><ion-icon name="image-outline" style="font-size: 48px;"></ion-icon></div>`;
            
        const availabilityBadge = isAvailable
            ? `<span class="badge badge-completed" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; border-color: rgba(34, 197, 94, 0.2);">Available</span>`
            : `<span class="badge" style="background: var(--bg-card); color: var(--text-muted);">Rented</span>`;
            
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.opacity = '0';
        card.style.animation = `fadeUp 0.35s forwards`;
        card.style.animationDelay = `${Math.min(idx * 0.05, 0.3)}s`;
        
        card.innerHTML = `
            <div style="aspect-ratio: 4/3; background: #f1f5f9; overflow: hidden; cursor: pointer;" onclick="window.location.href='product-details.html?id=${product.id}'">
                ${imgHtml}
            </div>
            <div style="padding: 16px;">
                <p style="font-size: 12px; color: var(--primary); font-weight: 500; margin-bottom: 4px; text-transform: capitalize; cursor: pointer;" onclick="window.location.href='product-details.html?id=${product.id}'">${escapeHtml(product.category)}</p>
                <h3 style="font-weight: 600; color: var(--text-main); margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;" onclick="window.location.href='product-details.html?id=${product.id}'">${escapeHtml(product.name)}</h3>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
                    <div>
                        <p style="font-size: 18px; font-weight: 700; color: var(--text-main);">${formatCurrency(product.monthlyRent)}<span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">/mo</span></p>
                        <p style="font-size: 12px; color: var(--text-muted);">Dep: ${formatCurrency(product.securityDeposit)}</p>
                    </div>
                    ${availabilityBadge}
                </div>
            </div>
        `;
        
        productsGrid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    renderCategoryFilters();
    
    document.getElementById('searchInput').addEventListener('input', (e) => handleSearch(e.target.value));
    document.getElementById('filterAll').addEventListener('click', () => handleCategory('all'));
    
    renderProducts();
});
