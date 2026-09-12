/* ==========================================================================
   Folia Central App Manager (js/app.js)
   ========================================================================== */

// --- Blank Default User Data Structure ---
const blankUserData = {
  name: "Reader",
  readingGoal: 0,
  dailyGoalMins: 0,
  favoriteGenres: [],
  theme: "warm-earth",
  stats: {
    booksCompleted: 0,
    pagesRead: 0,
    currentStreak: 0,
    longestStreak: 0
  },
  currentlyReading: null
};

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

// --- Data Access Layer Wrappers ---
function getStoredUser() {
  if (typeof getUserData === 'function') {
    return getUserData();
  }
  const data = localStorage.getItem('folia_user');
  return data ? JSON.parse(data) : blankUserData;
}

function saveUser(userData) {
  if (typeof saveUserData === 'function') {
    saveUserData(userData);
    return;
  }
  localStorage.setItem('folia_user', JSON.stringify(userData));
}

function getLibraryData() {
  if (typeof getLibrary === 'function') {
    return getLibrary();
  }
  const data = localStorage.getItem('folia_library');
  return data ? JSON.parse(data) : [];
}

function saveLibraryData(libraryArray) {
  if (typeof saveUserData === 'function') {
    const data = getUserData();
    data.books = libraryArray;
    saveUserData(data);
    return;
  }
  localStorage.setItem('folia_library', JSON.stringify(libraryArray));
}

// --- Quote Management ---
function addQuoteToBook(bookId, quoteText, pageNum) {
  const library = getLibraryData();
  const book = library.find(b => String(b.id) === String(bookId));
  
  if (book) {
    if (!book.quotes) book.quotes = [];
    book.quotes.push({
      id: Date.now(),
      text: quoteText,
      page: pageNum || null,
      addedAt: new Date().toLocaleDateString()
    });
    
    if (typeof saveBookToLibraryMetadata === 'function') {
      saveBookToLibraryMetadata(book);
    } else {
      saveLibraryData(library);
    }
  }
}

// --- Theme Handler ---
function applySavedTheme() {
  const user = getStoredUser();
  const theme = user?.profile?.theme || user?.theme || 'warm-earth';
  document.documentElement.setAttribute('data-theme', theme);
}

// --- Mobile Navigation Drawer Handler ---
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const closeBtn = document.getElementById('mobileNavClose');
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  const openMenu = () => {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  toggleBtn?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
}

// --- Dynamic Active Sidebar Link Detector ---
function initActiveSidebarLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidebar .nav-menu a');

  if (!navLinks.length) return;

  const currentFile = currentPath.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const parentLi = link.closest('.nav-item');
    if (!parentLi) return;

    // Reset pre-existing active states
    parentLi.classList.remove('active');

    const href = link.getAttribute('href');
    if (!href) return;

    const linkFile = href.split('/').pop();

    if (
      currentFile === linkFile ||
      (currentFile === '' && (linkFile === 'index.html' || linkFile === 'dashboard.html'))
    ) {
      parentLi.classList.add('active');
    }
  });
}

// --- Central Application Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  initMobileNavigation();
  initActiveSidebarLink();
});