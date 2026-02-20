/**
 * Checks (receipts) state management hook.
 */
import { useState, useEffect } from 'react'
import { loadChecks, saveChecks } from '../utils/storage'

/**
 * React hook for managing checks and their items.
 * @returns {{
 *  checks: Array,
 *  activeCheckId: number,
 *  setActiveCheckId: Function,
 *  getActiveCheck: Function,
 *  addItemToCheck: Function,
 *  removeItemFromCheck: Function,
 *  updateCheckChange: Function,
 *  createNewCheck: Function,
 *  completeCheck: Function,
 *  toggleItemsFulfilled: Function
 * }}
 */
export function useChecks() {
  const [checks, setChecks] = useState([])
  const [activeCheckId, setActiveCheckId] = useState(1)

  useEffect(() => {
    const { checks: loadedChecks, activeCheckId: loadedId } = loadChecks()
    setChecks(loadedChecks)
    setActiveCheckId(loadedId)
  }, [])

  useEffect(() => {
    if (checks.length > 0) {
      saveChecks(checks, activeCheckId)
    }
  }, [checks, activeCheckId])

  /**
   * Returns the active check object.
   * @returns {Object|undefined}
   */
  const getActiveCheck = () => {
    return checks.find((check) => check.id === activeCheckId)
  }

  /**
   * Adds a menu item to the active check.
   * @param {{id: number|string, name: string, price: number}} item - Menu item.
   * @returns {void}
   */
  const addItemToCheck = (item) => {
    setChecks((prevChecks) =>
      prevChecks.map((check) => {
        if (check.id === activeCheckId) {
          return {
            ...check,
            items: [
              ...check.items,
              { id: item.id, name: item.name, price: item.price, fulfilled: false },
            ],
            price: check.price + item.price,
          }
        }
        return check
      })
    )
  }

  /**
   * Removes an item from the active check by index.
   * @param {number} index - Item index in the check.
   * @returns {void}
   */
  const removeItemFromCheck = (index) => {
    setChecks((prevChecks) =>
      prevChecks.map((check) => {
        if (check.id === activeCheckId) {
          const removed = check.items[index]
          const newItems = check.items.filter((_, i) => i !== index)
          return {
            ...check,
            items: newItems,
            price: check.price - (removed?.price || 0),
          }
        }
        return check
      })
    )
  }

  /**
   * Toggles fulfillment state for items within a check.
   * @param {number[]} indices - Indices of items to toggle.
   * @param {boolean} fulfilled - New fulfillment value.
   * @param {number} [targetCheckId=activeCheckId] - Target check id.
   * @returns {void}
   */
  const toggleItemsFulfilled = (indices = [], fulfilled, targetCheckId = activeCheckId) => {
    if (!Array.isArray(indices) || indices.length === 0) {
      return
    }

    setChecks((prevChecks) =>
      prevChecks.map((check) => {
        if (check.id !== targetCheckId) {
          return check
        }

        const newItems = check.items.map((item, idx) =>
          indices.includes(idx) ? { ...item, fulfilled } : item
        )

        return {
          ...check,
          items: newItems,
        }
      })
    )
  }

  /**
   * Updates the change for the active check.
   * @param {number} given - Amount given by the customer.
   * @returns {void}
   */
  const updateCheckChange = (given) => {
    setChecks((prevChecks) =>
      prevChecks.map((check) => {
        if (check.id === activeCheckId) {
          return {
            ...check,
            change: Math.max(0, given - check.price),
          }
        }
        return check
      })
    )
  }

  /**
   * Creates a new check and sets it as active.
   * @returns {void}
   */
  const createNewCheck = () => {
    const newId = checks.length > 0 ? Math.max(...checks.map((c) => c.id)) + 1 : 1
    setChecks((prevChecks) => [
      ...prevChecks,
      { id: newId, items: [], price: 0, change: 0 },
    ])
    setActiveCheckId(newId)
  }

  /**
   * Completes the active check and removes it.
   * @returns {void}
   */
  const completeCheck = () => {
    setChecks((prevChecks) => {
      const filtered = prevChecks.filter((check) => check.id !== activeCheckId)
      if (filtered.length === 0) {
        return [{ id: 1, items: [], price: 0, change: 0 }]
      }
      return filtered
    })
    setActiveCheckId((prevId) => {
      const filtered = checks.filter((check) => check.id !== prevId)
      if (filtered.length === 0) {
        return 1
      }
      return filtered[filtered.length - 1].id
    })
  }

  return {
    checks,
    activeCheckId,
    setActiveCheckId,
    getActiveCheck,
    addItemToCheck,
    removeItemFromCheck,
    updateCheckChange,
    createNewCheck,
    completeCheck,
    toggleItemsFulfilled,
  }
}
