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

const STORAGE_KEY = 'folia_user_data';

function getUserData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return { books: [] };
  try { return JSON.parse(data); } catch (e) { return { books: [] }; }
}

function saveUserData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Save a book file to IndexedDB.
 */
async function saveBookFile(bookId, fileData) {
  try {
    await ensureLocalForage();
    // Use consistent key format across all pages
    await localforage.setItem(`book_file_${bookId}`, fileData);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

async function getBookFile(bookId) {
  try {
    await ensureLocalForage();
    // Try both key variants for backward compatibility
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

async function deleteBookFile(bookId) {
  try {
    await ensureLocalForage();
    await localforage.removeItem(`book_file_${bookId}`);
    await localforage.removeItem(`file_${bookId}`);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}