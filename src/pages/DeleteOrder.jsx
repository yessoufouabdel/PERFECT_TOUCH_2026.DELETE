import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getOrderReport,
  selectOrdersToDelete,
  getOrderDetailsByOrderID,
  deleteOrdersByAdmin,
} from "../api/orderApi";

import AppDialog from "../components/AppDialog";
import OrderDetailsDialog from "../components/OrderDetailsDialog";

import "../styles/DeleteOrder.css";

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

function DeleteOrder({ user, initialDate }) {
  const [selectedDate, setSelectedDate] = useState(
    () => initialDate || getToday(),
  );

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const [userSummaries, setUserSummaries] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // null means All Users
  const [selectedUserID, setSelectedUserID] = useState(null);

  const [selectedOrderIDs, setSelectedOrderIDs] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
    onConfirm: null,
  });

  const companyLocationID = user?.CompanyLocationID || 1;

  const showConfirm = ({
    type = "confirm",
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
  }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm,
    });
  };

  const showMessage = ({
    type = "info",
    title,
    message,
    confirmText = "OK",
  }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
      confirmText,
      cancelText: "Cancel",
      showCancel: false,
      onConfirm: null,
    });
  };

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
      onConfirm: null,
    }));
  };
  const handleDeleteOrders = () => {
    if (selectedOrderIDs.length === 0 || deleting) {
      return;
    }

    const idsToDelete = [...selectedOrderIDs];
    const selectedAmount = totalSelected;

    showConfirm({
      type: "warning",
      title: "Delete Selected Orders?",
      message: `You are about to permanently delete ${
        idsToDelete.length
      } order(s) worth GHS ${money(
        selectedAmount,
      )}. This action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Keep Orders",

      onConfirm: async () => {
        try {
          setDeleting(true);

          const result = await deleteOrdersByAdmin({
            deletedBy: user?.UserID,
            orderIDs: `,${idsToDelete.join(",")}`,
          });

          const successful =
            Array.isArray(result) &&
            result.some((item) => Number(item?.id) === 1);

          if (!successful) {
            showMessage({
              type: "error",
              title: "Delete Failed",
              message: "The selected orders could not be deleted.",
            });

            return;
          }

          setSelectedOrderIDs([]);

          await Promise.all([
            loadUserSummaries(),
            loadAllOrders(),
            loadOrders(selectedUserID),
          ]);

          showMessage({
            type: "success",
            title: "Orders Deleted",
            message: `${idsToDelete.length} order(s) were deleted successfully.`,
          });
        } catch (error) {
          console.error("Delete orders failed:", error);

          showMessage({
            type: "error",
            title: "Delete Failed",
            message:
              error?.response?.data?.Message ||
              error?.response?.data?.ErrorMessage ||
              error?.message ||
              "Unable to delete the selected orders.",
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const loadUserSummaries = useCallback(async () => {
    if (!selectedDate) {
      return;
    }

    try {
      setLoadingUsers(true);

      const data = await getOrderReport({
        OrderDate: selectedDate,
        CompanyLocationID: companyLocationID,
      });

      setUserSummaries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load user totals:", error);

      setUserSummaries([]);

      showMessage({
        type: "error",
        title: "Unable to Load Cashiers",
        message:
          error?.response?.data?.Message ||
          "The cashier totals could not be loaded.",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedDate, companyLocationID]);

  const loadAllOrders = useCallback(async () => {
    if (!selectedDate) {
      return;
    }

    try {
      const data = await selectOrdersToDelete({
        OrderDate: selectedDate,
        UserID: null,
        CompanyLocationID: companyLocationID,
      });

      setAllOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load all daily orders:", error);
      setAllOrders([]);
    }
  }, [selectedDate, companyLocationID]);

  const loadOrders = useCallback(
    async (userID = null) => {
      if (!selectedDate) {
        return;
      }

      try {
        setLoadingOrders(true);
        setSelectedOrderIDs([]);

        const data = await selectOrdersToDelete({
          OrderDate: selectedDate,
          UserID: userID,
          CompanyLocationID: companyLocationID,
        });

        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load orders:", error);

        setOrders([]);

        showMessage({
          type: "error",
          title: "Unable to Load Orders",
          message:
            error?.response?.data?.Message || "The orders could not be loaded.",
        });
      } finally {
        setLoadingOrders(false);
      }
    },
    [selectedDate, companyLocationID],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setSelectedUserID(null);
      setSelectedOrderIDs([]);

      await Promise.all([
        loadUserSummaries(),
        loadAllOrders(),
        loadOrders(null),
      ]);
    };

    loadInitialData();
  }, [selectedDate, loadUserSummaries, loadAllOrders, loadOrders]);

  const handleUserSelection = async (userID) => {
    const normalizedUserID = userID === null ? null : Number(userID);

    setSelectedUserID(normalizedUserID);
    setSelectedOrderIDs([]);

    await loadOrders(normalizedUserID);
  };

  const handleViewOrder = async (order) => {
    try {
      setSelectedOrder(order);
      setOrderDetails([]);
      setShowDetails(true);
      setLoadingDetails(true);

      const data = await getOrderDetailsByOrderID(order.OrderID);

      setOrderDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load order details:", error);

      setShowDetails(false);

      showMessage({
        type: "error",
        title: "Unable to Load Order Details",
        message:
          error?.response?.data?.Message ||
          "The selected order details could not be loaded.",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleOrderSelection = (orderID) => {
    const numericOrderID = Number(orderID);

    setSelectedOrderIDs((previous) =>
      previous.includes(numericOrderID)
        ? previous.filter((id) => id !== numericOrderID)
        : [...previous, numericOrderID],
    );
  };

  const allVisibleOrdersSelected =
    orders.length > 0 &&
    orders.every((order) => selectedOrderIDs.includes(Number(order.OrderID)));

  const toggleSelectAll = () => {
    if (allVisibleOrdersSelected) {
      setSelectedOrderIDs([]);
      return;
    }

    setSelectedOrderIDs(orders.map((order) => Number(order.OrderID)));
  };

  /*
   * These totals always use all orders for the selected day.
   * They do not change when the cashier filter changes.
   */
  const overallTotal = useMemo(() => {
    return allOrders.reduce(
      (total, order) => total + Number(order.NetTotal || 0),
      0,
    );
  }, [allOrders]);

  const totalTax = useMemo(() => {
    return allOrders.reduce(
      (total, order) => total + Number(order.TAX || 0),
      0,
    );
  }, [allOrders]);

  /*
   * These totals use only the currently filtered orders.
   */
  const filteredOrderTotal = useMemo(() => {
    return orders.reduce(
      (total, order) => total + Number(order.NetTotal || 0),
      0,
    );
  }, [orders]);

  const totalSelected = useMemo(() => {
    return orders.reduce((total, order) => {
      if (selectedOrderIDs.includes(Number(order.OrderID))) {
        return total + Number(order.NetTotal || 0);
      }

      return total;
    }, 0);
  }, [orders, selectedOrderIDs]);

  const remainingTotal = overallTotal - totalSelected;

  const selectedUserName =
    selectedUserID === null
      ? "All Users"
      : userSummaries.find(
          (cashier) => Number(cashier.UserID) === Number(selectedUserID),
        )?.UserName || "Selected User";

  return (
    <div className="delete-order-page">
      <div className="delete-order-workspace">
        <section className="delete-order-main-column">
          <section className="delete-order-date-panel">
            <div className="delete-order-date-icon">📅</div>

            <div className="delete-order-date-content">
              <label htmlFor="delete-order-date">Order Date</label>

              <input
                id="delete-order-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            <div className="delete-order-date-status">
              <span>Showing</span>
              <strong>
                {selectedUserID === null ? "All Users" : selectedUserName}
              </strong>
            </div>
          </section>
          <section className="delete-order-user-panel">
            {loadingUsers ? (
              <div className="delete-order-state compact">
                Loading cashier totals...
              </div>
            ) : (
              <div className="delete-order-user-grid">
                <button
                  type="button"
                  className={`delete-order-user-card all-users ${
                    selectedUserID === null ? "active" : ""
                  }`}
                  onClick={() => handleUserSelection(null)}
                >
                  <div className="delete-order-user-icon">👥</div>

                  <div>
                    <strong>All Users</strong>
                    <span>Combined cashier totals</span>
                  </div>

                  <b>GHS {money(overallTotal)}</b>
                </button>

                {userSummaries.map((cashier) => (
                  <button
                    type="button"
                    key={cashier.UserID}
                    className={`delete-order-user-card ${
                      Number(selectedUserID) === Number(cashier.UserID)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleUserSelection(cashier.UserID)}
                  >
                    <div className="delete-order-user-icon">
                      {cashier.UserName?.trim()?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </div>

                    <div>
                      <strong>{cashier.UserName}</strong>
                      <span>{cashier.CompanyLocationName}</span>
                    </div>

                    <b>GHS {money(cashier.NetTotal)}</b>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="delete-order-list-panel">
            <div className="delete-order-list-header">
              <div className="delete-order-list-title">
                <span className="delete-order-list-eyebrow">Orders</span>

                <h2>{selectedUserName}</h2>
              </div>

              <div className="delete-order-list-actions">
                <div className="delete-order-count">
                  {orders.length} order
                  {orders.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="delete-order-table-wrapper">
              {loadingOrders ? (
                <div className="delete-order-state">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="delete-order-state">
                  No orders were found for this selection.
                </div>
              ) : (
                <table className="delete-order-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <label className="order-checkbox">
                          <input
                            type="checkbox"
                            checked={allVisibleOrdersSelected}
                            onChange={toggleSelectAll}
                          />
                          <span />
                        </label>
                      </th>

                      <th>Order No.</th>
                      <th>Order Date</th>

                      <th className="number-column">Order Total</th>

                      <th className="number-column">Discount</th>

                      <th className="number-column">Net</th>

                      <th>Cashier</th>

                      <th className="action-column">View</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => {
                      const isSelected = selectedOrderIDs.includes(
                        Number(order.OrderID),
                      );

                      return (
                        <tr
                          key={order.OrderID}
                          className={isSelected ? "selected-row" : ""}
                        >
                          <td className="checkbox-column">
                            <label className="order-checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleOrderSelection(order.OrderID)
                                }
                              />
                              <span />
                            </label>
                          </td>

                          <td>
                            <strong className="order-number">
                              {order.OrderNo}
                            </strong>
                          </td>

                          <td>
                            <span className="order-date-main">
                              {new Date(order.OrderDate).toLocaleDateString()}
                            </span>

                            <small>
                              {new Date(order.OrderDate).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </small>
                          </td>

                          <td className="number-column">
                            GHS {money(order.OrderTotal)}
                          </td>

                          <td className="number-column">
                            GHS {money(order.Discount)}
                          </td>

                          <td className="number-column net-column">
                            GHS {money(order.NetTotal)}
                          </td>

                          <td>
                            <div className="order-cashier-cell">
                              <span>
                                {order.UserName?.trim()
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </span>

                              <strong>{order.UserName}</strong>
                            </div>
                          </td>

                          <td className="action-column">
                            <button
                              type="button"
                              className="view-order-button"
                              onClick={() => handleViewOrder(order)}
                              aria-label={`View ${order.OrderNo}`}
                              title="View order details"
                            >
                              👁
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </section>

        <aside className="delete-order-summary-panel">
          <div className="delete-summary-header">
            <span>Deletion Summary</span>
            <h2>Daily Totals</h2>
            <p>{selectedDate}</p>
          </div>

          <div className="delete-summary-cards">
            <div className="delete-summary-card overall">
              <span>Total of the Day</span>
              <strong>GHS {money(overallTotal)}</strong>
              <small>All cashiers and all orders</small>
            </div>

            <div className="delete-summary-card tax">
              <span>Total Tax</span>
              <strong>GHS {money(totalTax)}</strong>
              <small>Tax for the complete day</small>
            </div>

            <div className="delete-summary-card">
              <span>No. of Orders Filtered</span>
              <strong>{orders.length}</strong>
              <small>{selectedUserName}</small>
            </div>

            <div className="delete-summary-card">
              <span>Total Orders Filtered</span>
              <strong>GHS {money(filteredOrderTotal)}</strong>
              <small>Current cashier selection</small>
            </div>

            <div className="delete-summary-card selected">
              <span>Total Selected</span>
              <strong>GHS {money(totalSelected)}</strong>
              <small>
                {selectedOrderIDs.length} selected order
                {selectedOrderIDs.length === 1 ? "" : "s"}
              </small>
            </div>

            <div className="delete-summary-card remaining">
              <span>Remaining Total</span>
              <strong>GHS {money(remainingTotal)}</strong>
              <small>Daily total after selected deletion</small>
            </div>
          </div>

          <div className="delete-summary-selection">
            <span>Selected Order IDs</span>

            <strong>
              {selectedOrderIDs.length > 0
                ? selectedOrderIDs.join(", ")
                : "None"}
            </strong>
          </div>

          <button
            className="delete-selected-orders-button"
            disabled={selectedOrderIDs.length === 0 || deleting}
            onClick={handleDeleteOrders}
          >
            {deleting
              ? "Deleting Orders..."
              : `🗑 Delete Selected Orders (${selectedOrderIDs.length})`}
          </button>
        </aside>
      </div>

      {showDetails && (
        <OrderDetailsDialog
          order={selectedOrder}
          details={orderDetails}
          loading={loadingDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedOrder(null);
            setOrderDetails([]);
          }}
        />
      )}

      <AppDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
        onCancel={closeDialog}
        onConfirm={() => {
          const callback = dialog.onConfirm;

          closeDialog();

          if (typeof callback === "function") {
            callback();
          }
        }}
      />
    </div>
  );
}

export default DeleteOrder;
