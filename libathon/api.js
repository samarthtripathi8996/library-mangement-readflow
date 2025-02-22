// Function to fetch and display search results

async function searchBooks() {
    const searchQuery = document.getElementById("search-input").value;
    if (!searchQuery) {
        alert("Please enter a search term.");
        return;
    }

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchQuery}`);
    const data = await response.json();
    const bookList = document.getElementById("search-results");
    bookList.innerHTML = "";

    if (data.items && data.items.length > 0) {
        data.items.forEach(book => {
            const volumeInfo = book.volumeInfo;
            const available = Math.random() > 0.5 ? "Available" : "Not Available";
            const bookElement = `
            <div class="book" data-book-id="${book.id}">
                <img src="${volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x190'}" alt="${volumeInfo.title}">
                <h2><a href="movie-detail.html?id=${book.id}">${volumeInfo.title}</a></h2>
                <p>Author: ${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown"}</p>
                <p>Published Year: ${volumeInfo.publishedDate ? volumeInfo.publishedDate.split("-")[0] : "N/A"}</p>
                <p>Status: ${available}</p>
            </div>`;
            bookList.innerHTML += bookElement;
        });
    } else {
        bookList.innerHTML = "<p>No results found.</p>";
    }
}


// Function to fetch and display popular books
async function getPopularBooks() {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=bestsellers`);
    const data = await response.json();

    const bookList = document.getElementById('popular-books');
    bookList.innerHTML = ""; // Clear existing books

    if (data.items && data.items.length > 0) {
        const limitedBooks = data.items.slice(0, 112); // Limit to 12 books
        const available = Math.random() > 0.5 ? "Available" : "Not Available";
        limitedBooks.forEach(book => {
            const volumeInfo = book.volumeInfo;
            const bookElement = `
            <div class="book">
                <img src="${volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x190'}" alt="${volumeInfo.title}">
                <h2><a href="movie-detail.html?id=${book.id}">${volumeInfo.title}</a></h2>
                <p>Author: ${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown"}</p>
                <p>Published Year: ${volumeInfo.publishedDate ? volumeInfo.publishedDate.split("-")[0] : "N/A"}</p>
                <p>Status: ${available}</p>
            </div>
            `;
            bookList.innerHTML += bookElement;
        });
    } else {
        bookList.innerHTML = "<p>No popular books found.</p>";
    }
}

// Function to fetch and display highly rated books
async function getHighlyRatedBooks() {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=best+books&orderBy=relevance`);
    const data = await response.json();

    const bookList = document.getElementById('highly-rated-books');
    bookList.innerHTML = ""; // Clear existing books

    if (data.items && data.items.length > 0) {
        const limitedBooks = data.items.slice(0, 112); // Limit to 12 books
        const available = Math.random() > 0.5 ? "Available" : "Not Available";
        limitedBooks.forEach(book => {
            const volumeInfo = book.volumeInfo;
            const bookElement = `
            <div class="book">
                <img src="${volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x190'}" alt="${volumeInfo.title}">
                <h2><a href="movie-detail.html?id=${book.id}">${volumeInfo.title}</a></h2>
                <p>Author: ${volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown"}</p>
                <p>Published Year: ${volumeInfo.publishedDate ? volumeInfo.publishedDate.split("-")[0] : "N/A"}</p>
                <p>Rating: ${volumeInfo.averageRating ? volumeInfo.averageRating : "N/A"}</p>
                <p>Status: ${available}</p>
            </div>
            `;
            bookList.innerHTML += bookElement;
        });
    } else {
        bookList.innerHTML = "<p>No highly rated books found.</p>";
    }
}

// Call the functions when the page loads
window.onload = function () {
    getPopularBooks(); // Fetch popular books
    getHighlyRatedBooks(); // Fetch highly rated books
};