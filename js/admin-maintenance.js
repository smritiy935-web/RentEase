let maintenanceRequests = [
    {
        id: 101,
        issue: "Hydraulic lift failure",
        productName: "Forklift Pro X1",
        customerName: "Rajesh Kumar",
        customerEmail: "rajesh@example.com",
        createdAt: "2025-05-20T10:30:00Z",
        status: "open"
    },
    {
        id: 102,
        issue: "Motor overheating",
        productName: "Industrial Mixer",
        customerName: "Sneha Patel",
        customerEmail: "sneha.p@example.com",
        createdAt: "2025-05-18T14:15:00Z",
        status: "in-progress"
    },
    {
        id: 103,
        issue: "Battery not charging",
        productName: "Cordless Drill Kit",
        customerName: "Amit Sharma",
        customerEmail: "amit.sharma@example.com",
        createdAt: "2025-05-22T09:45:00Z",
        status: "open"
    },
    {
        id: 104,
        issue: "Scratched lens & focus issue",
        productName: "DSLR Camera Kit",
        customerName: "Priya Mehta",
        customerEmail: "priya.m@example.com",
        createdAt: "2025-05-10T08:20:00Z",
        status: "resolved"
    },
    {
        id: 105,
        issue: "Broken wheel castor",
        productName: "Heavy Duty Cart",
        customerName: "Vikram Singh",
        customerEmail: "vikram.s@example.com",
        createdAt: "2025-05-23T11:00:00Z",
        status: "closed"
    }
];

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fetchMaintenanceRequests(statusFilter = null) {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filtered = [...maintenanceRequests];
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(req => req.status === statusFilter);
    }
    return filtered;
}

async function updateMaintenanceRequest(id, newStatus) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const requestIndex = maintenanceRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) throw new Error("Request not found");
    maintenanceRequests[requestIndex].status = newStatus;
    return maintenanceRequests[requestIndex];
}

const skeletonLoader = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const requestsTable = document.getElementById('requestsTable');
const tableBody = document.getElementById('requestsTableBody');
const requestCountSpan = document.getElementById('requestCountText');
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

function renderRequests(requestsArray) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (!requestsArray.length) {
        requestsTable.style.display = 'none';
        emptyState.style.display = 'block';
        requestCountSpan.innerText = `0 requests`;
        return;
    }
    requestsTable.style.display = 'block';
    emptyState.style.display = 'none';
    requestCountSpan.innerText = `${requestsArray.length} request${requestsArray.length !== 1 ? 's' : ''}`;
    
    requestsArray.forEach((req, idx) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.animation = `fadeUp 0.3s ease forwards`;
        row.style.animationDelay = `${idx * 0.05}s`;
        
        // Issue column
        const issueCell = document.createElement('td');
        issueCell.innerHTML = `<div style="font-weight: 500; color: var(--text-main);">${escapeHtml(req.issue)}</div><div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(req.productName)}</div>`;
        
        // Customer column
        const customerCell = document.createElement('td');
        customerCell.className = 'hidden-sm';
        customerCell.innerHTML = `<div style="color: var(--text-main);">${escapeHtml(req.customerName)}</div><div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(req.customerEmail)}</div>`;
        
        // Date column
        const dateCell = document.createElement('td');
        dateCell.className = 'hidden-sm text-xs';
        dateCell.innerText = formatDate(req.createdAt);
        
        // Status badge
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        let badgeClass = '';
        switch(req.status) {
            case 'open': badgeClass = 'badge-open'; break;
            case 'in-progress': badgeClass = 'badge-in-progress'; break;
            case 'resolved': badgeClass = 'badge-resolved'; break;
            case 'closed': badgeClass = 'badge-closed'; break;
            default: badgeClass = '';
        }
        statusBadge.className = `badge ${badgeClass}`;
        statusBadge.innerText = req.status;
        statusCell.appendChild(statusBadge);
        
        // Action column
        const actionCell = document.createElement('td');
        actionCell.style.textAlign = 'right';
        const selectEl = document.createElement('select');
        selectEl.className = 'form-control';
        selectEl.style.padding = '4px 8px';
        selectEl.style.fontSize = '12px';
        selectEl.style.width = 'auto';
        selectEl.style.display = 'inline-block';
        
        const statuses = ['open', 'in-progress', 'resolved', 'closed'];
        statuses.forEach(stat => {
            const option = document.createElement('option');
            option.value = stat;
            option.textContent = stat;
            if (req.status === stat) option.selected = true;
            selectEl.appendChild(option);
        });
        
        selectEl.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            if (newStatus === req.status) return;
            try {
                await updateMaintenanceRequest(req.id, newStatus);
                await refreshRequestsList();
                showToast(`Request #${req.id} updated to ${newStatus}`, false);
            } catch (err) {
                showToast(`Failed to update request`, true);
                await refreshRequestsList();
            }
        });
        
        actionCell.appendChild(selectEl);
        
        row.appendChild(issueCell);
        row.appendChild(customerCell);
        row.appendChild(dateCell);
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

async function refreshRequestsList() {
    if (isLoading) return;
    isLoading = true;
    
    skeletonLoader.style.display = 'flex';
    requestsTable.style.display = 'none';
    emptyState.style.display = 'none';
    
    try {
        const filterValue = currentFilter === 'all' ? null : currentFilter;
        const data = await fetchMaintenanceRequests(filterValue);
        renderRequests(data);
    } catch (err) {
        emptyState.style.display = 'block';
        requestsTable.style.display = 'none';
        requestCountSpan.innerText = `Error loading requests`;
    } finally {
        skeletonLoader.style.display = 'none';
        isLoading = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    statusFilterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        refreshRequestsList();
    });
    
    refreshRequestsList();
});
