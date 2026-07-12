import { useCallback, useEffect, useMemo, useState } from "react";

import { getDeletedOrdersByAdmin } from "../api/orderApi";
import AppDialog from "../components/AppDialog";

import "../styles/DeletedOrder.css";

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function DeletedOrder({ user }) {
  const [selectedDate, setSelectedDate] = useState(() => getToday());
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const companyLocationID = user?.CompanyLocationID || 1;

  const showMessage = ({ type = "info", title, message }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
    }));
  };

  const loadDeletedOrders = useCallback(async () => {
    if (!selectedDate) {
      return;
    }

    try {
      setLoading(true);

      const data = await getDeletedOrdersByAdmin({
        OrderDate: selectedDate,
        UserID: null,
        CompanyLocationID: companyLocationID,
      });

      setDeletedOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load deleted orders:", error);

      setDeletedOrders([]);

      showMessage({
        type: "error",
        title: "Unable to Load Deleted Orders",
        message:
          error?.response?.data?.Message ||
          error?.response?.data?.ErrorMessage ||
          error?.message ||
          "The deleted orders could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, companyLocationID]);

  useEffect(() => {
    loadDeletedOrders();
  }, [loadDeletedOrders]);

  const totals = useMemo(() => {
    return deletedOrders.reduce(
      (summary, order) => {
        summary.totalTax += Number(order.TAX || 0);
        summary.totalAmount += Number(order.NetTotal || 0);
        summary.grossTotal += Number(order.OrderTotal || 0);
        summary.totalDiscount += Number(order.Discount || 0);

        return summary;
      },
      {
        totalTax: 0,
        totalAmount: 0,
        grossTotal: 0,
        totalDiscount: 0,
      },
    );
  }, [deletedOrders]);

  return (
    <div className="deleted-order-page">
      <section className="deleted-order-panel">
        <header className="deleted-order-header">
          <div className="deleted-order-heading">
            <span className="deleted-order-eyebrow">Order History</span>

            <h1>Deleted Orders</h1>

            <p>Review orders removed by an administrator.</p>
          </div>

          <div className="deleted-order-header-actions">
            <div className="deleted-order-date-field">
              <label htmlFor="deleted-order-date">Order Date</label>

              <input
                id="deleted-order-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            <button
              type="button"
              className="deleted-order-refresh"
              onClick={loadDeletedOrders}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        <section className="deleted-order-summary">
          <div className="deleted-summary-card count">
            <div className="deleted-summary-icon">🗑</div>

            <div>
              <span>No. of Deleted Orders</span>
              <strong>{deletedOrders.length}</strong>
            </div>
          </div>

          <div className="deleted-summary-card tax">
            <div className="deleted-summary-icon">%</div>

            <div>
              <span>Total Tax</span>
              <strong>GHS {money(totals.totalTax)}</strong>
            </div>
          </div>

          <div className="deleted-summary-card gross">
            <div className="deleted-summary-icon">Σ</div>

            <div>
              <span>Gross Total</span>
              <strong>GHS {money(totals.grossTotal)}</strong>
            </div>
          </div>

          <div className="deleted-summary-card total">
            <div className="deleted-summary-icon">₵</div>

            <div>
              <span>Total Amount</span>
              <strong>GHS {money(totals.totalAmount)}</strong>
            </div>
          </div>
        </section>

        <div className="deleted-order-table-wrapper">
          {loading ? (
            <div className="deleted-order-state">Loading deleted orders...</div>
          ) : deletedOrders.length === 0 ? (
            <div className="deleted-order-state">
              No deleted orders were found for this date.
            </div>
          ) : (
            <table className="deleted-order-table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Order Date</th>
                  <th>Cashier</th>
                  <th>Order Type</th>
                  <th>Waiter</th>
                  <th className="number-column">Gross</th>
                  <th className="number-column">Discount</th>
                  <th className="number-column">Tax</th>
                  <th className="number-column">Net Total</th>
                  <th className="number-column">Cash</th>
                  <th className="number-column">Momo</th>
                  <th className="number-column">POS</th>
                </tr>
              </thead>

              <tbody>
                {deletedOrders.map((order) => (
                  <tr key={order.OrderID}>
                    <td>
                      <strong className="deleted-order-number">
                        {order.OrderNo}
                      </strong>
                    </td>

                    <td>
                      <span className="deleted-order-date-main">
                        {new Date(order.OrderDate).toLocaleDateString()}
                      </span>

                      <small>
                        {new Date(order.OrderDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </td>

                    <td>
                      <div className="deleted-order-cashier">
                        <span>
                          {order.UserName?.trim()?.charAt(0)?.toUpperCase() ||
                            "?"}
                        </span>

                        <strong>{order.UserName || "Unknown"}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="deleted-order-type">
                        {order.OrderTypeName || "-"}
                      </span>
                    </td>

                    <td>{order.WaiterName || "-"}</td>

                    <td className="number-column">
                      GHS {money(order.OrderTotal)}
                    </td>

                    <td className="number-column">
                      GHS {money(order.Discount)}
                    </td>

                    <td className="number-column tax-column">
                      GHS {money(order.TAX)}
                    </td>

                    <td className="number-column net-column">
                      GHS {money(order.NetTotal)}
                    </td>

                    <td className="number-column">
                      GHS {money(order.CashPayment)}
                    </td>

                    <td className="number-column">
                      GHS {money(order.MomoPayment)}
                    </td>

                    <td className="number-column">
                      GHS {money(order.VisaPayment)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="5">
                    <strong>Totals</strong>
                  </td>

                  <td className="number-column">
                    <strong>GHS {money(totals.grossTotal)}</strong>
                  </td>

                  <td className="number-column">
                    <strong>GHS {money(totals.totalDiscount)}</strong>
                  </td>

                  <td className="number-column">
                    <strong>GHS {money(totals.totalTax)}</strong>
                  </td>

                  <td className="number-column">
                    <strong>GHS {money(totals.totalAmount)}</strong>
                  </td>

                  <td colSpan="3" />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </section>

      <AppDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText="OK"
        showCancel={false}
        onCancel={closeDialog}
        onConfirm={closeDialog}
      />
    </div>
  );
}

export default DeletedOrder;
