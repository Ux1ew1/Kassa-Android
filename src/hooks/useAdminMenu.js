/**
 * Admin menu management hook.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchMenu, saveMenu, validateMenuItem } from '../utils/api'
import bundledMenu from '../data/defaultMenu.json'

function normalizeMenuPayload(payload) {
  const source = Array.isArray(payload) ? { items: payload } : payload
  const items = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.menu)
      ? source.menu
      : []
  const activeOrder = Array.isArray(source?.activeOrder)
    ? source.activeOrder
    : items.filter((item) => item?.show).map((item) => item.id)
  return { items, activeOrder }
}

const FALLBACK_MENU = normalizeMenuPayload(bundledMenu)

function getNextItemId(items) {
  const numericIds = items
    .map((item) => Number(item?.id))
    .filter((id) => Number.isFinite(id) && id >= 0)

  if (numericIds.length === 0) {
    return Date.now()
  }

  return Math.max(...numericIds) + 1
}

/**
 * React hook for managing menu items from the admin panel.
 * @returns {{
 *  menu: Array,
 *  activeOrder: Array,
 *  loading: boolean,
 *  error: string | null,
 *  addItem: Function,
 *  updateItem: Function,
 *  deleteItem: Function,
 *  toggleItem: Function,
 *  reloadMenu: Function
 * }}
 */
export function useAdminMenu() {
  const [menu, setMenu] = useState([])
  const [activeOrder, setActiveOrder] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const revisionRef = useRef(0)

  useEffect(() => {
    loadMenu()
  }, [])

  /**
   * Fetches menu data from the API and updates local state.
   * @returns {Promise<void>}
   */
  const loadMenu = async () => {
    const loadRevision = revisionRef.current
    setLoading(true)
    setError(null)
    try {
      const { items, activeOrder: order } = await fetchMenu()
      if (revisionRef.current !== loadRevision) {
        return
      }
      setMenu(items)
      setActiveOrder(order)
    } catch (err) {
      if (revisionRef.current !== loadRevision) {
        return
      }
      console.error('?????? ???????? ????:', err)
      setError(err.message)
      setMenu(FALLBACK_MENU.items)
      setActiveOrder(FALLBACK_MENU.activeOrder)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Ensures active order contains valid, visible items with no duplicates.
   * @param {Array} items - Menu items.
   * @param {Array} order - Current active order.
   * @returns {Array} Sanitized active order.
   */
  const ensureActiveOrderConsistency = useCallback((items, order) => {
    const validIds = new Set(items.map((item) => item.id))
    const seen = new Set()
    const ordered = []

    order.forEach((id) => {
      if (validIds.has(id) && !seen.has(id)) {
        ordered.push(id)
        seen.add(id)
      }
    })

    items.forEach((item) => {
      if (item.show && !seen.has(item.id)) {
        ordered.push(item.id)
        seen.add(item.id)
      }
    })

    return ordered
  }, [])

  /**
   * Saves menu changes to the API and updates local state.
   * @param {Array} newMenu - Updated menu.
   * @param {Array} newOrder - Updated order.
   * @returns {Promise<void>}
   */
  const persistChanges = async (newMenu, newOrder) => {
    const consistentOrder = ensureActiveOrderConsistency(newMenu, newOrder)
    revisionRef.current += 1
    try {
      await saveMenu(newMenu, consistentOrder)
      setMenu(newMenu)
      setActiveOrder(consistentOrder)
    } catch (err) {
      console.error('?????? ?????????? ????:', err)
      throw err
    }
  }

  /**
   * Adds a new menu item.
   * @param {Object} itemData - Item fields.
   * @returns {Promise<void>}
   */
  const addItem = async (itemData) => {
    const newId = getNextItemId(menu)
    const newItem = { id: newId, ...itemData }

    if (!validateMenuItem(newItem)) {
      throw new Error('???????????? ?????? ???????')
    }

    const newMenu = [...menu, newItem]
    const newOrder = itemData.show
      ? [...activeOrder.filter((id) => id !== newId), newId]
      : activeOrder

    await persistChanges(newMenu, newOrder)
  }

  /**
   * Updates an existing menu item.
   * @param {number|string} id - Item id.
   * @param {Object} itemData - Updated fields.
   * @returns {Promise<void>}
   */
  const updateItem = async (id, itemData) => {
    const itemIndex = menu.findIndex((item) => item.id === id)
    if (itemIndex === -1) {
      throw new Error('??????? ?? ???????')
    }

    const updatedItem = { ...menu[itemIndex], ...itemData }

    if (!validateMenuItem(updatedItem)) {
      throw new Error('???????????? ?????? ???????')
    }

    const newMenu = [...menu]
    newMenu[itemIndex] = updatedItem

    let newOrder = [...activeOrder]
    if (updatedItem.show) {
      newOrder = [...newOrder.filter((itemId) => itemId !== id), id]
    } else {
      newOrder = newOrder.filter((itemId) => itemId !== id)
    }

    await persistChanges(newMenu, newOrder)
  }

  /**
   * Deletes a menu item.
   * @param {number|string} id - Item id.
   * @returns {Promise<void>}
   */
  const deleteItem = async (id) => {
    const newMenu = menu.filter((item) => item.id !== id)
    const newOrder = activeOrder.filter((itemId) => itemId !== id)

    await persistChanges(newMenu, newOrder)
  }

  /**
   * Toggles menu item visibility.
   * @param {number|string} id - Item id.
   * @returns {Promise<void>}
   */
  const toggleItem = async (id) => {
    const item = menu.find((item) => item.id === id)
    if (!item) return

    await updateItem(id, { show: !item.show })
  }

  return {
    menu,
    activeOrder,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    reloadMenu: loadMenu,
  }
}
