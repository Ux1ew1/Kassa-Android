import { useEffect, useRef, useState } from "react";
import "./BottomBar.css";

/**
 * Bottom controls showing check totals and actions.
 */
import "./BottomBar.css";

function BottomBar({ activeCheck, onComplete, onAmount }) {
  const barRef = useRef(null);
  const sentinelRef = useRef(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.isIntersecting);
      },
      { root: null, threshold: 1 },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className={`bottom${isStuck ? " bottom--stuck" : ""}`} ref={barRef}>
        <button
          className="done-button"
          onClick={onComplete}
        aria-label="Завершить чек"
      >
        ✓
      </button>
      <span className="price">Цена: {activeCheck?.price || 0} руб.</span>
      <span className="amount">Сдача: {activeCheck?.change || 0} руб.</span>
      <button
        className="amountButton"
        onClick={onAmount}
        aria-label="Ввести сумму"
      >
        <svg
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 21h2v-3h6v-2h-6v-2h4.5c2.757 0 5-2.243 5-5s-2.243-5-5-5H9a1 1 0 0 0-1 1v7H5v2h3v2H5v2h3v3zm2-15h4.5c1.654 0 3 1.346 3 3s-1.346 3-3 3H10V6z" />
        </svg>
          </button>
      </div>
      <div className="bottom-sentinel" ref={sentinelRef} aria-hidden="true" />
    </>
  );
}

export default BottomBar;
