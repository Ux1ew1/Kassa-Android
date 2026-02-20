/**
 * @file API utilities for interacting with the backend.
 */
import bundledMenu from "../data/defaultMenu.json";

const API_BASE = "/api";
const STATIC_MENU_PATH = "/menu.json";
const MENU_FETCH_TIMEOUT_MS = 2200;
const MENU_CACHE_KEY = "kassa.menu.cache.v1";

/**
 * Safely parses JSON from a fetch Response.
 * @param {Response} response - Fetch response.
 * @returns {Promise<any|null>} Parsed JSON or null.
 */
export async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Normalizes menu payload shape from API or static file.
 * @param {any} payload - Raw payload.
 * @returns {{items: Array, activeOrder: Array}}
 */
function normalizeMenuPayload(payload) {
  const source = Array.isArray(payload) ? { items: payload } : payload;

  const items = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.menu)
      ? source.menu
      : [];

  const activeOrder = Array.isArray(source?.activeOrder)
    ? source.activeOrder
    : items.filter((item) => item.show).map((item) => item.id);

  return { items, activeOrder };
}

/**
 * Checks whether payload looks like menu data.
 * @param {any} payload - Raw payload.
 * @returns {boolean}
 */
function isMenuPayload(payload) {
  if (Array.isArray(payload)) return true;
  if (!payload || typeof payload !== "object") return false;
  return (
    Array.isArray(payload.items) ||
    Array.isArray(payload.menu) ||
    Array.isArray(payload.activeOrder)
  );
}

/**
 * Reads cached menu from localStorage.
 * @returns {{items: Array, activeOrder: Array} | null}
 */
function readCachedMenu() {
  try {
    const raw = window.localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalized = normalizeMenuPayload(parsed);
    return normalized.items.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

/**
 * Persists menu cache to localStorage.
 * @param {{items: Array, activeOrder: Array}} payload - Menu payload.
 * @returns {void}
 */
function writeCachedMenu(payload) {
  try {
    window.localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota and private mode failures.
  }
}

/**
 * Executes fetch with timeout.
 * @param {string} url - Request URL.
 * @param {RequestInit} [options] - Fetch options.
 * @param {number} [timeoutMs] - Timeout in milliseconds.
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = MENU_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Loads menu data from the server.
 * @returns {Promise<{items: Array, activeOrder: Array}>}
 */
export async function fetchMenu() {
  const bundled = normalizeMenuPayload(bundledMenu);

  try {
    const response = await fetchWithTimeout(`${API_BASE}/menu`);
    const payload = await safeJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Menu loading failed");
    }
    if (!isMenuPayload(payload)) {
      throw new Error("Invalid menu payload");
    }

    const normalized = normalizeMenuPayload(payload);
    writeCachedMenu(normalized);
    return normalized;
  } catch (error) {
    console.warn(
      "Primary API is unavailable, trying static and bundled fallbacks:",
      error,
    );

    const cached = readCachedMenu();
    if (cached) {
      return cached;
    }

    try {
      const fallbackResponse = await fetchWithTimeout(STATIC_MENU_PATH);
      const fallbackPayload = await safeJson(fallbackResponse);

      if (fallbackResponse.ok && isMenuPayload(fallbackPayload)) {
        const normalized = normalizeMenuPayload(fallbackPayload);
        writeCachedMenu(normalized);
        return normalized;
      }
    } catch (staticError) {
      console.warn("Static fallback is unavailable:", staticError);
    }

    return bundled;
  }
}

/**
 * Persists menu data to the server.
 * @param {Array} items - Menu items.
 * @param {Array} activeOrder - Order of visible items.
 * @returns {Promise<any>} Server response payload.
 */
export async function saveMenu(items, activeOrder) {
  const normalized = normalizeMenuPayload({ items, activeOrder });
  writeCachedMenu(normalized);

  try {
    const response = await fetchWithTimeout(`${API_BASE}/menu`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: normalized.items,
        activeOrder: normalized.activeOrder,
      }),
    });

    const payload = await safeJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Menu saving failed");
    }

    return payload;
  } catch {
    return {
      message: "Menu was saved locally",
      menu: normalized.items,
      activeOrder: normalized.activeOrder,
      localOnly: true,
    };
  }
}

/**
 * Formats a price value in rubles.
 * @param {number} price - Numeric price.
 * @returns {string} Formatted price.
 */
export function formatPrice(price) {
  return `${price} руб.`;
}

/**
 * Validates a menu item shape.
 * @param {Object} item - Menu item object.
 * @returns {boolean} True if valid.
 */
export function validateMenuItem(item) {
  return (
    item &&
    typeof item.id !== "undefined" &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    typeof item.price === "number" &&
    item.price >= 0
  );
}
 
