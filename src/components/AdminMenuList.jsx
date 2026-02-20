/**
 * Admin menu list component.
 */
import "./AdminMenuList.css";

/**
 * Normalizes a category label to a human-readable name.
 * @param {string} value - Raw category value.
 * @returns {string} Display label.
 */
const normalizeCategory = (value) => {
  const v = (value || "").toString().trim().toLowerCase();
  if (["all", "все"].includes(v)) return "Все";
  if (["drink", "drinks", "напитки"].includes(v)) return "Напитки";
  if (["food", "еда"].includes(v)) return "Еда";
  if (["alcohol", "alcoholic", "алкоголь"].includes(v)) return "Алкоголь";
  if (["other", "misc", "остальное", "другое"].includes(v)) return "Остальное";
  return "Остальное";
};

/**
 * Renders the admin menu items list.
 * @param {Object} props - Component props.
 * @param {Array} props.items - Menu items.
 * @param {Function} props.onToggle - Toggle visibility handler.
 * @param {Function} props.onEdit - Edit handler.
 * @param {Function} props.onDelete - Delete handler.
 * @returns {JSX.Element} Admin menu list.
 */
function AdminMenuList({ items, onToggle, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="admin-menu">
        <div className="admin-placeholder">
          Меню пока пустое. Добавьте первую позицию.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-menu">
      {items.map((item) => (
        <div
          key={item.id}
          className={`admin-item${item.show ? "" : " admin-item--inactive"}`}
        >
          <div className="admin-item__info">
            <span className="admin-item__name">{item.name}</span>
            <span className="admin-item__price">{item.price} руб.</span>
            <span className="admin-item__category">
              Категория: {normalizeCategory(item.category)}
            </span>
            <span className="admin-item__status">
              {item.show ? "Активно" : "Скрыто"}
            </span>
          </div>
          <div className="admin-item__actions">
            <button
              className="admin-item__button"
              onClick={() => onToggle(item.id)}
              type="button"
            >
              {item.show ? "Скрыть" : "Показать"}
            </button>
            <button
              className="admin-item__button"
              onClick={() => onEdit(item)}
              type="button"
            >
              Изменить
            </button>
            <button
              className="admin-item__button admin-item__button--danger"
              onClick={() => onDelete(item.id)}
              type="button"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminMenuList;
