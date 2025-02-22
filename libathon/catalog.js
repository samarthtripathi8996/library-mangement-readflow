// Google Books API configuration
const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const RESULTS_PER_PAGE = 12;
let currentPage = 1;
let currentQuery = '';
let currentResults = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setupSearchForm();
    setupFilters();
    setupSorting();
    // Load initial popular books
    searchBooks({ keywords: 'computer science textbooks' });
});

// Handle the advanced search form
function setupSearchForm() {
    const searchForm = document.querySelector('.card-body form');
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        currentPage = 1;
        
        const searchParams = {
            keywords: document.getElementById('keywordSearch').value,
            department: document.getElementById('departmentSelect').value,
            materialType: document.getElementById('formatSelect').value,
            availability: document.getElementById('availabilityFilter').value
        };
        
        await searchBooks(searchParams);
    });

    // Handle reset button
    searchForm.addEventListener('reset', function() {
        setTimeout(() => searchBooks({ keywords: 'computer science textbooks' }), 0);
    });
}

// Search function that fetches books from Google Books API
async function searchBooks(params) {
    try {
        let queryString = params.keywords || '';
        
        // Add filters to query
        if (params.department) {
            queryString += `+subject:${params.department}`;
        }
        if (params.materialType === 'E-Books') {
            queryString += '+ebooks';
        }

        currentQuery = queryString;
        const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
        
        const response = await fetch(
            `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(queryString)}&startIndex=${startIndex}&maxResults=${RESULTS_PER_PAGE}`
        );
        const data = await response.json();
        
        if (data.items) {
            currentResults = data.items;
            displayResults(data.items, data.totalItems);
        } else {
            displayResults([], 0);
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        displayError('Failed to fetch books. Please try again later.');
    }
}

// Setup sidebar filters
function setupFilters() {
    // Year range filters
    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    
    [yearStart, yearEnd].forEach(input => {
        input.addEventListener('change', applyFilters);
    });

    // Checkbox filters
    document.querySelectorAll('.filter-sidebar .form-check-input')
        .forEach(checkbox => {
            checkbox.addEventListener('change', applyFilters);
        });

    // Apply filters button
    document.querySelector('.filter-sidebar .btn-primary')
        .addEventListener('click', applyFilters);
}

// Apply all active filters
async function applyFilters() {
    const yearStart = document.getElementById('yearStart').value;
    const yearEnd = document.getElementById('yearEnd').value;
    
    let queryString = currentQuery;
    
    if (yearStart && yearEnd) {
        queryString += `+publish_year:${yearStart}-${yearEnd}`;
    }

    // Add subject filters
    const selectedSubjects = Array.from(document.querySelectorAll('[id^="subject"]:checked'))
        .map(cb => cb.nextElementSibling.textContent.split('(')[0].trim());
    
    if (selectedSubjects.length > 0) {
        queryString += `+subject:${selectedSubjects.join('+')}`;
    }

    await searchBooks({ keywords: queryString });
}

// Setup sorting functionality
function setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', function() {
        const sortedResults = sortResults(currentResults, this.value);
        displayResults(sortedResults, currentResults.length);
    });
}

// Sort results based on selected criteria
function sortResults(results, criteria) {
    const sortedResults = [...results];
    
    switch(criteria) {
        case 'Title A-Z':
            sortedResults.sort((a, b) => 
                a.volumeInfo.title.localeCompare(b.volumeInfo.title));
            break;
        case 'Title Z-A':
            sortedResults.sort((a, b) => 
                b.volumeInfo.title.localeCompare(a.volumeInfo.title));
            break;
        case 'Newest First':
            sortedResults.sort((a, b) => {
                const dateA = new Date(a.volumeInfo.publishedDate || 0);
                const dateB = new Date(b.volumeInfo.publishedDate || 0);
                return dateB - dateA;
            });
            break;
        case 'Oldest First':
            sortedResults.sort((a, b) => {
                const dateA = new Date(a.volumeInfo.publishedDate || 0);
                const dateB = new Date(b.volumeInfo.publishedDate || 0);
                return dateA - dateB;
            });
            break;
        default: // 'Relevance' - use API's default sorting
            break;
    }
    
    return sortedResults;
}

// Display results in the grid
function displayResults(results, totalItems) {
    const resultsContainer = document.querySelector('.col-md-9 .row.g-4');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="col-12"><p>No results found.</p></div>';
        return;
    }
    
    results.forEach(book => {
        const bookCard = createBookCard(book);
        resultsContainer.innerHTML += bookCard;
    });
    
    updateResultsCount(results.length, totalItems);
    updatePagination(totalItems);
}

