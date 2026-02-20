import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminMenu } from '../hooks/useAdminMenu'
import AdminMenuList from '../components/AdminMenuList'
import ItemModal from '../components/ItemModal'
import './Admin.css'

/**
 * Admin page for managing menu items.
 * @returns {JSX.Element} Admin page layout.
 */
function Admin() {
  const { menu, loading, error, addItem, updateItem, deleteItem, toggleItem } = useAdminMenu()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [editingItem, setEditingItem] = useState(null)

  const filteredMenu = menu.filter((item) =>
    (item?.name || '').toString().toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  /**
   * Opens the modal for adding a new item.
   * @returns {void}
   */
  const handleAdd = () => {
    setModalMode('add')
    setEditingItem(null)
    setModalOpen(true)
  }

  /**
   * Opens the modal for editing an item.
   * @param {Object} item - Menu item to edit.
   * @returns {void}
   */
  const handleEdit = (item) => {
    setModalMode('edit')
    setEditingItem(item)
    setModalOpen(true)
  }

  /**
   * Persists item changes based on modal mode.
   * @param {Object} itemData - Item data from the modal.
   * @returns {Promise<void>}
   */
  const handleSave = async (itemData) => {
    try {
      if (modalMode === 'add') {
        await addItem(itemData)
        setSearchQuery('')
      } else if (editingItem) {
        await updateItem(editingItem.id, itemData)
      }
      setModalOpen(false)
      setEditingItem(null)
    } catch (error) {
      alert(error.message || 'Не удалось сохранить позицию')
    }
  }

  /**
   * Deletes a menu item after confirmation.
   * @param {number|string} id - Item id.
   * @returns {Promise<void>}
   */
  const handleDelete = async (id) => {
    if (confirm('Удалить позицию?')) {
      try {
        await deleteItem(id)
      } catch (error) {
        alert(error.message || 'Не удалось удалить позицию')
      }
    }
  }

  /**
   * Toggles item visibility.
   * @param {number|string} id - Item id.
   * @returns {Promise<void>}
   */
  const handleToggle = async (id) => {
    try {
      await toggleItem(id)
    } catch (error) {
      alert(error.message || 'Не удалось обновить позицию')
    }
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-header__title">Админ-панель</h1>
        <div className="admin-header__actions">
          <Link to="/" className="admin-link">
            ← К кассе
          </Link>
        </div>
      </header>

      <main>
        <div className="admin-controls">
          <div className="admin-search">
            <input
              type="text"
              className="admin-search-input"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
              >
                ✕
              </button>
            )}
          </div>
          <button className="admin-add-button" onClick={handleAdd} disabled={loading}>
            Добавить позицию
          </button>
        </div>

        {loading ? (
          <div className="admin-menu">
            <div className="admin-placeholder">Загрузка меню...</div>
          </div>
        ) : (
          <>
            {error && <div className="admin-placeholder">Offline mode: {error}</div>}
            <AdminMenuList
              items={filteredMenu}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>

      <ItemModal
        isOpen={modalOpen}
        mode={modalMode}
        item={editingItem}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditingItem(null)
        }}
      />
    </div>
  )
}

export default Admin

