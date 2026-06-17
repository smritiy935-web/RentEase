document.addEventListener('DOMContentLoaded', () => {
    // 1. Load dashboard data & charts
    loadDashboardData();
    
    // 2. Render recent rentals
    loadRecentRentals();
});

function loadRecentRentals() {
    const products = window.DataService.getProducts();
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const rentalsList = document.getElementById('admin-rentals-list');
    
    if (rentals.length === 0) {
        rentalsList.innerHTML = '<p style="color: var(--text-muted);">No active rentals found.</p>';
        return;
    }

    let html = '';
    rentals.slice().reverse().forEach(r => {
        const product = products.find(p => p.id === r.productId);
        if (product) {
            html += `
                <div class="rental-item">
                    <div>
                        <div style="font-weight: 600;">${product.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">Order: ${r.id} | Date: ${r.startDate}</div>
                    </div>
                    <div class="status-badge status-active">Active</div>
                </div>
            `;
        }
    });
    rentalsList.innerHTML = html;
}

// --- Analytics & Charts Logic ---

const MOCK_REVENUE_DATA = [
    { month: "Jan", revenue: 31200 },
    { month: "Feb", revenue: 35400 },
    { month: "Mar", revenue: 40200 },
    { month: "Apr", revenue: 42800 },
    { month: "May", revenue: 45600 },
    { month: "Jun", revenue: 48920 },
];

const kpiCardsConfig = [
    { key: "activeRentals", label: "Active Rentals", icon: "home-outline", format: (v) => v.toLocaleString() },
    { key: "monthlyRevenue", label: "Monthly Revenue", icon: "trending-up-outline", format: (v) => `₹${v.toLocaleString()}` },
    { key: "totalProducts", label: "Total Products", icon: "cube-outline", format: (v) => v.toLocaleString() },
    { key: "pendingOrders", label: "Pending Orders", icon: "clipboard-outline", format: (v) => v.toLocaleString() },
    { key: "maintenanceOpen", label: "Open Requests", icon: "construct-outline", format: (v) => v.toLocaleString() },
    { key: "productUtilizationRate", label: "Utilization Rate", icon: "stats-chart-outline", format: (v) => `${v}%` },
];

let revenueChart = null;
let pieChart = null;
let statsLoaded = false, revenueLoaded = false, categoriesLoaded = false;
let statsData = null, revenueData = null, categoriesData = null;

async function loadDashboardData() {
    showInitialSkeletons();
    
    try {
        const [statsResult, revenueResult, categoriesResult] = await Promise.all([
            fetchStats(),
            fetchRevenue(),
            fetchCategories()
        ]);
        statsData = statsResult;
        revenueData = revenueResult;
        categoriesData = categoriesResult;
        
        statsLoaded = true; revenueLoaded = true; categoriesLoaded = true;
        checkAllLoadedAndRender();
    } catch (err) {
        console.error("Error loading dashboard data", err);
    }
}

function checkAllLoadedAndRender() {
    if (statsLoaded && revenueLoaded && categoriesLoaded) {
        renderKPI(statsData, false);
        initRevenueChart(revenueData, false);
        initPieChart(categoriesData, false);
    }
}

// 1. Fetch Dynamic Stats based on LocalStorage + Some Mocks
function fetchStats() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const products = window.DataService.getProducts();
            const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
            const activeRentals = rentals.filter(r => r.status === 'active');
            
            let mrr = 0;
            activeRentals.forEach(r => {
                const p = products.find(prod => prod.id === r.productId);
                if (p) mrr += p.monthlyRent;
            });

            // Calculate utilization
            const util = products.length > 0 ? ((activeRentals.length / products.length) * 100).toFixed(1) : 0;

            resolve({
                activeRentals: activeRentals.length,
                monthlyRevenue: mrr,
                totalProducts: products.length,
                pendingOrders: Math.floor(Math.random() * 5), // mocked
                maintenanceOpen: Math.floor(Math.random() * 3), // mocked
                productUtilizationRate: util,
            });
        }, 500); // simulate network
    });
}

// 2. Fetch Dynamic Revenue (mock historical, real current MRR)
function fetchRevenue() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const products = window.DataService.getProducts();
            const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
            let mrr = 0;
            rentals.filter(r => r.status === 'active').forEach(r => {
                const p = products.find(prod => prod.id === r.productId);
                if (p) mrr += p.monthlyRent;
            });

            const updatedMock = [...MOCK_REVENUE_DATA];
            updatedMock[updatedMock.length - 1].revenue = mrr > 0 ? mrr : updatedMock[updatedMock.length - 1].revenue; // Just to make it dynamic based on current MRR

            resolve(updatedMock);
        }, 400);
    });
}

