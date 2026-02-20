/**
 * Menu list component with ordering and filtering.
 */
import { useMemo } from "react";
import MenuItem from "./MenuItem";
import "./Menu.css";

const CATEGORY_ORDER = ["напитки", "еда", "алкоголь", "остальное"];
const CATEGORY_LABELS = {
  напитки: "Напитки",
  еда: "Еда",
  алкоголь: "Алкоголь",
  остальное: "Остальное",
};

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
 * Renders menu items list.
 * @param {Object} props - Component props.
 * @param {Array} props.menuItems - Menu items.
 * @param {Array} props.activeOrder - Preferred order of visible items.
 * @param {string} props.searchQuery - Search query.
 * @param {string} [props.activeCategory] - Active category slug.
 * @param {Array} [props.cartItems] - Items from active check.
 * @param {Function} props.onAddItem - Add item handler.
 * @returns {JSX.Element} Menu list.
 */
function Menu({
  menuItems,
  activeOrder,
  searchQuery,
  activeCategory = "",
  cartItems = [],
  onAddItem,
}) {
  const itemCounts = useMemo(() => {
    const counts = new Map();
    cartItems.forEach((cartItem) => {
      counts.set(cartItem.id, (counts.get(cartItem.id) || 0) + 1);
    });
    return counts;
  }, [cartItems]);

  const preparedItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const orderIndex = new Map(
      activeOrder.map((id, index) => [String(id), index]),
    );

    return menuItems
      .filter((item) => Boolean(item?.show))
      .filter((item) => {
        const itemCategory = normalizeCategory(item.category);
        const matchesSearch =
          query === "" || item.name.toLowerCase().includes(query);
        const matchesCategory =
          !activeCategory || itemCategory === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((left, right) => {
        const leftOrder = orderIndex.get(String(left.id));
        const rightOrder = orderIndex.get(String(right.id));

        if (typeof leftOrder === "number" && typeof rightOrder === "number") {
          return leftOrder - rightOrder;
        }
        if (typeof leftOrder === "number") return -1;
        if (typeof rightOrder === "number") return 1;

        return left.name.localeCompare(right.name, "ru");
      });
  }, [menuItems, activeOrder, searchQuery, activeCategory]);

  const sections = useMemo(() => {
    const grouped = new Map();

    preparedItems.forEach((item) => {
      const category = normalizeCategory(item.category);
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category).push(item);
    });

    const remainingCategories = Array.from(grouped.keys()).filter(
      (category) => !CATEGORY_ORDER.includes(category),
    );

    const sortedCategories = [...CATEGORY_ORDER, ...remainingCategories]
      .filter((category) => grouped.has(category))
      .filter((category) =>
        activeCategory ? category === activeCategory : true,
      );

    return sortedCategories.map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category] || category,
      items: grouped.get(category) || [],
    }));
  }, [preparedItems, activeCategory]);

  if (sections.length === 0) {
    return (
      <div className="menu">
        <div className="menu-placeholder">
          {searchQuery ? "Товары не найдены" : "Нет доступных товаров."}
        </div>
      </div>
    );
  }

  return (
    <div className="menu">
      {sections.map((section) => (
        <section key={section.id} className="menu-section">
          <header className="menu-section__header">
            <h2 className="menu-section__title">{section.label}</h2>
            <span className="menu-section__count">{section.items.length}</span>
          </header>
          <div className="menu-section__items">
            {section.items.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                quantity={itemCounts.get(item.id) || 0}
                onAdd={onAddItem}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Коммент
export default Menu;
