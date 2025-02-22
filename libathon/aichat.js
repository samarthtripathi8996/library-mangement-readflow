// Constants and Configuration
const GEMINI_API_KEY = 'AIzaSyBCGlJlR_o9LFene_dbAbhR-s4wcpWxfHg';
const GOOGLE_BOOKS_API_KEY = 'YOUR_GOOGLE_BOOKS_API_KEY';
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class BookBuddyAI {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        
        this.conversationHistory = [];
        this.initializeEventListeners();
        this.displayWelcomeMessage();
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleUserInput());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
    }

    displayWelcomeMessage() {
        const welcomeMessage = `Hi! I'm BookBuddy AI, your personal book recommendation assistant. I can help you:
        • Find books based on your interests and preferences
        • Provide reviews and summaries of books
        • Suggest similar books to ones you've enjoyed
        • Give detailed information about specific books

        What kind of books are you interested in?`;
        
        this.addMessage(welcomeMessage, 'ai');
    }

    async handleUserInput() {
        const userMessage = this.userInput.value.trim();
        if (!userMessage) return;

        // Clear input and add user message to chat
        this.userInput.value = '';
        this.addMessage(userMessage, 'user');
        this.showTypingIndicator();

        try {
            // Process the message and get AI response
            const response = await this.processUserMessage(userMessage);
            this.hideTypingIndicator();
            this.addMessage(response.message, 'ai', response.books);
        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }

    async processUserMessage(message) {
        // Add message to conversation history
        this.conversationHistory.push({ role: 'user', content: message });

        // First, try to identify if we need to search for specific books
        const bookQuery = await this.generateBookSearchQuery(message);
        let books = [];
        
        if (bookQuery) {
            books = await this.searchGoogleBooks(bookQuery);
        }

        // Generate AI response using Gemini
        const aiResponse = await this.generateAIResponse(message, books);

        // Add AI response to conversation history
        this.conversationHistory.push({ role: 'ai', content: aiResponse });

        return {
            message: aiResponse,
            books: books
        };
    }

    async generateBookSearchQuery(userMessage) {
        const prompt = `Based on this user message, generate a search query for finding relevant books. If the message isn't asking for specific books, return null. Message: "${userMessage}"`;
        
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    async searchGoogleBooks(query) {
        const response = await fetch(
            `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=3`
        );
        
        const data = await response.json();
        return data.items?.map(book => ({
            title: book.volumeInfo.title,
            authors: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
            description: book.volumeInfo.description || 'No description available',
            thumbnail: book.volumeInfo.imageLinks?.thumbnail || '/api/placeholder/80/120',
            pageCount: book.volumeInfo.pageCount,
            publishedDate: book.volumeInfo.publishedDate,
            averageRating: book.volumeInfo.averageRating
        })) || [];
    }

    async generateAIResponse(userMessage, books) {
        let prompt = `You are BookBuddy AI, a helpful and knowledgeable book recommendation assistant. 
        Previous conversation: ${JSON.stringify(this.conversationHistory)}
        
        User message: "${userMessage}"
        ${books.length > 0 ? `Available books: ${JSON.stringify(books)}` : ''}
        
        Provide a helpful response that:
        1. Addresses the user's question or request
        2. If books were found, incorporate them naturally into your response
        3. Maintains a friendly and conversational tone
        4. Asks relevant follow-up questions when appropriate`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addMessage(message, sender, books = []) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = message;

        if (books.length > 0) {
            const booksContainer = document.createElement('div');
            booksContainer.className = 'books-container';
            
            books.forEach(book => {
                const bookCard = this.createBookCard(book);
                booksContainer.appendChild(bookCard);
            });
            
            contentElement.appendChild(booksContainer);
        }

        messageElement.appendChild(contentElement);
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    createBookCard(book) {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        bookCard.innerHTML = `
            <img src="${book.thumbnail}" alt="${book.title} cover">
            <div class="book-info">
                <h4>${book.title}</h4>
                <p>${book.authors}</p>
                ${book.averageRating ? `<p>Rating: ${book.averageRating}/5</p>` : ''}
                <p>${book.description.substring(0, 150)}${book.description.length > 150 ? '...' : ''}</p>
            </div>
        `;
        
        return bookCard;
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message ai';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        indicator.id = 'typingIndicator';
        this.chatMessages.appendChild(indicator);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const bookBuddy = new BookBuddyAI();
});