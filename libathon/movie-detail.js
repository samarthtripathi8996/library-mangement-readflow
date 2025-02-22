// Function to fetch and display book details
async function fetchBookDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get("id"); // Get book ID from URL

    if (!bookId) {
        document.getElementById("book-detail").innerHTML = "<p>Invalid book ID.</p>";
        return;
    }

    const apiUrl = `https://www.googleapis.com/books/v1/volumes/${bookId}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || !data.volumeInfo) {
            document.getElementById("book-detail").innerHTML = "<p>Book details not found.</p>";
            return;
        }

        const book = data.volumeInfo;
        const bookDetailContainer = document.getElementById("book-detail");

        // HTML for book details
        bookDetailContainer.innerHTML = `
            <div class="book-container">
                <img src="${book.imageLinks?.thumbnail || 'placeholder.jpg'}" alt="${book.title}">
                <div class="book-info">
                    <h2>${book.title}</h2>
                    <p><strong>Author(s):</strong> ${book.authors ? book.authors.join(", ") : "Unknown"}</p>
                    <p><strong>Published Date:</strong> ${book.publishedDate || "N/A"}</p>
                    <p><strong>Rating:</strong> ${book.averageRating ? `${book.averageRating} ⭐` : "No Rating"}</p>
                    <p><strong>Review Count:</strong> ${book.ratingsCount || 0}</p>
                    <p><strong>Description:</strong> ${book.description || "No description available."}</p>
                    <a href="${book.infoLink}" target="_blank" class="btn">View on Google Books</a>
         </div>
            </div>
        `;
    } catch (error) {
        document.getElementById("book-detail").innerHTML = "<p>Failed to load book details.</p>";
        console.error("Error fetching book details:", error);
    }
}

// Call the function when the page loads
window.onload = fetchBookDetails;