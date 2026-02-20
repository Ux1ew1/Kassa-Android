/**
 * Checks list component for switching active check.
 */
import { useEffect, useRef, useState } from "react";
import "./ChecksList.css";

/**
 * Renders the checks list with create/complete actions.
 * @param {Object} props - Component props.
 * @param {Array} props.checks - Checks list.
 * @param {number} props.activeCheckId - Active check id.
 * @param {Function} props.onCheckChange - Handler for selecting a check.
 * @param {Function} props.onCreateNew - Handler for creating a new check.
 * @param {Function} [props.onCompleteActiveCheck] - Handler for completing active check.
 * @returns {JSX.Element} Checks list.
 */
function ChecksList({
  checks,
  activeCheckId,
  onCheckChange,
  onCreateNew,
  onCompleteActiveCheck,
}) {
  const lastTapRef = useRef({ id: null, time: 0 });
  const checksRef = useRef(null);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  useEffect(() => {
    let rafA = 0;
    let rafB = 0;

    const updateOverflowState = () => {
      const container = checksRef.current;
      if (!container) return;

      const overflow = container.scrollWidth - container.clientWidth > 1;
      const canScrollRight =
        container.scrollLeft + container.clientWidth < container.scrollWidth - 1;
      setShowRightIndicator(overflow && canScrollRight);
    };

    rafA = window.requestAnimationFrame(() => {
      updateOverflowState();
      rafB = window.requestAnimationFrame(updateOverflowState);
    });

    window.addEventListener("resize", updateOverflowState);
    const container = checksRef.current;
    if (container) {
      container.addEventListener("scroll", updateOverflowState, {
        passive: true,
      });
    }

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      window.removeEventListener("resize", updateOverflowState);
      if (container) {
        container.removeEventListener("scroll", updateOverflowState);
      }
    };
  }, [checks.length]);

  const handleTap = (checkId) => {
    const now = Date.now();
    const { id, time } = lastTapRef.current;

    if (
      id === checkId &&
      now - time < 320 &&
      checkId === activeCheckId &&
      typeof onCompleteActiveCheck === "function"
    ) {
      onCompleteActiveCheck();
      lastTapRef.current = { id: null, time: 0 };
      return;
    }

    lastTapRef.current = { id: checkId, time: now };
  };

  return (
    <div className="top__checks">
      <div
        className={`checks${showRightIndicator ? " checks--overflow-right" : ""}`}
        id="checks"
        ref={checksRef}
      >
        {checks.map((check) => (
          <div key={check.id} className="check-item">
            <input
              type="radio"
              id={`check-${check.id}`}
              name="check"
              value={check.id}
              checked={check.id === activeCheckId}
              onChange={(e) => onCheckChange(parseInt(e.target.value, 10))}
            />
            <label
              htmlFor={`check-${check.id}`}
              onDoubleClick={() => {
                if (
                  check.id === activeCheckId &&
                  typeof onCompleteActiveCheck === "function"
                ) {
                  onCompleteActiveCheck();
                }
              }}
              onTouchEnd={() => handleTap(check.id)}
            >
              {check.id}
            </label>
          </div>
        ))}
      </div>
      <button className="newCheck" onClick={onCreateNew} aria-label="Новый чек">
        +
      </button>
    </div>
  );
}

export default ChecksList;
