/**
 * Cart component for displaying items in the active check.
 */
import { formatPrice } from '../utils/api'
import './Cart.css'

/**
 * Groups cart items by menu item id.
 * @param {Array} [items=[]] - Cart items.
 * @returns {Array} Grouped items with totals and indices.
 */
function groupCartItems(items = []) {
  const groups = []
  const map = new Map()

  items.forEach((item, index) => {
    if (!map.has(item.id)) {
      const group = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 0,
        totalPrice: 0,
        indices: [],
        fulfilledCount: 0,
      }
      map.set(item.id, group)
      groups.push(group)
    }

    const group = map.get(item.id)
    group.quantity += 1
    group.totalPrice += item.price
    group.indices.push(index)
    if (item.fulfilled) {
      group.fulfilledCount += 1
    }
  })

  return groups
}

/**
 * Renders the cart contents.
 * @param {Object} props - Component props.
 * @param {Array} props.items - Cart items.
 * @param {Function} [props.onRemove] - Remove handler by index.
 * @param {Function} [props.onToggleFulfilled] - Toggle fulfilled handler.
 * @returns {JSX.Element} Cart list.
 */
function Cart({ items, onRemove, onToggleFulfilled }) {
  if (items.length === 0) {
    return (
      <div className="cart">
        <div className="cart-empty">Корзина пуста</div>
      </div>
    )
  }

  const groupedItems = groupCartItems(items)

  return (
    <div className="cart">
      {groupedItems.map((item) => {
        const isFulfilled = item.quantity > 0 && item.fulfilledCount === item.quantity

        return (
          <div
            key={item.id}
            className={`cart__item${isFulfilled ? ' cart__item--fulfilled' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (typeof onToggleFulfilled === 'function') {
                onToggleFulfilled(item.indices, !isFulfilled)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (typeof onToggleFulfilled === 'function') {
                  onToggleFulfilled(item.indices, !isFulfilled)
                }
              }
            }}
          >
            <div className="cart__item-container">
              <div className="cart__item-name">
                <span>{item.name}</span>
                <span className="cart__item-qty">x{item.quantity}</span>
              </div>
              <div className="cart__item-price">
                <span className="cart__item-price-total">{formatPrice(item.totalPrice)}</span>
                {item.quantity > 1 && (
                  <span className="cart__item-price-each">{formatPrice(item.price)} за шт.</span>
                )}
              </div>
            </div>
            <button
              className="remove-item"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                if (typeof onRemove === 'function' && item.indices.length > 0) {
                  const indexToRemove = item.indices[item.indices.length - 1]
                  onRemove(indexToRemove)
                }
                if (navigator.vibrate) {
                  navigator.vibrate(15)
                }
              }}
              aria-label="Удалить товар"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
 
export default Cart

