/**
 * Menu data hook for loading and exposing menu items and ordering.
 */
import { useState, useEffect } from "react";
import bundledMenu from "../data/defaultMenu.json";
import { fetchMenu } from "../utils/api";

const FALLBACK_MENU = normalizeMenuPayload(bundledMenu);

/**
 * Normalizes menu payload into a safe shape.
 * @param {any} payload - Raw payload.
 * @returns {{items: Array, activeOrder: Array}}
 */
function normalizeMenuPayload(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.menu)
      ? payload.menu
      : [];

  const activeOrder = Array.isArray(payload?.activeOrder)
    ? payload.activeOrder
    : items.filter((item) => item?.show).map((item) => item.id);

  return { items, activeOrder };
}

/**
 * React hook for loading and exposing menu data.
 * @returns {{
 *  menuItems: Array,
 *  activeOrder: Array,
 *  loading: boolean,
 *  error: string | null,
 *  reloadMenu: Function
 * }}
 */
export function useMenu() {
  const [menuItems, setMenuItems] = useState(FALLBACK_MENU.items);
  const [activeOrder, setActiveOrder] = useState(FALLBACK_MENU.activeOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  /**
   * Fetches menu data from the API and updates local state.
   * @returns {Promise<void>}
   */
  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchMenu();
      const normalized = normalizeMenuPayload(payload);
      if (normalized.items.length > 0) {
        setMenuItems(normalized.items);
        setActiveOrder(normalized.activeOrder);
      }
    } catch (err) {
      console.error("Menu load failed, fallback menu is used:", err);
      setError(err?.message || "Не удалось загрузить меню");
      setMenuItems(FALLBACK_MENU.items);
      setActiveOrder(FALLBACK_MENU.activeOrder);
    } finally {
      setLoading(false);
    }
  };

  return {
    menuItems,
    activeOrder,
    loading,
    error,
    reloadMenu: loadMenu,
  };
}
