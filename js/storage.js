// Dynamic localForage loader for IndexedDB binary file handling
function ensureLocalForage() {
  return new Promise((resolve) => {
    if (typeof localforage !== 'undefined') {
      localforage.ready().then(() => resolve(true)).catch(() => resolve(true));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js';
    script.onload = () => localforage.ready().then(() => resolve(true)).catch(() => resolve(true));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

ensureLocalForage();

// Global storage key
const STORAGE_KEY = 'folia_user_data';

// Default initial state
const defaultUserData = {
  profile: {
    name: 'Reader',
    email: '',
    joinDate: new Date().toISOString()
  },
  settings: {
    annualGoal: 12,
    theme: 'dark'
  },
  books: [],
  readingLogs: [] // Array of { bookId, pagesRead, durationMinutes, timestamp }
};

// Retrieve user data from localStorage
function getUserData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultUserData;
  } catch (e) {
    console.error('Error reading user data:', e);
    return defaultUserData;
  }
}

// Save user data back to localStorage
function saveUserData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Trigger custom event so open tabs or dynamic components can re-render
    window.dispatchEvent(new Event('foliaDataUpdated'));
  } catch (e) {
    console.error('Error saving user data:', e);
  }
}

/**
 * Save a book file to IndexedDB.
 */
async function saveBookFile(bookId, fileData) {
  try {
    await ensureLocalForage();
    await localforage.setItem(`book_file_${bookId}`, fileData);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

/**
 * Retrieve a book file from IndexedDB with fallback key support.
 */
async function getBookFile(bookId) {
  try {
    await ensureLocalForage();
    let file = await localforage.getItem(`book_file_${bookId}`);
    if (!file) {
      file = await localforage.getItem(`file_${bookId}`);
    }
    return file;
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
}

/**
 * Delete a book file from IndexedDB.
 */
async function deleteBookFile(bookId) {
  try {
    await ensureLocalForage();
    await localforage.removeItem(`book_file_${bookId}`);
    await localforage.removeItem(`file_${bookId}`);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Calculate real-time stats across all pages
 */
function calculateReadingStats() {
  const data = getUserData();
  const books = data.books || [];
  const logs = data.readingLogs || [];

  const completedBooks = books.filter(b => b.status === 'finished');
  const currentlyReading = books.filter(b => b.status === 'reading');
  
  // Total pages read from completed + currently reading progress
  const totalPagesRead = books.reduce((sum, book) => {
    if (book.status === 'finished') return sum + (book.totalPages || 0);
    return sum + (book.currentPage || 0);
  }, 0);

  // Total reading time in minutes/hours
  const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Unique genres explored
  const genres = new Set(
    books
      .map(b => b.category)
      .filter(c => c && c.trim() !== '' && c !== 'Uncategorized')
  );

  return {
    totalBooks: books.length,
    completedCount: completedBooks.length,
    readingCount: currentlyReading.length,
    wantToReadCount: books.filter(b => b.status === 'want').length,
    totalPagesRead,
    formattedTime,
    genresExplored: genres.size,
    annualGoal: data.settings?.annualGoal || 12
  };
}