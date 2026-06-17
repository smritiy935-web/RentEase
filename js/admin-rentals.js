let rentalsData = [
    {
        id: 1001,
        productName: "Canon EOS DSLR Kit",
        customerName: "Rajesh Kumar",
        customerEmail: "rajesh.k@example.com",
        startDate: "2025-05-10",
        endDate: "2025-06-10",
        monthlyRent: 3400,
        status: "active"
    },
    {
        id: 1002,
        productName: "Bosch Hammer Drill",
        customerName: "Sneha Patel",
        customerEmail: "sneha.p@example.com",
        startDate: "2025-04-15",
        endDate: "2025-05-15",
        monthlyRent: 1200,
        status: "returned"
    },
    {
        id: 1003,
        productName: "Lawn Mower Electric",
        customerName: "Amit Sharma",
        customerEmail: "amit.s@example.com",
        startDate: "2025-04-20",
        endDate: "2025-05-20",
        monthlyRent: 2100,
        status: "overdue"
    },
    {
        id: 1004,
        productName: "LED Party Light System",
        customerName: "Priya Mehta",
        customerEmail: "priya.m@example.com",
        startDate: "2025-05-01",
        endDate: "2025-06-15",
        monthlyRent: 5600,
        status: "extended"
    },
    {
        id: 1005,
        productName: "Professional Tripod",
        customerName: "Vikram Singh",
        customerEmail: "vikram.s@example.com",
        startDate: "2025-05-05",
        endDate: "2025-06-05",
        monthlyRent: 850,
        status: "active"
    },
    {
        id: 1006,
        productName: "Industrial Mixer",
        customerName: "Anjali Nair",
        customerEmail: "anjali.n@example.com",
        startDate: "2025-03-10",
        endDate: "2025-04-10",
        monthlyRent: 4800,
        status: "returned"
    },
    {
        id: 1007,
        productName: "Cordless Drill Set",
        customerName: "Rohit Verma",
        customerEmail: "rohit.v@example.com",
        startDate: "2025-04-25",
        endDate: "2025-05-25",
        monthlyRent: 950,
        status: "overdue"
    }
];

const skeletonLoader = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const rentalsTable = document.getElementById('rentalsTable');
const tableBody = document.getElementById('rentalsTableBody');
const rentalCountSpan = document.getElementById('rentalCountText');
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
        case 'active': return 'badge-active';
        case 'returned': return 'badge-returned';
        case 'overdue': return 'badge-overdue';
        case 'extended': return 'badge-extended';
        default: return '';
    }
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

async function fetchRentals(statusFilter = null) {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filtered = [...rentalsData];
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(rental => rental.status === statusFilter);
    }
    return filtered;
}

async function updateRentalStatus(rentalId, newStatus) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const rentalIndex = rentalsData.findIndex(r => r.id === rentalId);
    if (rentalIndex === -1) throw new Error("Rental not found");
    rentalsData[rentalIndex].status = newStatus;
    return rentalsData[rentalIndex];
}

function renderRentals(rentalsArray) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    if (!rentalsArray.length) {
        rentalsTable.style.display = 'none';
        emptyState.style.display = 'block';
        rentalCountSpan.innerText = `0 rental records`;
        return;
    }
    
    rentalsTable.style.display = 'block';
    emptyState.style.display = 'none';
    rentalCountSpan.innerText = `${rentalsArray.length} rental record${rentalsArray.length !== 1 ? 's' : ''}`;
    
    rentalsArray.forEach((rental, idx) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.animation = `fadeUp 0.25s ease forwards`;
        row.style.animationDelay = `${idx * 0.03}s`;
        
        // Product
        const productCell = document.createElement('td');
        productCell.innerHTML = `
            <div style="font-weight: 500; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                ${escapeHtml(rental.productName)}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">#${rental.id}</div>
        `;
        
        // Customer
        const customerCell = document.createElement('td');
        customerCell.className = 'hidden-sm';
        customerCell.innerHTML = `
            <div style="color: var(--text-main);">${escapeHtml(rental.customerName)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(rental.customerEmail)}</div>
        `;
        
        // Period
        const periodCell = document.createElement('td');
        periodCell.className = 'hidden-md text-xs';
        periodCell.style.color = 'var(--text-muted)';
        periodCell.innerText = `${rental.startDate} → ${rental.endDate}`;
        
        // Rent
        const rentCell = document.createElement('td');
        rentCell.className = 'hidden-lg';
        rentCell.style.fontWeight = '500';
        rentCell.innerText = `₹${Number(rental.monthlyRent).toLocaleString()}/mo`;
        
        // Status Badge
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge ${getBadgeClass(rental.status)}`;
        badge.innerText = rental.status;
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
        
        const statuses = ['active', 'returned', 'overdue', 'extended'];
        statuses.forEach(stat => {
            const option = document.createElement('option');
            option.value = stat;
            option.textContent = stat;
            if (rental.status === stat) option.selected = true;
            selectEl.appendChild(option);
        });
        
        selectEl.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            if (newStatus === rental.status) return;
            selectEl.disabled = true;
            try {
                await updateRentalStatus(rental.id, newStatus);
                await refreshRentalsList();
                showToast(`Rental #${rental.id} updated to ${newStatus}`, false);
            } catch (err) {
                showToast(`Failed to update rental #${rental.id}`, true);
                await refreshRentalsList(); 
            } finally {
                selectEl.disabled = false;
            }
        });
        
        actionCell.appendChild(selectEl);
        
        row.appendChild(productCell);
        row.appendChild(customerCell);
        row.appendChild(periodCell);
        row.appendChild(rentCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
}

async function refreshRentalsList() {
    if (isLoading) return;
    isLoading = true;
    
    skeletonLoader.style.display = 'flex';
    rentalsTable.style.display = 'none';
    emptyState.style.display = 'none';
    
    try {
        const filterValue = currentFilter === 'all' ? null : currentFilter;
        const fetchedRentals = await fetchRentals(filterValue);
        renderRentals(fetchedRentals);
    } catch (err) {
        emptyState.style.display = 'block';
        rentalsTable.style.display = 'none';
        rentalCountSpan.innerText = `Error loading rentals`;
    } finally {
        skeletonLoader.style.display = 'none';
        isLoading = false;
    }
}

function updateActiveFilterButton(activeFilter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-filter') === activeFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');
            currentFilter = filterValue;
            updateActiveFilterButton(filterValue);
            refreshRentalsList();
        });
    });
    
    refreshRentalsList();
});
