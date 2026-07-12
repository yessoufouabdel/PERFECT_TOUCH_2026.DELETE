import { useCallback, useEffect, useMemo, useState } from "react";

import { getDashboard } from "../api/orderApi";
import AppDialog from "../components/AppDialog";

import "../styles/Dashboard.css";

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

const number = (value) => Number(value || 0).toLocaleString();

function Dashboard({ user }) {
  const [reportDate, setReportDate] = useState(() => getToday());
  const [selectedUserID, setSelectedUserID] = useState(null);

  const [dashboard, setDashboard] = useState({
    summary: {},
    payments: [],
    hourlySales: [],
    orderTypes: [],
    cashiers: [],
    topProducts: [],
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const loadDashboard = useCallback(async () => {
    if (!reportDate) {
      return;
    }

    try {
      setLoading(true);

      const data = await getDashboard({
        ReportDate: reportDate,
        CompanyLocationID: companyLocationID,
        UserID: selectedUserID,
      });

      setDashboard({
        summary: data?.summary || {},
        payments: Array.isArray(data?.payments) ? data.payments : [],
        hourlySales: Array.isArray(data?.hourlySales) ? data.hourlySales : [],
        orderTypes: Array.isArray(data?.orderTypes) ? data.orderTypes : [],
        cashiers: Array.isArray(data?.cashiers) ? data.cashiers : [],
        topProducts: Array.isArray(data?.topProducts) ? data.topProducts : [],
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard:", error);

      showMessage({
        type: "error",
        title: "Unable to Load Dashboard",
        message:
          error?.response?.data?.Message ||
          error?.response?.data?.ErrorMessage ||
          error?.message ||
          "The dashboard information could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [reportDate, selectedUserID, companyLocationID]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard.summary || {};

  const totalItemsSold = useMemo(() => {
    return dashboard.topProducts.reduce(
      (total, item) => total + Number(item.QuantitySold || 0),
      0,
    );
  }, [dashboard.topProducts]);

  const maxHourlySales = useMemo(() => {
    return Math.max(
      ...dashboard.hourlySales.map((item) => Number(item.NetSales || 0)),
      1,
    );
  }, [dashboard.hourlySales]);

  const maxOrderTypeSales = useMemo(() => {
    return Math.max(
      ...dashboard.orderTypes.map((item) => Number(item.NetSales || 0)),
      1,
    );
  }, [dashboard.orderTypes]);

  const maxProductQuantity = useMemo(() => {
    return Math.max(
      ...dashboard.topProducts.map((item) => Number(item.QuantitySold || 0)),
      1,
    );
  }, [dashboard.topProducts]);

  const maxCashierSales = useMemo(() => {
    return Math.max(
      ...dashboard.cashiers.map((item) => Number(item.NetSales || 0)),
      1,
    );
  }, [dashboard.cashiers]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-toolbar">
        <div>
          <span className="dashboard-eyebrow">Restaurant Overview</span>

          <h1>Dashboard</h1>

          <p>
            Monitor sales, payment methods, products and cashier performance.
          </p>
        </div>

        <div className="dashboard-toolbar-actions">
          <div className="dashboard-filter-field">
            <label htmlFor="dashboard-date">Report Date</label>

            <input
              id="dashboard-date"
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
            />
          </div>

          <div className="dashboard-filter-field">
            <label htmlFor="dashboard-cashier">Cashier</label>

            <select
              id="dashboard-cashier"
              value={selectedUserID ?? ""}
              onChange={(event) =>
                setSelectedUserID(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
            >
              <option value="">All Cashiers</option>

              {dashboard.cashiers.map((cashier) => (
                <option key={cashier.UserID} value={cashier.UserID}>
                  {cashier.FullName || cashier.UserName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card sales">
          <div className="dashboard-kpi-icon">₵</div>

          <div>
            <span>Net Sales</span>
            <strong>GHS {money(summary.NetSales)}</strong>
            <small>Gross: GHS {money(summary.GrossTotal)}</small>
          </div>
        </div>

        <div className="dashboard-kpi-card orders">
          <div className="dashboard-kpi-icon">🧾</div>

          <div>
            <span>Number of Orders</span>
            <strong>{number(summary.NumberOfOrders)}</strong>
            <small>Completed orders</small>
          </div>
        </div>

        <div className="dashboard-kpi-card average">
          <div className="dashboard-kpi-icon">📊</div>

          <div>
            <span>Average Order Value</span>
            <strong>GHS {money(summary.AverageOrderValue)}</strong>
            <small>Average customer spend</small>
          </div>
        </div>

        <div className="dashboard-kpi-card tax">
          <div className="dashboard-kpi-icon">%</div>

          <div>
            <span>Total Tax</span>
            <strong>GHS {money(summary.TotalTax)}</strong>
            <small>VAT, NHIL and tourism</small>
          </div>
        </div>

        <div className="dashboard-kpi-card discount">
          <div className="dashboard-kpi-icon">🏷</div>

          <div>
            <span>Total Discount</span>
            <strong>GHS {money(summary.TotalDiscount)}</strong>
            <small>Discounts issued</small>
          </div>
        </div>

        <div className="dashboard-kpi-card items">
          <div className="dashboard-kpi-icon">🍽</div>

          <div>
            <span>Top Product Units</span>
            <strong>{number(totalItemsSold)}</strong>
            <small>Top 10 products combined</small>
          </div>
        </div>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card hourly-sales-card">
          <header className="dashboard-card-header">
            <div>
              <span>Sales Trend</span>
              <h2>Sales by Hour</h2>
            </div>

            <strong>GHS {money(summary.NetSales)}</strong>
          </header>

          <div className="hourly-chart">
            {dashboard.hourlySales.length === 0 ? (
              <div className="dashboard-empty">No hourly sales available.</div>
            ) : (
              dashboard.hourlySales.map((item) => {
                const height =
                  (Number(item.NetSales || 0) / maxHourlySales) * 100;

                return (
                  <div
                    className="hourly-chart-column"
                    key={item.HourNumber}
                    title={`${item.HourLabel}: GHS ${money(item.NetSales)}`}
                  >
                    <div className="hourly-chart-value">
                      {money(item.NetSales)}
                    </div>

                    <div className="hourly-chart-track">
                      <div
                        className="hourly-chart-bar"
                        style={{
                          height: `${Math.max(height, 4)}%`,
                        }}
                      />
                    </div>

                    <span>{item.HourLabel}</span>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="dashboard-card payment-card">
          <header className="dashboard-card-header">
            <div>
              <span>Collections</span>
              <h2>Payment Breakdown</h2>
            </div>
          </header>

          <div className="payment-breakdown-list">
            {dashboard.payments.map((payment) => (
              <div className="payment-breakdown-row" key={payment.PaymentMode}>
                <div className="payment-breakdown-heading">
                  <div>
                    <strong>{payment.PaymentMode}</strong>
                    <span>
                      {Number(payment.PercentageOfNetSales || 0).toFixed(1)}%
                    </span>
                  </div>

                  <b>GHS {money(payment.Amount)}</b>
                </div>

                <div className="dashboard-progress-track">
                  <div
                    className={`dashboard-progress-fill payment-${String(
                      payment.PaymentMode,
                    ).toLowerCase()}`}
                    style={{
                      width: `${Math.min(
                        Number(payment.PercentageOfNetSales || 0),
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card">
          <header className="dashboard-card-header">
            <div>
              <span>Sales Channels</span>
              <h2>Order Types</h2>
            </div>
          </header>

          <div className="dashboard-ranked-list">
            {dashboard.orderTypes.map((item, index) => (
              <div className="dashboard-ranked-row" key={item.OrderTypeID}>
                <div className="rank-number">{index + 1}</div>

                <div className="rank-main">
                  <div className="rank-heading">
                    <strong>{item.OrderTypeName}</strong>

                    <span>{number(item.NumberOfOrders)} orders</span>
                  </div>

                  <div className="dashboard-progress-track">
                    <div
                      className="dashboard-progress-fill"
                      style={{
                        width: `${
                          (Number(item.NetSales || 0) / maxOrderTypeSales) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <b>GHS {money(item.NetSales)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <header className="dashboard-card-header">
            <div>
              <span>Menu Performance</span>
              <h2>Top Products</h2>
            </div>
          </header>

          <div className="dashboard-ranked-list">
            {dashboard.topProducts.slice(0, 7).map((item, index) => (
              <div className="dashboard-ranked-row" key={item.ProductID}>
                <div className="rank-number">{index + 1}</div>

                <div className="rank-main">
                  <div className="rank-heading">
                    <strong title={item.ProductName}>{item.ProductName}</strong>

                    <span>{number(item.QuantitySold)} sold</span>
                  </div>

                  <div className="dashboard-progress-track">
                    <div
                      className="dashboard-progress-fill product-progress"
                      style={{
                        width: `${
                          (Number(item.QuantitySold || 0) /
                            maxProductQuantity) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <b>GHS {money(item.SalesValue)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <header className="dashboard-card-header">
            <div>
              <span>Team Performance</span>
              <h2>Cashier Ranking</h2>
            </div>
          </header>

          <div className="dashboard-ranked-list">
            {dashboard.cashiers.slice(0, 7).map((cashier, index) => (
              <button
                type="button"
                className={`dashboard-ranked-row cashier-ranked-row ${
                  Number(selectedUserID) === Number(cashier.UserID)
                    ? "active"
                    : ""
                }`}
                key={cashier.UserID}
                onClick={() => setSelectedUserID(cashier.UserID)}
              >
                <div className="cashier-rank-avatar">
                  {cashier.FullName?.trim()?.charAt(0)?.toUpperCase() ||
                    cashier.UserName?.trim()?.charAt(0)?.toUpperCase() ||
                    "?"}
                </div>

                <div className="rank-main">
                  <div className="rank-heading">
                    <strong>{cashier.FullName || cashier.UserName}</strong>

                    <span>{number(cashier.NumberOfOrders)} orders</span>
                  </div>

                  <div className="dashboard-progress-track">
                    <div
                      className="dashboard-progress-fill cashier-progress"
                      style={{
                        width: `${
                          (Number(cashier.NetSales || 0) / maxCashierSales) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <b>GHS {money(cashier.NetSales)}</b>
              </button>
            ))}
          </div>
        </article>
      </section>

      <footer className="dashboard-footer">
        <span>
          Branch:{" "}
          <strong>{user?.CompanyLocationName || "Current Branch"}</strong>
        </span>

        <span>
          Last updated:{" "}
          <strong>
            {lastUpdated
              ? lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "Not loaded"}
          </strong>
        </span>
      </footer>

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

export default Dashboard;
