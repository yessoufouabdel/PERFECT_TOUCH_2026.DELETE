import "../styles/Components.css";

function AppDialog({
  open,
  type = "info",
  title = "Message",
  message = "",
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const icons = {
    success: "✓",
    error: "!",
    warning: "⚠",
    confirm: "?",
    info: "i",
  };

  return (
    <div className="app-dialog-backdrop">
      <div className={`app-dialog app-dialog-${type}`}>
        <div className={`app-dialog-icon app-dialog-icon-${type}`}>
          {icons[type] || icons.info}
        </div>

        <div className="app-dialog-content">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>

        <div
          className={`app-dialog-actions ${
            showCancel ? "two-buttons" : "one-button"
          }`}
        >
          {showCancel && (
            <button
              type="button"
              className="app-dialog-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={`app-dialog-confirm app-dialog-confirm-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppDialog;