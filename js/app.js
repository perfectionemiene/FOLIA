/* ==========================================================================
   Folia Central App Manager (js/app.js)
   ========================================================================== */

// Default Fallback User Data
const defaultUserData = {
  name: "Perfection",
  readingGoal: 30, // Annual book target
  dailyGoalMins: 30,
  favoriteGenres: ["Self-Improvement", "Fiction", "Philosophy"],
  stats: {
    booksCompleted: 18,
    pagesRead: 4120,
    currentStreak: 12,
    longestStreak: 21
  },
  currentlyReading: {
    title: "Atomic Habits",
    author: "James Clear",
    currentChapter: 8,
    totalChapters: 20,
    currentPage: 220,
    totalPages: 320
  }
};

// Default Fallback Library Data
const defaultLibraryData = [
  { id: 1, title: "Atomic Habits", author: "James Clear", status: "reading", pages: 320, category: "Productivity", rating: 5 },
  { id: 2, title: "Deep Work", author: "Cal Newport", status: "finished", pages: 304, category: "Focus", rating: 5 },
  { id: 3, title: "Psychology of Money", author: "Morgan Housel", status: "want", pages: 252, category: "Finance", rating: 4 }
];

// --- User Profile Functions ---
function getStoredUser() {
  const data = localStorage.getItem('folia_user');
  return data ? JSON.parse(data) : defaultUserData;
}

function saveUser(userData) {
  localStorage.setItem('folia_user', JSON.stringify(userData));
}

// --- Library Functions ---
function getLibrary() {
  const data = localStorage.getItem('folia_library');
  return data ? JSON.parse(data) : defaultLibraryData;
}

function saveLibrary(libraryArray) {
  localStorage.setItem('folia_library', JSON.stringify(libraryArray));
}

function addBookToLibrary(newBook) {
  const library = getLibrary();
  library.push({ id: Date.now(), ...newBook });
  saveLibrary(library);
}

// --- Utility: HTML Sanitizer ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

function applySavedTheme() {
  const user = getStoredUser();
  const theme = user?.theme || 'warm-earth';
  document.documentElement.setAttribute('data-theme', theme);
}

// Call on page load across all pages
document.addEventListener('DOMContentLoaded', applySavedTheme);

function addQuoteToBook(bookId, quoteText, pageNum) {
  const library = getLibrary();
  const book = library.find(b => b.id === bookId);
  
  if (book) {
    if (!book.quotes) book.quotes = [];
    book.quotes.push({
      id: Date.now(),
      text: quoteText,
      page: pageNum || null,
      addedAt: new Date().toLocaleDateString()
    });
    saveLibrary(library);
  }
}

// Initialize Mobile Navigation Drawer
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const closeBtn = document.getElementById('mobileNavClose');
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  const openMenu = () => {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
  };

  const closeMenu = () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
  };

  toggleBtn?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
}

// Auto-run on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
});