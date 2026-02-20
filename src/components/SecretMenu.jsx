/**
 * Secret settings menu overlay.
 */
import "./SecretMenu.css";
import { useTheme } from "../hooks/useTheme";

/**
 * Renders the secret settings panel.
 * @param {Object} props - Component props.
 * @param {boolean} props.open - Whether the menu is open.
 * @param {Function} props.onClose - Close handler.
 * @param {boolean} props.gesturesEnabled - Gestures enabled flag.
 * @param {Function} props.onToggleGestures - Toggle gestures handler.
 * @param {boolean} props.lowPerformanceMode - Low performance mode flag.
 * @param {Function} props.onToggleLowPerformanceMode - Toggle low performance handler.
 * @returns {JSX.Element|null} Secret menu overlay or null.
 */
function SecretMenu({
  open,
  onClose,
  gesturesEnabled,
  onToggleGestures,
  lowPerformanceMode,
  onToggleLowPerformanceMode,
}) {
  const { theme, toggleTheme } = useTheme();

  if (!open) {
    return null;
  }

  return (
    <div className="secret-menu-overlay" onClick={onClose}>
      <div
        className="secret-menu-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="secret-menu-header">
          <div>
            <div className="secret-menu-title">Секретное меню</div>
            <div className="secret-menu-caption">Настройки для бариста</div>
          </div>
          <button
            type="button"
            className="secret-menu-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="secret-menu-section">
          <div className="secret-menu-section-title">Вид отображения кофе</div>
          <div className="secret-menu-note">Всегда карточки</div>
        </div>

        <div className="secret-menu-section">
          <div className="secret-menu-section-title">Тема приложения</div>
          <button
            type="button"
            className="secret-menu-theme-toggle"
            onClick={toggleTheme}
            aria-label="Сменить тему"
            title="Сменить тему"
          >
            {theme === "dark" ? "☀️ Светлая тема" : "🌙 Тёмная тема"}
          </button>
        </div>

        <div className="secret-menu-section">
          <div className="secret-menu-section-title">Жесты</div>
          <label className="secret-menu-toggle">
            <span>Включить жесты</span>
            <input
              type="checkbox"
              checked={gesturesEnabled}
              onChange={onToggleGestures}
              aria-label="Включить жесты"
            />
            <span className="secret-menu-toggle-ui" aria-hidden="true" />
          </label>
        </div>

        <div className="secret-menu-section">
          <div className="secret-menu-section-title">Эффект стекла</div>
          <label className="secret-menu-toggle">
            <span>Упрощённое стекло</span>
            <input
              type="checkbox"
              checked={lowPerformanceMode}
              onChange={onToggleLowPerformanceMode}
              aria-label="Упрощённое стекло"
            />
            <span className="secret-menu-toggle-ui" aria-hidden="true" />
          </label>
        </div>

        <div className="secret-menu-actions">
          <a href="/admin" className="secret-menu-link">
            Перейти в админ-панель
          </a>
        </div>
      </div>
    </div>
  );
}

export default SecretMenu;
