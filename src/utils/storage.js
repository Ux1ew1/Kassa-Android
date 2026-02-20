/**
 * @file Storage utilities for persisting checks in localStorage.
 */

const STORAGE_KEYS = {
  CHECKS: 'checks',
  ACTIVE_CHECK_ID: 'activeCheckId',
};

/**
 * Persists checks to localStorage.
 * @param {Array} checks - Checks array.
 * @param {number} activeCheckId - Active check id.
 * @returns {void}
 */
export function saveChecks(checks, activeCheckId) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKS, JSON.stringify(checks));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHECK_ID, String(activeCheckId));
  } catch (error) {
    console.error('?????? ?????????? ?????:', error);
  }
}

/**
 * Loads checks from localStorage.
 * @returns {{checks: Array, activeCheckId: number}}
 */
export function loadChecks() {
  try {
    const checksData = localStorage.getItem(STORAGE_KEYS.CHECKS);
    const activeCheckIdData = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHECK_ID);
    
    const checks = checksData
      ? JSON.parse(checksData)
      : [{ id: 1, items: [], price: 0, change: 0 }];
    
    const activeCheckId = activeCheckIdData
      ? parseInt(activeCheckIdData, 10) || 1
      : 1;
    
    return { checks, activeCheckId };
  } catch (error) {
    console.error('?????? ???????? ?????:', error);
    return {
      checks: [{ id: 1, items: [], price: 0, change: 0 }],
      activeCheckId: 1,
    };
  }
}

/**
 * Clears all localStorage data.
 * @returns {void}
 */
export function clearStorage() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('?????? ??????? localStorage:', error);
  }
}
