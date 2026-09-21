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
    bio: 'Building a lifelong reading habit with Folia.',
    joinDate: new Date().toISOString()
  },
  settings: {
    annualGoal: 12,
    theme: 'dark'
  },
  books: [],
  readingLogs: [], // Array of { bookId, pagesRead, durationMinutes, timestamp }
  activeTargets: [], // Goals & challenges data
  quotes: [] // Saved favorite quotes
};

// Retrieve user data from localStorage with full schema fallbacks
function getUserData() {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('folia_user');
    if (!dataStr) return defaultUserData;

    const data = JSON.parse(dataStr);
    return {
      ...defaultUserData,
      ...data,
      profile: { ...defaultUserData.profile, ...(data.profile || {}) },
      settings: { ...defaultUserData.settings, ...(data.settings || {}) },
      books: data.books || [],
      readingLogs: data.readingLogs || [],
      activeTargets: data.activeTargets || data.goals || [],
      quotes: data.quotes || []
    };
  } catch (e) {
    console.error('Error reading user data:', e);
    return defaultUserData;
  }
}

// Save user data back to localStorage
function saveUserData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem('folia_user', JSON.stringify(data)); // Sync fallback key
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
 * Calculate real-time stats across all pages (books, logs, streaks, goals)
 */
function calculateReadingStats() {
  const data = getUserData();
  const books = data.books || [];
  const logs = data.readingLogs || [];

  const completedBooks = books.filter(b => b.status === 'finished');
  const currentlyReading = books.filter(b => b.status === 'reading');
  
  // Total pages read from completed + currently reading progress + logs fallback
  const totalPagesRead = books.reduce((sum, book) => {
    if (book.status === 'finished') return sum + (Number(book.totalPages) || 0);
    return sum + (Number(book.currentPage) || 0);
  }, 0);

  // Total reading time in minutes/hours
  const totalMinutes = logs.reduce((sum, log) => sum + (Number(log.durationMinutes) || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Daily average minutes computation
  const uniqueLogDays = new Set(
    logs
      .filter(l => l.timestamp)
      .map(l => new Date(l.timestamp).toDateString())
  );
  const activeDaysCount = uniqueLogDays.size || 1;
  const avgDailyMins = logs.length > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;

  // Streak calculation
  const { streakDays, longestStreak } = calculateStreak(logs);

  // Unique genres explored
  const genres = new Set(
    books
      .map(b => (b.category || b.genre || '').trim())
      .filter(c => c !== '' && c !== 'Uncategorized')
  );

  return {
    totalBooks: books.length,
    completedCount: completedBooks.length,
    readingCount: currentlyReading.length,
    wantToReadCount: books.filter(b => b.status === 'want').length,
    totalPagesRead,
    totalMinutes,
    avgDailyMins,
    formattedTime,
    streakDays,
    longestStreak,
    genresExplored: genres.size,
    annualGoal: data.settings?.annualGoal || 12
  };
}

/**
 * Internal helper to calculate current & longest reading streaks in days
 */
function calculateStreak(logs) {
  if (!logs || logs.length === 0) {
    return { streakDays: 0, longestStreak: 0 };
  }

  // Get unique sorted dates in YYYY-MM-DD format
  const dateStrings = [...new Set(
    logs
      .filter(l => l.timestamp && !isNaN(new Date(l.timestamp).getTime()))
      .map(l => new Date(l.timestamp).toISOString().split('T')[0])
  )].sort();

  if (dateStrings.length === 0) {
    return { streakDays: 0, longestStreak: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let streakDays = 0;
  let maxStreak = 0;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < dateStrings.length; i++) {
    const prev = new Date(dateStrings[i - 1]);
    const curr = new Date(dateStrings[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak);

  // Calculate active current streak
  const lastLoggedDate = dateStrings[dateStrings.length - 1];
  if (lastLoggedDate === todayStr || lastLoggedDate === yesterdayStr) {
    let currIndex = dateStrings.length - 1;
    streakDays = 1;

    while (currIndex > 0) {
      const current = new Date(dateStrings[currIndex]);
      const previous = new Date(dateStrings[currIndex - 1]);
      const diff = Math.round((current - previous) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        streakDays++;
        currIndex--;
      } else {
        break;
      }
    }
  }

  return {
    streakDays,
    longestStreak: Math.max(maxStreak, streakDays)
  };
}

/**
 * Authentication & Session Helpers
 */

// Check if a user is currently signed in
function isUserLoggedIn() {
  const data = getUserData();
  return Boolean(data.profile && data.profile.isLoggedIn);
}

// Log out the current user by updating session flag and redirecting
function logoutUser() {
  const data = getUserData();
  if (data.profile) {
    data.profile.isLoggedIn = false;
  }
  saveUserData(data);
  window.location.href = '../index.html';
}

// Optional: Auth guard to enforce login on protected pages (Dashboard, Analytics, Goals, Profile, Settings)
function requireAuth() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
  }
}
