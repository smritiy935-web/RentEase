const skeletonLoader = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const requestsList = document.getElementById('requestsList');
const formContainer = document.getElementById('requestFormContainer');
const toggleBtn = document.getElementById('toggleFormBtn');
const maintenanceForm = document.getElementById('maintenanceForm');
const noRentalsMsg = document.getElementById('noActiveRentalsMsg');
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

// Format date
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getBadgeClass(status) {
    switch(status) {
        case 'open': return 'badge-open';
        case 'in-progress': return 'badge-in-progress';
        case 'resolved': return 'badge-resolved';
        case 'closed': return 'badge-closed';
        default: return '';
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

async function renderRequests() {
    skeletonLoader.style.display = 'flex';
    emptyState.style.display = 'none';
    requestsList.innerHTML = '';
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 500));
    
    const requests = JSON.parse(localStorage.getItem('maintenance') || '[]');
    // Mock requests if empty for demo
    if(requests.length === 0 && !localStorage.getItem('maintenance_initialized')) {
        requests.push({
            id: 5001,
            rentalId: "R12345",
            productName: "Canon EOS DSLR Kit",
            issue: "Autofocus not working",
            description: "The camera struggles to focus in low light. Makes grinding noise.",
            status: "open",
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            resolvedAt: null
        });
        localStorage.setItem('maintenance', JSON.stringify(requests));
        localStorage.setItem('maintenance_initialized', 'true');
    }

    skeletonLoader.style.display = 'none';
    
    if (requests.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    requests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach((req, idx) => {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.style.animationDelay = `${idx * 0.06}s`;
        card.style.opacity = '0';
        card.style.background = 'var(--bg-card)';
        card.style.border = '1px solid var(--border-light)';
        card.style.borderRadius = '12px';
        card.style.padding = '16px';
        
        const statusBadgeClass = getBadgeClass(req.status);
        const resolvedHtml = req.resolvedAt ? ` &middot; Resolved: ${formatDate(req.resolvedAt)}` : '';
        
        card.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <p style="font-weight: 600; font-size: 15px; color: var(--text-main);">${escapeHtml(req.issue)}</p>
                    <span class="badge ${statusBadgeClass}" style="text-transform: capitalize; font-size: 11px;">${req.status}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted);">${escapeHtml(req.productName)} (Rental #${req.rentalId})</p>
                ${req.description ? `<p style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(req.description)}</p>` : ''}
                <p style="font-size: 12px; color: var(--border-light); margin-top: 12px; color: #94a3b8;">Submitted: ${formatDate(req.createdAt)}${resolvedHtml}</p>
            </div>
        `;
        requestsList.appendChild(card);
    });
}

function populateRentalDropdown() {
    const select = document.getElementById('rentalSelect');
    select.innerHTML = '<option value="">Choose a rented item...</option>';
    
    const rentals = window.DataService.getRentals().filter(r => r.status === 'active');
    
    rentals.forEach(rental => {
        const products = window.DataService.getProducts();
        const p = products.find(x => x.id === rental.productId);
        const pName = p ? p.name : (rental.productName || 'Unknown Product');
        
        const option = document.createElement('option');
        option.value = rental.id;
        option.textContent = `${pName} (Rental #${rental.id})`;
        option.dataset.productName = pName;
        select.appendChild(option);
    });
}

function showFieldError(errId, inputId, msg) {
    const errDiv = document.getElementById(errId);
    const input = document.getElementById(inputId);
    if (errDiv) { errDiv.innerText = msg; errDiv.style.display = 'block'; }
    if (input) input.style.borderColor = '#ef4444';
}

function validateForm(rentalId, issue) {
    let isValid = true;
    document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '');
    
    if (!rentalId) {
        showFieldError('rentalError', 'rentalSelect', 'Please select a rental item');
        isValid = false;
    }
    
    if (!issue || issue.trim().length < 5) {
        showFieldError('issueError', 'issueInput', 'Issue must be at least 5 characters');
        isValid = false;
    }
    
    return isValid;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const select = document.getElementById('rentalSelect');
    const rentalId = select.value;
    const issue = document.getElementById('issueInput').value.trim();
    const description = document.getElementById('descInput').value.trim();
    
    if (!validateForm(rentalId, issue)) return;
    
    const submitBtn = document.getElementById('submitRequestBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Submitting...';
    
    try {
        await new Promise(r => setTimeout(r, 600));
        
        const productName = select.options[select.selectedIndex].dataset.productName;
        const requests = JSON.parse(localStorage.getItem('maintenance') || '[]');
        
        requests.push({
            id: Date.now(),
            rentalId: rentalId,
            productName: productName,
            issue: issue,
            description: description,
            status: "open",
            createdAt: new Date().toISOString(),
            resolvedAt: null
        });
        
        localStorage.setItem('maintenance', JSON.stringify(requests));
        
        showToast('Request submitted! Our team will reach out shortly.', false);
        maintenanceForm.reset();
        toggleForm(); // closes form
        await renderRequests();
    } catch (err) {
        showToast('Failed to submit request. Please try again.', true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function toggleForm() {
    if (formContainer.style.display === 'none') {
        const rentals = window.DataService.getRentals().filter(r => r.status === 'active');
        if (rentals.length === 0) {
            noRentalsMsg.style.display = 'flex';
        } else {
            noRentalsMsg.style.display = 'none';
        }
        formContainer.style.display = 'block';
        toggleBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon><span style="margin-left:6px;">Cancel</span>';
        document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '');
    } else {
        formContainer.style.display = 'none';
        toggleBtn.innerHTML = '<ion-icon name="add-outline"></ion-icon><span style="margin-left:6px;">New Request</span>';
        maintenanceForm.reset();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    populateRentalDropdown();
    renderRequests();
    
    if (toggleBtn) toggleBtn.addEventListener('click', toggleForm);
    if (maintenanceForm) maintenanceForm.addEventListener('submit', handleSubmit);
});
