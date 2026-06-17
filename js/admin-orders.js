let ordersData = [
    {
        id: 1001,
        customerName: "Rajesh Kumar",
        customerEmail: "rajesh.k@example.com",
        createdAt: "2025-05-15T10:30:00Z",
        deliveryDate: "2025-05-20",
        totalMonthlyRent: 2450,
        status: "pending"
    },
    {
        id: 1002,
        customerName: "Sneha Patel",
        customerEmail: "sneha.p@example.com",
        createdAt: "2025-05-16T14:20:00Z",
        deliveryDate: "2025-05-22",
        totalMonthlyRent: 5890,
        status: "active"
    },
    {
        id: 1003,
        customerName: "Amit Sharma",
        customerEmail: "amit.s@example.com",
        createdAt: "2025-05-18T09:15:00Z",
        deliveryDate: "2025-05-25",
        totalMonthlyRent: 3200,
        status: "delivered"
    },
    {
        id: 1004,
        customerName: "Priya Mehta",
        customerEmail: "priya.m@example.com",
        createdAt: "2025-05-10T11:45:00Z",
        deliveryDate: "2025-05-18",
        totalMonthlyRent: 12750,
        status: "completed"
    },
    {
        id: 1005,
        customerName: "Vikram Singh",
        customerEmail: "vikram.s@example.com",
        createdAt: "2025-05-19T08:00:00Z",
        deliveryDate: "2025-05-26",
        totalMonthlyRent: 899,
        status: "pending"
    },
    {
        id: 1006,
        customerName: "Anjali Nair",
        customerEmail: "anjali.n@example.com",
        createdAt: "2025-05-14T16:30:00Z",
        deliveryDate: "2025-05-21",
        totalMonthlyRent: 4600,
        status: "cancelled"
    },
    {
        id: 1007,
        customerName: "Rohit Verma",
        customerEmail: "rohit.v@example.com",
        createdAt: "2025-05-20T12:10:00Z",
        deliveryDate: "2025-05-28",
        totalMonthlyRent: 7340,
        status: "active"
    }
];

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fetchOrders(statusFilter = null) {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filtered = [...ordersData];
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    return filtered;
}

async function updateOrderStatus(orderId, newStatus) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const orderIndex = ordersData.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    ordersData[orderIndex].status = newStatus;
    return ordersData[orderIndex];
}

const skeletonLoader = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const ordersTable = document.getElementById('ordersTable');
const tableBody = document.getElementById('ordersTableBody');
const orderCountSpan = document.getElementById('orderCountText');
const statusFilterSelect = document.getElementById('statusFilter');
const toastEl = document.getElementById('toastNotification');
const toastMessageSpan = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

let currentFilter = 'all';
let isLoading = false;

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
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
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

function renderOrders(ordersArray) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    if (!ordersArray.length) {
        ordersTable.style.display = 'none';
        emptyState.style.display = 'block';
        orderCountSpan.innerText = `0 orders`;
        return;
    }
    
    ordersTable.style.display = 'block';
    emptyState.style.display = 'none';
    orderCountSpan.innerText = `${ordersArray.length} order${ordersArray.length !== 1 ? 's' : ''}`;
    
    ordersArray.forEach((order, idx) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.animation = `fadeUp 0.25s ease forwards`;
        row.style.animationDelay = `${idx * 0.04}s`;
        
        // Order ID & Date
        const orderCell = document.createElement('td');
        orderCell.innerHTML = `
            <div style="font-weight: 500; color: var(--text-main);">#${order.id}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${formatDate(order.createdAt)}</div>
        `;
        
        // Customer
        const customerCell = document.createElement('td');
        customerCell.className = 'hidden-sm';
        customerCell.innerHTML = `
            <div style="color: var(--text-main);">${escapeHtml(order.customerName)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(order.customerEmail)}</div>
        `;
        
        // Delivery Date
        const deliveryCell = document.createElement('td');
        deliveryCell.className = 'hidden-md text-xs';
        deliveryCell.innerText = order.deliveryDate;
        
        // Amount
        const amountCell = document.createElement('td');
        amountCell.style.fontWeight = '500';
        amountCell.innerText = `₹${Number(order.totalMonthlyRent).toLocaleString()}/mo`;
        
        // Status Badge
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge ${getBadgeClass(order.status)}`;
        badge.innerText = order.status;
        statusCell.appendChild(badge);
        
        // Update Select
        const actionCell = document.createElement('td');
        actionCell.style.textAlign = 'right';
        const selectEl = document.createElement('select');
        selectEl.className = 'form-control';
        selectEl.style.padding = '4px 8px';
        selectEl.style.fontSize = '12px';
        selectEl.style.width = 'auto';
        selectEl.style.display = 'inline-block';
        
        const statuses = ['pending', 'active', 'delivered', 'completed', 'cancelled'];
        statuses.forEach(stat => {
            const option = document.createElement('option');
            option.value = stat;
            option.textContent = stat;
            if (order.status === stat) option.selected = true;
            selectEl.appendChild(option);
        });
        
        selectEl.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            if (newStatus === order.status) return;
            try {
                await updateOrderStatus(order.id, newStatus);
                await refreshOrdersList();
                showToast(`Order #${order.id} updated to ${newStatus}`, false);
            } catch (err) {
                showToast(`Failed to update order #${order.id}`, true);
                await refreshOrdersList(); 
            }
        });
        
        actionCell.appendChild(selectEl);
        
        row.appendChild(orderCell);
        row.appendChild(customerCell);
        row.appendChild(deliveryCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function refreshOrdersList() {
    if (isLoading) return;
    isLoading = true;
    
    skeletonLoader.style.display = 'flex';
    ordersTable.style.display = 'none';
    emptyState.style.display = 'none';
    
    try {
        const filterValue = currentFilter === 'all' ? null : currentFilter;
        const fetchedOrders = await fetchOrders(filterValue);
        renderOrders(fetchedOrders);
    } catch (err) {
        emptyState.style.display = 'block';
        ordersTable.style.display = 'none';
        orderCountSpan.innerText = `Error loading orders`;
    } finally {
        skeletonLoader.style.display = 'none';
        isLoading = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    statusFilterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        refreshOrdersList();
    });
    
    refreshOrdersList();
});
