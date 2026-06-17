// Connect to our existing localStorage data via DataService
let products = window.DataService.getProducts();

let categories = [
    { id: "furniture", name: "Furniture" },
    { id: "appliances", name: "Appliances" },
    { id: "electronics", name: "Electronics" },
    { id: "fitness", name: "Fitness" }
];

const skeleton = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const productsTable = document.getElementById('productsTable');
const tableBody = document.getElementById('productsTableBody');
const productCountSpan = document.getElementById('productCountText');
const addBtn = document.getElementById('addProductBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');

const modal = document.getElementById('productModal');
const deleteModal = document.getElementById('deleteModal');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const productForm = document.getElementById('productForm');

const toastEl = document.getElementById('toastNotification');
const toastMessageSpan = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

let editingProductId = null;
let pendingDeleteId = null;

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

function validateForm() {
    let valid = true;
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const rent = document.getElementById('prodRent').value;
    const deposit = document.getElementById('prodDeposit').value;
    const desc = document.getElementById('prodDesc').value.trim();
    const tenure = document.getElementById('prodTenure').value;
    const imageUrl = document.getElementById('prodImage').value;
    
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    
    if (name.length < 2) { showFieldError('nameError', 'prodName', 'Name must be at least 2 characters'); valid = false; }
    if (!category) { showFieldError('categoryError', 'prodCategory', 'Please select a category'); valid = false; }
    if (!rent || Number(rent) <= 0) { showFieldError('rentError', 'prodRent', 'Valid monthly rent required'); valid = false; }
    if (!deposit || Number(deposit) < 0) { showFieldError('depositError', 'prodDeposit', 'Valid deposit required'); valid = false; }
    if (desc.length < 10) { showFieldError('descError', 'prodDesc', 'Description must be at least 10 characters'); valid = false; }
    if (tenure && !/^(\d+,)*\d+$/.test(tenure)) { showFieldError('tenureError', 'prodTenure', 'Use comma-separated numbers'); valid = false; }
    if (imageUrl && !imageUrl.match(/^https?:\/\/.+\..+/)) { showFieldError('imageError', 'prodImage', 'Enter a valid URL'); valid = false; }
    
    return valid;
}

function showFieldError(errId, inputId, msg) { 
    const errDiv = document.getElementById(errId); 
    const input = document.getElementById(inputId);
    errDiv.innerText = msg; 
    errDiv.classList.add('show'); 
    input.classList.add('error');
}

async function renderProducts() {
    skeleton.style.display = 'flex';
    productsTable.style.display = 'none';
    emptyState.style.display = 'none';
    
    // Refresh products from localStorage
    products = window.DataService.getProducts();
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const activeRentals = rentals.filter(r => r.status === 'active').map(r => r.productId);
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 400));
    
    skeleton.style.display = 'none';
    
    if (products.length === 0) { 
        emptyState.style.display = 'block'; 
        productCountSpan.innerText = "0 products"; 
        return; 
    }
    
    productsTable.style.display = 'block';
    productCountSpan.innerText = `${products.length} product${products.length !== 1 ? 's' : ''} in inventory`;
    tableBody.innerHTML = '';
    
    products.forEach((p, idx) => {
        const row = document.createElement('tr');
        row.style.animation = `fadeUp 0.2s ease forwards`;
        row.style.animationDelay = `${idx * 0.03}s`;
        row.style.opacity = '0';
        
        const isAvailable = !activeRentals.includes(p.id);
        const catName = categories.find(c => c.id === p.category)?.name || p.category;
        
        let imgHtml = p.image 
            ? `<img src="${p.image}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;" onerror="this.style.display='none'">` 
            : `<div style="width:32px; height:32px; background:var(--border-light); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><ion-icon name="image-outline"></ion-icon></div>`;

        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    ${imgHtml}
                    <span style="font-weight:500; color:var(--text-main);">${escapeHtml(p.name)}</span>
                </div>
            </td>
            <td class="hidden-sm" style="color:var(--text-muted);">${escapeHtml(catName)}</td>
            <td class="hidden-md" style="font-weight:500;">₹${Number(p.monthlyRent).toLocaleString()}</td>
            <td class="hidden-md" style="color:var(--text-muted);">₹${Number(p.securityDeposit).toLocaleString()}</td>
            <td><span class="badge ${isAvailable ? 'badge-available' : 'badge-rented'}">${isAvailable ? 'Available' : 'Rented'}</span></td>
            <td style="text-align:right;">
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button class="edit-btn" data-id="${p.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px;"><ion-icon name="pencil-outline"></ion-icon></button>
                    <button class="delete-btn" data-id="${p.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px;"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => { 
        openEditModal(btn.dataset.id); 
    }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => { 
        pendingDeleteId = btn.dataset.id; 
        deleteModal.classList.add('show'); 
    }));
}

