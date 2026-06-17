document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    renderUserRentals();
});

function renderUserRentals() {
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const products = window.DataService.getProducts();
    const container = document.getElementById('user-rentals');

    if (rentals.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">You have no active rentals.</p>';
        return;
    }

    let html = '';
    rentals.forEach(r => {
        const product = products.find(p => p.id === r.productId);
        if (product) {
            html += `
                <div class="rental-card glass">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="rental-details">
                        <div class="rental-title">${product.name}</div>
                        <div class="rental-meta">
                            Order ID: ${r.id}<br>
                            Started: ${r.startDate}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                            <span class="status-badge status-active">Active</span>
                            <button class="btn btn-primary btn-sm" onclick="requestMaintenance('${r.id}')">Request Maintenance</button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

window.requestMaintenance = function(rentalId) {
    alert(`Maintenance requested for Order ${rentalId}. Our team will contact you shortly.`);
}