// Create HTML for a book card
function createBookCard(book) {
    const volumeInfo = book.volumeInfo;
    const availability = Math.random() > 0.5 ? 'Available' : 'Checked Out';
    const copies = Math.floor(Math.random() * 10) + 1;
    
    return `
        <div class="col-md-4">
            <div class="card book-card h-100">
                <img src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" 
                     class="card-img-top" alt="${volumeInfo.title} cover">
                <div class="card-body">
                    <h5 class="card-title">${volumeInfo.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">
                        ${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}
                    </h6>
                    <p class="card-text">
                        ${volumeInfo.description ? volumeInfo.description.substring(0, 150) + '...' : 'No description available.'}
                    </p>
                    <div class="d-flex align-items-center mb-2">
                        ${getAvailabilityBadge(availability)}
                        <small class="text-muted">${copies} copies</small>
                    </div>
                    <p class="mb-1"><small>Published: ${volumeInfo.publishedDate || 'N/A'}</small></p>
                    <p><small>Categories: ${volumeInfo.categories ? volumeInfo.categories.join(', ') : 'N/A'}</small></p>
                </div>
                <div class="card-footer">
                    <div class="d-grid gap-2">
                        <button class="btn btn-sm btn-primary" onclick="handleBookAction('${book.id}', '${availability}')">
                            ${getActionButtonText(availability)}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewBookDetails('${book.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for UI elements
function getAvailabilityBadge(availability) {
    const badges = {
        'Available': '<span class="badge bg-success me-2">Available</span>',
        'Checked Out': '<span class="badge bg-danger me-2">Checked Out</span>',
        'E-Book': '<span class="badge bg-info text-dark me-2">E-Book</span>'
    };
    return badges[availability] || '';
}

function getActionButtonText(availability) {
    const actions = {
        'Available': 'Place Hold',
        'Checked Out': 'Join Waitlist',
        'E-Book': 'Access Online'
    };
    return actions[availability] || 'Place Hold';
}

// Update results count display
function updateResultsCount(count, totalItems) {
    const countDisplay = document.querySelector('.text-muted');
    const start = (currentPage - 1) * RESULTS_PER_PAGE + 1;
    const end = Math.min(start + count - 1, totalItems);
    countDisplay.textContent = `Showing ${start}-${end} of ${totalItems} results`;
}

// Update pagination based on results
function updatePagination(totalItems) {
    const pagination = document.querySelector('.pagination');
    const totalPages = Math.ceil(totalItems / RESULTS_PER_PAGE);
    
    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>
        </li>
    `;
    
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    paginationHTML += `
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Handle page changes
async function changePage(newPage) {
    if (newPage < 1) return;
    currentPage = newPage;
    await searchBooks({ keywords: currentQuery });
}

// Handle book actions (hold, waitlist, etc.)
function handleBookAction(bookId, availability) {
    // Implementation would connect to your library system
    alert(`Action triggered for book ${bookId} with availability ${availability}`);
}

// View book details
async function viewBookDetails(bookId) {
    try {
        const response = await fetch(`${GOOGLE_BOOKS_API_BASE}/${bookId}`);
        const book = await response.json();
        
        // Here you would typically open a modal or navigate to a details page
        alert(`Viewing details for: ${book.volumeInfo.title}`);
    } catch (error) {
        console.error('Error fetching book details:', error);
        alert('Failed to load book details. Please try again later.');
    }
}

// Display error messages
function displayError(message) {
    const resultsContainer = document.querySelector('.col-md-9 .row.g-4');
    resultsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        </div>
    `;
}
async function searchBooks(params) {
    try {
        let queryString = params.keywords || '';
        
        // Add filters to query
        if (params.department) {
            queryString += `+subject:${params.department}`;
        }
        if (params.materialType === 'E-Books') {
            queryString += '+ebooks';
        }

        currentQuery = queryString;
        const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
        
        const response = await fetch(
            `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(queryString)}&startIndex=${startIndex}&maxResults=${RESULTS_PER_PAGE}`
        );
        const data = await response.json();
        
        if (data.items) {
            currentResults = data.items;
            displayResults(data.items, data.totalItems);
        } else {
            displayResults([], 0);
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        displayError('Failed to fetch books. Please try again later.');
    }
}

// Setup sidebar filters
function setupFilters() {
    // Year range filters
    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    
    [yearStart, yearEnd].forEach(input => {
        input.addEventListener('change', applyFilters);
    });

    // Checkbox filters
    document.querySelectorAll('.filter-sidebar .form-check-input')
        .forEach(checkbox => {
            checkbox.addEventListener('change', applyFilters);
        });

    // Apply filters button
    document.querySelector('.filter-sidebar .btn-primary')
        .addEventListener('click', applyFilters);
}

// Apply all active filters
async function applyFilters() {
    const yearStart = document.getElementById('yearStart').value;
    const yearEnd = document.getElementById('yearEnd').value;
    
    let queryString = currentQuery;
    
    if (yearStart && yearEnd) {
        queryString += `+publish_year:${yearStart}-${yearEnd}`;
    }

    // Add subject filters
    const selectedSubjects = Array.from(document.querySelectorAll('[id^="subject"]:checked'))
        .map(cb => cb.nextElementSibling.textContent.split('(')[0].trim());
    
    if (selectedSubjects.length > 0) {
        queryString += `+subject:${selectedSubjects.join('+')}`;
    }

    await searchBooks({ keywords: queryString });
}

// Setup sorting functionality
function setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', function() {
        const sortedResults = sortResults(currentResults, this.value);
        displayResults(sortedResults, currentResults.length);
    });
}