function escapeHtml(str) { 
    if(!str) return ''; 
    return String(str).replace(/[&<>]/g, function(m){ 
        if(m==='&') return '&amp;'; 
        if(m==='<') return '&lt;'; 
        if(m==='>') return '&gt;'; 
        return m;
    }); 
}

function openEditModal(id) {
    const product = products.find(p => String(p.id) === String(id));
    if(!product) return;
    
    editingProductId = id;
    modalTitle.innerText = "Edit Product";
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodRent').value = product.monthlyRent;
    document.getElementById('prodDeposit').value = product.securityDeposit;
    document.getElementById('prodDesc').value = product.description || '';
    document.getElementById('prodImage').value = product.image || '';
    
    // Handle optional fields that might not exist in old data
    document.getElementById('prodTenure').value = product.tenureOptions ? product.tenureOptions.join(',') : '3,6,12';
    document.getElementById('prodFeatures').value = product.features ? product.features.join('\n') : '';
    
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    
    modal.classList.add('show');
}

function openCreateModal() {
    editingProductId = null;
    modalTitle.innerText = "Add Product";
    productForm.reset();
    document.getElementById('prodTenure').value = '3,6,9,12';
    
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    
    modal.classList.add('show');
}

async function handleSubmitForm(e) {
    e.preventDefault();
    if(!validateForm()) return;
    
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const monthlyRent = parseFloat(document.getElementById('prodRent').value);
    const securityDeposit = parseFloat(document.getElementById('prodDeposit').value);
    const description = document.getElementById('prodDesc').value.trim();
    const image = document.getElementById('prodImage').value;
    
    const tenureStr = document.getElementById('prodTenure').value;
    const tenureOptions = tenureStr ? tenureStr.split(',').map(Number).filter(n=>!isNaN(n)) : [3,6,12];
    
    const featuresStr = document.getElementById('prodFeatures').value;
    const features = featuresStr ? featuresStr.split('\n').map(f=>f.trim()).filter(f=>f) : [];
    
    const submitBtn = document.getElementById('submitProductBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = "Saving...";
    
    try {
        await new Promise(r => setTimeout(r, 400));
        
        if (editingProductId) {
            const idx = products.findIndex(p => String(p.id) === String(editingProductId));
            if (idx !== -1) {
                products[idx] = { ...products[idx], name, category, monthlyRent, securityDeposit, description, image, tenureOptions, features };
            }
        } else {
            const newProd = {
                id: 'P' + Date.now(),
                name, category, monthlyRent, securityDeposit, description, image, tenureOptions, features
            };
            products.push(newProd);
        }
        
        localStorage.setItem('products', JSON.stringify(products));
        
        showToast(editingProductId ? "Product updated" : "Product created");
        await renderProducts();
        closeModal();
    } catch(err) { 
        showToast("Operation failed", true); 
    } finally { 
        submitBtn.disabled = false; 
        submitBtn.innerText = "Save Product";
    }
}

function closeModal() { modal.classList.remove('show'); }
function closeDeleteModal() { deleteModal.classList.remove('show'); pendingDeleteId = null; }

async function confirmDelete() {
    if(pendingDeleteId) {
        products = products.filter(p => String(p.id) !== String(pendingDeleteId));
        localStorage.setItem('products', JSON.stringify(products));
        showToast("Product deleted");
        await renderProducts();
        closeDeleteModal();
    }
}

function populateCategories() {
    const select = document.getElementById('prodCategory');
    select.innerHTML = '<option value="">Select...</option>';
    categories.forEach(c => { 
        const opt = document.createElement('option'); 
        opt.value = c.id; 
        opt.textContent = c.name; 
        select.appendChild(opt); 
    });
}

document.addEventListener('DOMContentLoaded', () => {
    populateCategories();
    renderProducts();
    
    addBtn.addEventListener('click', openCreateModal);
    if(emptyAddBtn) emptyAddBtn.addEventListener('click', openCreateModal);
    
    closeModalBtn.addEventListener('click', closeModal);
    cancelFormBtn.addEventListener('click', closeModal);
    productForm.addEventListener('submit', handleSubmitForm);
    
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
});
