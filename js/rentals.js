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
        case 'active': return 'badge-active';
        case 'returned': return 'badge-returned';
        case 'overdue': return 'badge-overdue';
        case 'extended': return 'badge-extended';
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function createRentalCard(rental, index, isPast, product) {
    const card = document.createElement('div');
    card.className = `rental-card animate-fadeSlide ${isPast ? 'past-rental' : ''}`;
    card.style.opacity = '0';
    card.style.animationDelay = `${index * 0.06}s`;
    
    const badgeClass = getBadgeClass(rental.status);
    
    const pName = product ? product.name : `Product #${rental.productId}`;
    const pImage = (product && product.image) ? product.image : null;
    const mRent = product ? product.monthlyRent : 0;
    
    const imgHtml = pImage 
        ? `<img src="${pImage}" alt="${escapeHtml(pName)}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<ion-icon name="cube-outline" style="font-size: 24px; color: var(--border-light);"></ion-icon>`;
        
    // Calculate end date based on start date and tenure
    let startDateStr = rental.startDate;
    let endDateStr = 'N/A';
    if (startDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(start);
        end.setMonth(start.getMonth() + (rental.tenureMonths || 6));
        endDateStr = end.toISOString().split('T')[0];
    }
    
    card.innerHTML = `
        <div style="width: 56px; height: 56px; border-radius: 8px; background: #f1f5f9; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            ${imgHtml}
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                <p style="font-weight: 600; color: var(--text-main);">${escapeHtml(pName)}</p>
                <span class="badge ${badgeClass}" style="text-transform: capitalize; font-size: 11px;">${rental.status}</span>
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: var(--text-muted); margin-bottom: ${!isPast ? '12px' : '0'};">
                <span style="display: flex; align-items: center; gap: 4px;">
                    <ion-icon name="calendar-outline"></ion-icon> ${formatDate(startDateStr)} &mdash; ${formatDate(endDateStr)}
                </span>
                <span>${rental.tenureMonths || 6} months</span>
                <span style="font-weight: 500; color: var(--text-main);">${formatCurrency(mRent)}<span style="font-size: 11px; font-weight: 400; color: var(--text-muted);">/mo</span></span>
            </div>
            
            ${!isPast ? `
                <a href="support.html?rentalId=${rental.id}" class="maintenance-btn">
                    <ion-icon name="construct-outline"></ion-icon> Request Maintenance
                </a>
            ` : ''}
        </div>
    `;
    
    return card;
}

async function renderRentals() {
    const skeleton = document.getElementById('skeletonLoader');
    const emptyState = document.getElementById('emptyState');
    const rentalsListDiv = document.getElementById('rentalsList');
    
    const activeSection = document.getElementById('activeSection');
    const pastSection = document.getElementById('pastSection');
    const activeRentalsList = document.getElementById('activeRentalsList');
    const pastRentalsList = document.getElementById('pastRentalsList');
    const activeTitle = document.getElementById('activeTitle');
    const pastTitle = document.getElementById('pastTitle');
    
    skeleton.style.display = 'flex';
    emptyState.style.display = 'none';
    rentalsListDiv.style.display = 'none';
    
    await new Promise(r => setTimeout(r, 500));
    
    const rentals = window.DataService.getRentals();
    const products = window.DataService.getProducts();
    
    skeleton.style.display = 'none';
    
    if (!rentals || rentals.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    rentalsListDiv.style.display = 'flex';
    
    const activeRentals = rentals.filter(r => ['active', 'overdue', 'extended'].includes(r.status));
    const pastRentals = rentals.filter(r => r.status === 'returned');
    
    if (activeRentals.length > 0) {
        activeSection.style.display = 'block';
        activeTitle.innerText = `Active Rentals (${activeRentals.length})`;
        activeRentalsList.innerHTML = '';
        activeRentals.forEach((rental, idx) => {
            const product = products.find(p => p.id === rental.productId);
            const card = createRentalCard(rental, idx, false, product);
            activeRentalsList.appendChild(card);
        });
    } else {
        activeSection.style.display = 'none';
    }
    
    if (pastRentals.length > 0) {
        pastSection.style.display = 'block';
        pastTitle.innerText = `Past Rentals (${pastRentals.length})`;
        pastRentalsList.innerHTML = '';
        pastRentals.forEach((rental, idx) => {
            const product = products.find(p => p.id === rental.productId);
            const card = createRentalCard(rental, idx, true, product);
            pastRentalsList.appendChild(card);
        });
    } else {
        pastSection.style.display = 'none';
    }
    
    if (activeRentals.length === 0 && pastRentals.length === 0) {
        emptyState.style.display = 'block';
        rentalsListDiv.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    renderRentals();
});