// 3. Fetch Dynamic Categories from Products
function fetchCategories() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const products = window.DataService.getProducts();
            const categories = {};
            products.forEach(p => {
                categories[p.category] = (categories[p.category] || 0) + 1;
            });
            
            const result = Object.keys(categories).map(cat => ({
                category: cat.charAt(0).toUpperCase() + cat.slice(1),
                count: categories[cat]
            }));
            
            resolve(result);
        }, 300);
    });
}

function showInitialSkeletons() {
    renderKPI(null, true);
    
    const revenueLoader = document.getElementById('revenueLoader');
    const revenueCanvas = document.getElementById('revenueCanvas');
    if (revenueLoader) revenueLoader.style.display = 'block';
    if (revenueCanvas) revenueCanvas.style.display = 'none';
    
    const pieLoader = document.getElementById('pieLoader');
    const pieCanvas = document.getElementById('categoryPieCanvas');
    const emptyMsg = document.getElementById('pieEmptyMsg');
    if (pieLoader) pieLoader.style.display = 'block';
    if (pieCanvas) pieCanvas.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = 'none';
}

function renderKPI(stats, isLoading) {
    const container = document.getElementById('kpiContainer');
    if (!container) return;

    if (isLoading) {
        let skeletonHtml = '';
        for (let i = 0; i < kpiCardsConfig.length; i++) {
            skeletonHtml += `
                <div class="glass kpi-card" style="animation-delay: ${i * 0.07}s">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <div class="badge-icon skeleton"></div>
                        <div class="skeleton" style="height: 12px; width: 60px;"></div>
                    </div>
                    <div class="skeleton" style="height: 24px; width: 80px; margin-top: 8px;"></div>
                </div>
            `;
        }
        container.innerHTML = skeletonHtml;
        return;
    }

    let cardsHtml = '';
    kpiCardsConfig.forEach((card, idx) => {
        const value = stats[card.key] !== undefined ? stats[card.key] : 0;
        const formatted = card.format(value);
        cardsHtml += `
            <div class="glass kpi-card" style="animation-delay: ${idx * 0.07}s;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div class="badge-icon"><ion-icon name="${card.icon}"></ion-icon></div>
                    <p style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${card.label}</p>
                </div>
                <p class="kpi-value">${formatted}</p>
            </div>
        `;
    });
    container.innerHTML = cardsHtml;
}

function initRevenueChart(data, isLoading) {
    const canvas = document.getElementById('revenueCanvas');
    const loaderDiv = document.getElementById('revenueLoader');
    if (!canvas) return;

    if (isLoading) return;
    
    if (loaderDiv) loaderDiv.style.display = 'none';
    canvas.style.display = 'block';

    if (revenueChart) revenueChart.destroy();
    
    Chart.defaults.color = '#94A3B8'; // var(--text-muted)
    Chart.defaults.font.family = 'Outfit';

    const ctx = canvas.getContext('2d');
    const months = data.map(item => item.month);
    const revenues = data.map(item => item.revenue);

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue (₹)',
                data: revenues,
                borderColor: '#4F46E5', // var(--primary)
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#4F46E5',
                pointBorderColor: '#1E293B',
                pointRadius: 3,
                pointHoverRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `Revenue: ₹${context.raw.toLocaleString()}`
                    },
                    backgroundColor: '#1E293B',
                    titleColor: '#F8FAFC',
                    bodyColor: '#F8FAFC',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    ticks: { callback: (value) => '₹' + (value / 1000).toFixed(0) + 'k' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function initPieChart(data, isLoading) {
    const canvas = document.getElementById('categoryPieCanvas');
    const emptyMsg = document.getElementById('pieEmptyMsg');
    const loader = document.getElementById('pieLoader');
    
    if (isLoading) return;
    if (loader) loader.style.display = 'none';
    
    if (!data || data.length === 0) {
        if (canvas) canvas.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    
    if (pieChart) pieChart.destroy();
    
    const ctx = canvas.getContext('2d');
    const labels = data.map(item => item.category);
    const counts = data.map(item => item.count);
    const pieColors = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: pieColors,
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, color: '#94A3B8' }
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const dataset = tooltipItem.dataset;
                            const total = dataset.data.reduce((acc, val) => acc + val, 0);
                            const value = dataset.data[tooltipItem.dataIndex];
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${labels[tooltipItem.dataIndex]}: ${value} (${percentage}%)`;
                        }
                    },
                    backgroundColor: '#1E293B',
                    titleColor: '#F8FAFC',
                    bodyColor: '#F8FAFC',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            }
        }
    });
}

// Window resize handling
let resizeTimer;
window.addEventListener('resize', function() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (revenueChart) revenueChart.resize();
        if (pieChart) pieChart.resize();
    }, 200);
});
