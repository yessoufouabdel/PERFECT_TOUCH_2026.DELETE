import "../styles/DeleteOrder.css";

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function OrderDetailsDialog({ order, details = [], loading, onClose }) {
  return (
    <div className="order-detail-backdrop">
      <div className="order-detail-dialog">
        <header className="order-detail-header">
          <div>
            <span className="order-detail-eyebrow">Order Details</span>

            <h2>{order?.OrderNo || "Order"}</h2>

            <p>
              {order?.UserName || "Unknown cashier"} ·{" "}
              {order?.OrderDate
                ? new Date(order.OrderDate).toLocaleString()
                : ""}
            </p>
          </div>

          <button
            type="button"
            className="order-detail-close"
            onClick={onClose}
            aria-label="Close order details"
          >
            ×
          </button>
        </header>

        <div className="order-detail-summary">
          <div>
            <span>Order Total</span>
            <strong>GHS {money(order?.OrderTotal)}</strong>
          </div>

          <div>
            <span>Discount</span>
            <strong>GHS {money(order?.Discount)}</strong>
          </div>

          <div>
            <span>Net Total</span>
            <strong>GHS {money(order?.NetTotal)}</strong>
          </div>
        </div>

        <div className="order-detail-table-wrapper">
          {loading ? (
            <div className="delete-order-state">Loading order details...</div>
          ) : details.length === 0 ? (
            <div className="delete-order-state">
              No items were found for this order.
            </div>
          ) : (
            <table className="order-detail-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="number-column">Qty</th>
                  <th className="number-column">Price</th>
                  <th className="number-column">Total</th>
                </tr>
              </thead>

              <tbody>
                {details.map((item) => (
                  <tr key={item.OrderDetailID}>
                    <td>
                      <strong>
                        {item.ProductNameWithOption || item.ProductName}
                      </strong>

                      {item.ProductOption && (
                        <small>📝 {item.ProductOption}</small>
                      )}
                    </td>

                    <td className="number-column">{Number(item.Qty || 0)}</td>

                    <td className="number-column">
                      GHS {money(item.SellingPrice)}
                    </td>

                    <td className="number-column">
                      GHS {money(item.OrderDetailTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="order-detail-footer">
          <button type="button" className="order-detail-done" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

export default OrderDetailsDialog;
