/**
 * Menu item card component.
 */
import "./MenuItem.css";

/**
 * Renders a single menu item card.
 * @param {Object} props - Component props.
 * @param {{id: number|string, name: string, price: number}} props.item - Menu item.
 * @param {number} [props.quantity=0] - Count of item in cart.
 * @param {Function} props.onAdd - Add handler.
 * @returns {JSX.Element} Menu item card.
 */
function MenuItem({ item, quantity = 0, onAdd }) {
  const handleClick = () => {
    onAdd(item);
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  return (
    <div
      className="item"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <span className="item-name">{item.name}</span>
      <div className="item-footer">
        <span className="item-price">{item.price} руб.</span>
        {quantity > 0 && <span className="item-quantity">x{quantity}</span>}
      </div>
    </div>
  );
}

export default MenuItem;
