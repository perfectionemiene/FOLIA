// js/storage.js

const DEFAULT_USER_DATA = {
  profile: {
    name: "Reader"
  },
  goal: {
    targetBooks: 0,
    completedBooks: 0
  },
  stats: {
    booksCompleted: 0,
    pagesRead: 0,
    streakDays: 0
  },
  currentlyReading: null, // No book currently active
  books: []               // Empty library
};

// Fetch data from LocalStorage or initialize default empty state
function getUserData() {
  const data = localStorage.getItem('folia_user_data');
  if (!data) {
    localStorage.setItem('folia_user_data', JSON.stringify(DEFAULT_USER_DATA));
    return DEFAULT_USER_DATA;
  }
  return JSON.parse(data);
}

// Save updated user data back to LocalStorage
function saveUserData(data) {
  localStorage.setItem('folia_user_data', JSON.stringify(data));
}