// Sort results based on selected criteria
function sortResults(results, criteria) {
    const sortedResults = [...results];
    
    switch(criteria) {
        case 'Title A-Z':
            sortedResults.sort((a, b) => 
                a.volumeInfo.title.localeCompare(b.volumeInfo.title));
            break;
        case 'Title Z-A':
            sortedResults.sort((a, b) => 
                b.volumeInfo.title.localeCompare(a.volumeInfo.title));
            break;
        case 'Newest First':
            sortedResults.sort((a, b) => {
                const dateA = new Date(a.volumeInfo.publishedDate || 0);
                const dateB = new Date(b.volumeInfo.publishedDate || 0);
                return dateB - dateA;
            });
            break;
        case 'Oldest First':
            sortedResults.sort((a, b) => {
                const dateA = new Date(a.volumeInfo.publishedDate || 0);
                const dateB = new Date(b.volumeInfo.publishedDate || 0);
                return dateA - dateB;
            });
            break;
        default: // 'Relevance' - use API's default sorting
            break;
    }
    
    return sortedResults;
}

// Display results in the grid
function displayResults(results, totalItems) {
    const resultsContainer = document.querySelector('.col-md-9 .row.g-4');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="col-12"><p>No results found.</p></div>';
        return;
    }
    
    results.forEach(book => {
        const bookCard = createBookCard(book);
        resultsContainer.innerHTML += bookCard;
    });
    
    updateResultsCount(results.length, totalItems);
    updatePagination(totalItems);
}

// Create HTML for a book card
function createBookCard(book) {
    const volumeInfo = book.volumeInfo;
    const availability = Math.random() > 0.5 ? 'Available' : 'Checked Out';
    const copies = Math.floor(Math.random() * 10) + 1;
    
    return `
        <div class="col-md-4">
            <div class="card book-card h-100">
                <img src="${volumeInfo.imageLinks?.thumbnail || '/api/placeholder/200/300'}" 
                     class="card-img-top" alt="${volumeInfo.title} cover">
                <div class="card-body">
                    <h5 class="card-title">${volumeInfo.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">
                        ${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}
                    </h6>
                    <p class="card-text">
                        ${volumeInfo.description ? volumeInfo.description.substring(0, 150) + '...' : 'No description available.'}
                    </p>
                    <div class="d-flex align-items-center mb-2">
                        ${getAvailabilityBadge(availability)}
                        <small class="text-muted">${copies} copies</small>
                    </div>
                    <p class="mb-1"><small>Published: ${volumeInfo.publishedDate || 'N/A'}</small></p>
                    <p><small>Categories: ${volumeInfo.categories ? volumeInfo.categories.join(', ') : 'N/A'}</small></p>
                </div>
                <div class="card-footer">
                    <div class="d-grid gap-2">
                        <button class="btn btn-sm btn-primary" onclick="handleBookAction('${book.id}', '${availability}')">
                            ${getActionButtonText(availability)}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewBookDetails('${book.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for UI elements
function getAvailabilityBadge(availability) {
    const badges = {
        'Available': '<span class="badge bg-success me-2">Available</span>',
        'Checked Out': '<span class="badge bg-danger me-2">Checked Out</span>',
        'E-Book': '<span class="badge bg-info text-dark me-2">E-Book</span>'
    };
    return badges[availability] || '';
}

function getActionButtonText(availability) {
    const actions = {
        'Available': 'Place Hold',
        'Checked Out': 'Join Waitlist',
        'E-Book': 'Access Online'
    };
    return actions[availability] || 'Place Hold';
}

// Update results count display
function updateResultsCount(count, totalItems) {
    const countDisplay = document.querySelector('.text-muted');
    const start = (currentPage - 1) * RESULTS_PER_PAGE + 1;
    const end = Math.min(start + count - 1, totalItems);
    countDisplay.textContent = `Showing ${start}-${end} of ${totalItems} results`;
}

// Update pagination based on results
function updatePagination(totalItems) {
    const pagination = document.querySelector('.pagination');
    const totalPages = Math.ceil(totalItems / RESULTS_PER_PAGE);
    
    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>
        </li>
    `;
    
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    paginationHTML += `
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Handle page changes
async function changePage(newPage) {
    if (newPage < 1) return;
    currentPage = newPage;
    await searchBooks({ keywords: currentQuery });
}

// Handle book actions (hold, waitlist, etc.)
function handleBookAction(bookId, availability) {
    // Implementation would connect to your library system
    alert(`Action triggered for book ${bookId} with availability ${availability}`);
}

// View book details
async function viewBookDetails(bookId) {
    try {
        const response = await fetch(`${GOOGLE_BOOKS_API_BASE}/${bookId}`);
        const book = await response.json();
        
        // Here you would typically open a modal or navigate to a details page
        alert(`Viewing details for: ${book.volumeInfo.title}`);
    } catch (error) {
        console.error('Error fetching book details:', error);
        alert('Failed to load book details. Please try again later.');
    }
}

// Display error messages
function displayError(message) {
    const resultsContainer = document.querySelector('.col-md-9 .row.g-4');
    resultsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        </div>
    `;
}