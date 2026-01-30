// State Management
const state = {
    allProducts: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: 10,
    sortBy: null,
    sortOrder: 'asc',
    searchTerm: ''
};

// API URLs
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// DOM Elements
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const paginationContainer = document.getElementById('pagination');
const errorMessageDiv = document.getElementById('errorMessage');

// Sort buttons
const sortButtons = {
    priceAsc: document.getElementById('sortPriceAsc'),
    priceDesc: document.getElementById('sortPriceDesc'),
    nameAsc: document.getElementById('sortNameAsc'),
    nameDesc: document.getElementById('sortNameDesc')
};

/**
 * Fetch all products from API
 */
async function getAll() {
    try {
        showError('');
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">⏳ Đang tải dữ liệu...</td></tr>';
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Lỗi tải dữ liệu từ API');
        
        state.allProducts = await response.json();
        state.filteredProducts = [...state.allProducts];
        state.currentPage = 1;
        
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Lỗi: Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau!');
        tableBody.innerHTML = '<tr><td colspan="5" class="error">Lỗi tải dữ liệu</td></tr>';
    }
}

/**
 * Filter products by search term
 */
function filterProducts(searchTerm) {
    state.searchTerm = searchTerm.toLowerCase();
    state.currentPage = 1;
    
    state.filteredProducts = state.allProducts.filter(product =>
        product.title.toLowerCase().includes(state.searchTerm)
    );
    
    applyCurrentSort();
    renderTable();
    renderPagination();
}

/**
 * Sort products
 */
function sortProducts(sortBy, sortOrder) {
    state.sortBy = sortBy;
    state.sortOrder = sortOrder;
    state.currentPage = 1;
    applyCurrentSort();
    renderTable();
    renderPagination();
    updateSortButtons();
}

/**
 * Apply current sort settings to filtered products
 */
function applyCurrentSort() {
    if (!state.sortBy) return;

    state.filteredProducts.sort((a, b) => {
        let valueA, valueB;

        if (state.sortBy === 'price') {
            valueA = a.price;
            valueB = b.price;
        } else if (state.sortBy === 'name') {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        }

        if (state.sortOrder === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
}

/**
 * Update sort button styles
 */
function updateSortButtons() {
    Object.values(sortButtons).forEach(btn => btn.classList.remove('active'));
    
    if (state.sortBy === 'price') {
        if (state.sortOrder === 'asc') {
            sortButtons.priceAsc.classList.add('active');
        } else {
            sortButtons.priceDesc.classList.add('active');
        }
    } else if (state.sortBy === 'name') {
        if (state.sortOrder === 'asc') {
            sortButtons.nameAsc.classList.add('active');
        } else {
            sortButtons.nameDesc.classList.add('active');
        }
    }
}

/**
 * Get paginated products for current page
 */
function getPaginatedProducts() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredProducts.slice(startIndex, endIndex);
}

/**
 * Render table with products
 */
function renderTable() {
    const products = getPaginatedProducts();
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    ${state.allProducts.length === 0 
                        ? 'Không có dữ liệu sản phẩm' 
                        : 'Không tìm thấy sản phẩm phù hợp'}
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = products.map(product => {
        const image = product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/80';
        const category = product.category?.name || 'N/A';
        const description = product.description.substring(0, 100) + '...';
        
        return `
            <tr>
                <td>
                    <img src="${image}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/80'">
                </td>
                <td class="product-title">${escapeHtml(product.title)}</td>
                <td class="price">$${product.price.toFixed(2)}</td>
                <td class="category">${escapeHtml(category)}</td>
                <td>${escapeHtml(description)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button id="prevBtn" ${state.currentPage === 1 ? 'disabled' : ''}>← Trước</button>
    `;

    // Show page numbers with ellipsis for large page counts
    const maxVisiblePages = 7;
    let startPage = Math.max(1, state.currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += '<button onclick="goToPage(1)">1</button>';
        if (startPage > 2) paginationHTML += '<span>...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === state.currentPage ? 'active' : '';
        paginationHTML += `<button class="${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += '<span>...</span>';
        paginationHTML += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    paginationHTML += `
        <button id="nextBtn" ${state.currentPage === totalPages ? 'disabled' : ''}>Tiếp →</button>
        <span class="pagination-info">Trang ${state.currentPage}/${totalPages} (${state.filteredProducts.length} kết quả)</span>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Add event listeners for prev/next buttons
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('nextBtn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

/**
 * Go to specific page
 */
function goToPage(page) {
    state.currentPage = page;
    renderTable();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show error message
 */
function showError(message) {
    if (message) {
        errorMessageDiv.innerHTML = `<div class="error">${message}</div>`;
    } else {
        errorMessageDiv.innerHTML = '';
    }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Event Listeners

// Search input with debounce
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterProducts(e.target.value);
    }, 300);
});

// Items per page
itemsPerPageSelect.addEventListener('change', (e) => {
    state.itemsPerPage = parseInt(e.target.value);
    state.currentPage = 1;
    renderTable();
    renderPagination();
});

// Sort buttons
sortButtons.priceAsc.addEventListener('click', () => sortProducts('price', 'asc'));
sortButtons.priceDesc.addEventListener('click', () => sortProducts('price', 'desc'));
sortButtons.nameAsc.addEventListener('click', () => sortProducts('name', 'asc'));
sortButtons.nameDesc.addEventListener('click', () => sortProducts('name', 'desc'));

// Initialize on page load
document.addEventListener('DOMContentLoaded', getAll);
