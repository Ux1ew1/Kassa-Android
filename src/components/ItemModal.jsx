/**
 * Modal for creating or editing a menu item.
 */
import { useState, useEffect } from "react";
import "./ItemModal.css";

/**
 * Allowed menu categories.
 * @type {string[]}
 */
const CATEGORY_OPTIONS = [
  { label: "Напитки", value: "напитки" },
  { label: "Еда", value: "еда" },
  { label: "Алкоголь", value: "алкоголь" },
  { label: "Остальное", value: "остальное" },
];

/**
 * Normalizes a category label to a supported slug.
 * @param {string} value - Raw category value.
 * @returns {string} Normalized slug.
 */
const normalizeCategory = (value) => {
  const v = (value || "").toString().trim().toLowerCase();
  if (["all", "все"].includes(v)) return "все";
  if (["drink", "drinks", "напитки"].includes(v)) return "напитки";
  if (["food", "еда"].includes(v)) return "еда";
  if (["alcohol", "alcoholic", "алкоголь"].includes(v)) return "алкоголь";
  if (["other", "misc", "остальное", "другое"].includes(v)) return "остальное";
  return "остальное";
};

/**
 * Renders a modal form for a menu item.
 * @param {Object} props - Component props.
 * @param {boolean} props.isOpen - Whether modal is open.
 * @param {'add'|'edit'} props.mode - Modal mode.
 * @param {Object|null} props.item - Item to edit.
 * @param {Function} props.onSave - Save handler.
 * @param {Function} props.onClose - Close handler.
 * @returns {JSX.Element|null} Modal or null.
 */
function ItemModal({ isOpen, mode, item, onSave, onClose }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("остальное");
  const [show, setShow] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && item) {
        setName(item.name || "");
        setPrice(item.price?.toString() || "");
        setCategory(normalizeCategory(item.category));
        setShow(item.show !== undefined ? item.show : true);
      } else {
        setName("");
        setPrice("");
        setCategory("остальное");
        setShow(true);
      }
    }
  }, [isOpen, mode, item]);

  /**
   * Validates and submits form data.
   * @param {Event} e - Form submit event.
   * @returns {void}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedPrice = (price || "").toString().replace(",", ".").trim();
    const priceNum = Number(normalizedPrice);
    const normalizedCategory = normalizeCategory(category);

    if (!name.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      alert("Введите корректные данные");
      return;
    }
    setIsSaving(true);
    try {
      await Promise.resolve(
        onSave({
          name: name.trim(),
          price: priceNum,
          show,
          category: normalizedCategory,
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "edit" ? "Редактирование позиции" : "Новая позиция"}</h3>
        <form onSubmit={handleSubmit} noValidate>
          <span className="modal-label">Название </span>
          <input
            type="text"
            className="modal-input"
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <span className="modal-label">Стоимость</span>
          <input
            type="number"
            className="modal-input"
            placeholder="Цена"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            min="0"
            step="0.01"
          />
          <label className="modal-label" htmlFor="category">
            Категория
          </label>
          <select
            id="category"
            className="modal-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="modal-checkbox">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Активна
          </label>
          <div className="modal-actions">
            <button type="submit" className="modal-button" disabled={isSaving}>
              {isSaving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              type="button"
              className="modal-button modal-button--secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
