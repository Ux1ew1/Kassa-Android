/**
 * Drawer with grouped coffee items across checks.
 */
import { useMemo } from "react";
import "./CoffeeMenuDrawer.css";

/**
 * Keywords used to detect coffee items.
 * @type {string[]}
 */
const COFFEE_KEYWORDS = [
  "коф",
  "капуч",
  "америк",
  "эспресс",
  "латт",
  "раф",
  "макиато",
];

/**
 * Checks whether a menu item is a coffee item.
 * @param {string} [name=""] - Item name.
 * @returns {boolean} True if coffee-related.
 */
function isCoffeeItem(name = "") {
  const normalized = name.toLowerCase();
  return COFFEE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Returns a short label for a coffee item.
 * @param {string} [name=""] - Item name.
 * @returns {string} Single-letter label.
 */
function getCoffeeLetter(name = "") {
  const normalized = name.toLowerCase();

  if (normalized.includes("капуч")) return "К";
  if (normalized.includes("амер")) return "А";
  if (normalized.includes("эспресс")) return "Э";
  if (normalized.includes("латт")) return "Л";
  if (normalized.includes("раф")) return "Р";
  if (normalized.includes("макиато")) return "М";

  const firstLetter = normalized.trim().charAt(0);
  return firstLetter ? firstLetter.toUpperCase() : "Рљ";
}

/**
 * Renders a drawer for marking coffee items as fulfilled.
 * @param {Object} props - Component props.
 * @param {boolean} props.open - Whether drawer is open.
 * @param {Function} props.onClose - Close handler.
 * @param {Array} [props.checks] - Checks list.
 * @param {number} props.activeCheckId - Active check id.
 * @param {Function} props.onToggleFulfilled - Toggle fulfilled handler.
 * @returns {JSX.Element|null} Drawer or null.
 */
function CoffeeMenuDrawer({
  open,
  onClose,
  checks = [],
  activeCheckId,
  onToggleFulfilled,
}) {
  const preparedChecks = useMemo(
    () =>
      checks
        .map((check) => {
          const withIndex = (check.items || []).map((item, index) => ({
            ...item,
            index,
          }));

          const coffeeItems = withIndex.filter((item) =>
            isCoffeeItem(item?.name || ""),
          );

          return {
            id: check.id,
            hasCoffee: coffeeItems.length > 0,
            squareItems: coffeeItems.map((item) => ({
              key: `${check.id}-${item.index}`,
              name: item.name,
              letter: getCoffeeLetter(item.name),
              fulfilled: Boolean(item.fulfilled),
              index: item.index,
            })),
          };
        })
        .filter((check) => check.hasCoffee),
    [checks],
  );

  if (!open) {
    return null;
  }

  const handleSquareToggle = (checkId, itemIndex, fulfilled) => {
    onToggleFulfilled?.([itemIndex], fulfilled, checkId);
  };

  return (
    <div className="coffee-menu-overlay" onClick={onClose}>
      <div
        className="coffee-menu-panel"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="coffee-menu-header">
          <div>
            <div className="coffee-menu-title">Кофейные позиции</div>
            <div className="coffee-menu-subtitle">
              {preparedChecks.length > 0
                ? "Дублируем кофе по каждому чеку"
                : "Чеки отсутствуют"}
            </div>
          </div>
          <button
            className="coffee-menu-close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        <div className="coffee-menu-list">
          {preparedChecks.length === 0 && (
            <div className="coffee-menu-empty">
              Создайте чек, чтобы увидеть его содержимое
            </div>
          )}

          {preparedChecks.map((check) => (
            <div
              key={check.id}
              className={`coffee-menu-row${
                check.id === activeCheckId ? " coffee-menu-row--active" : ""
              }`}
            >
              <div className="coffee-menu-check">
                <span className="coffee-menu-check-label">Чек</span>
                <span className="coffee-menu-check-number">№{check.id}</span>
              </div>

              <div className="coffee-menu-squares">
                {check.squareItems.length === 0 ? (
                  <span className="coffee-menu-empty-inline">Кофе нет</span>
                ) : (
                  check.squareItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`coffee-square${
                        item.fulfilled ? " coffee-square--fulfilled" : ""
                      }`}
                      onClick={() =>
                        handleSquareToggle(
                          check.id,
                          item.index,
                          !item.fulfilled,
                        )
                      }
                      title={item.name}
                      aria-label={item.name}
                    >
                      <span className="coffee-square-letter">
                        {item.letter}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CoffeeMenuDrawer;
