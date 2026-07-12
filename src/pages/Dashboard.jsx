import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const wholeNumber = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

const normalizePercentage = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
};

const paymentColors = {
  CASH: "#45a83d",
  MOMO: "#f2a000",
  POS: "#3b82f6",
  WAITER: "#8b5cf6",
  BOLT: "#14b86f",
};

function TrendBadge({ value, inverse = false }) {
  const percentage = normalizePercentage(value);
  const positive = inverse ? percentage <= 0 : percentage >= 0;
  const neutral = Math.abs(percentage) < 0.01;

  return (
    <div
      className={`executive-trend ${
        neutral ? "neutral" : positive ? "positive" : "negative"
      }`}
    >
      <span>{neutral ? "•" : percentage > 0 ? "▲" : "▼"}</span>

      <strong>{Math.abs(percentage).toFixed(1)}%</strong>

      <small>vs yesterday</small>
    </div>
  );
}

function Dashboard({ user, onNavigate, reportDate, onReportDateChange }) {
  const [selectedUserID, setSelectedUserID] = useState(() =>
    Number(user?.RoleID) === 1 ? null : Number(user?.UserID),
  );
  const [cashierOptions, setCashierOptions] = useState([]);
  const isAdministrator = Number(user?.RoleID) === 1;

  const dashboardRoutes = {
    dashboard: "dashboard",
    order: "order",
    orderReport: "delete-order",
    deleteOrder: "delete-order",
    deletedOrder: "deleted-order",
    changePassword: "password",
  };

  const [dashboard, setDashboard] = useState({
    summary: {},
    payments: [],
    hourlySales: [],
    orderTypes: [],
    cashiers: [],
    topProducts: [],
    alerts: {},
  });

  const [loading, setLoading] = useState(false);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const firstLoadRef = useRef(true);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const companyLocationID = Number(user?.CompanyLocationID || 1);

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

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!reportDate) {
        return;
      }

      try {
        if (silent) {
          setSilentRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getDashboard({
          ReportDate: reportDate,
          CompanyLocationID: companyLocationID,
          UserID: selectedUserID,
        });

        const nextDashboard = {
          summary: data?.summary || {},
          payments: Array.isArray(data?.payments) ? data.payments : [],
          hourlySales: Array.isArray(data?.hourlySales) ? data.hourlySales : [],
          orderTypes: Array.isArray(data?.orderTypes) ? data.orderTypes : [],
          cashiers: Array.isArray(data?.cashiers) ? data.cashiers : [],
          topProducts: Array.isArray(data?.topProducts) ? data.topProducts : [],
          alerts: data?.alerts || {},
        };

        setDashboard(nextDashboard);

        if (
          isAdministrator &&
          selectedUserID === null &&
          nextDashboard.cashiers.length > 0
        ) {
          setCashierOptions(nextDashboard.cashiers);
        }

        setLastUpdated(new Date());
        firstLoadRef.current = false;
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        if (!silent || firstLoadRef.current) {
          showMessage({
            type: "error",
            title: "Unable to Load Dashboard",
            message:
              error?.response?.data?.Message ||
              error?.response?.data?.ErrorMessage ||
              error?.message ||
              "The dashboard information could not be loaded.",
          });
        }
      } finally {
        setLoading(false);
        setSilentRefreshing(false);
      }
    },
    [reportDate, companyLocationID, selectedUserID, isAdministrator],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 180000);

    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  const summary = dashboard.summary || {};
  const alerts = dashboard.alerts || {};

  const hourlyChartData = useMemo(
    () =>
      dashboard.hourlySales.map((item) => ({
        hour: item.HourLabel,
        sales: Number(item.NetSales || 0),
        orders: Number(item.NumberOfOrders || 0),
        average: Number(item.AverageOrderValue || 0),
      })),
    [dashboard.hourlySales],
  );

  const paymentChartData = useMemo(
    () =>
      dashboard.payments
        .map((item) => ({
          name: item.PaymentMode,
          value: Number(item.Amount || 0),
          percentage: Number(item.PercentageOfNetSales || 0),
        }))
        .filter((item) => item.value > 0),
    [dashboard.payments],
  );

  const orderTypeMaximum = useMemo(
    () =>
      Math.max(
        ...dashboard.orderTypes.map((item) => Number(item.NetSales || 0)),
        1,
      ),
    [dashboard.orderTypes],
  );

  const productMaximum = useMemo(
    () =>
      Math.max(
        ...dashboard.topProducts.map((item) => Number(item.QuantitySold || 0)),
        1,
      ),
    [dashboard.topProducts],
  );

  const cashierMaximum = useMemo(
    () =>
      Math.max(
        ...dashboard.cashiers.map((item) => Number(item.NetSales || 0)),
        1,
      ),
    [dashboard.cashiers],
  );

  const healthScore = useMemo(() => {
    let score = 100;

    score -= Math.min(Number(alerts.DeletedOrders || 0) * 3, 15);

    score -= Math.min(Number(alerts.OrdersWithoutWaiter || 0), 10);

    score -= Math.min(Number(alerts.DiscountedOrders || 0), 10);

    if (alerts.CashUpStatus === "PENDING") {
      score -= 15;
    }

    if (alerts.CashUpStatus === "SHORTAGE") {
      score -= 20;
    }

    if (alerts.CashUpStatus === "OVERAGE") {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }, [alerts]);

  const healthLabel =
    healthScore >= 90
      ? "Excellent"
      : healthScore >= 75
        ? "Good"
        : healthScore >= 60
          ? "Needs Attention"
          : "Critical";

  const handleNavigation = (page, params = {}) => {
    if (typeof onNavigate === "function") {
      onNavigate(page, params);
    }
  };

  const cashUpDifference = Number(alerts.CashUpDifference || 0);

  return (
    <div className="executive-dashboard-page">
      <section className="executive-dashboard-toolbar">
        <div className="executive-dashboard-branding">
          <span className="executive-dashboard-eyebrow">
            Executive Restaurant Overview
          </span>

          <h1>Dashboard</h1>

          <p>
            {user?.CompanyName || "Perfect Touch"} ·{" "}
            {user?.CompanyLocationName || "Current Branch"}
          </p>
        </div>

        <div className="executive-dashboard-filters">
          <div className="executive-filter">
            <label htmlFor="executive-date">Report Date</label>

            <input
              id="executive-date"
              type="date"
              value={reportDate}
              onChange={(event) => {
                if (typeof onReportDateChange === "function") {
                  onReportDateChange(event.target.value);
                }
              }}
            />
          </div>

          {isAdministrator && (
            <div className="executive-filter">
              <label htmlFor="executive-cashier">Cashier</label>

              <select
                id="executive-cashier"
                value={selectedUserID ?? ""}
                onChange={(event) =>
                  setSelectedUserID(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
              >
                <option value="">All Cashiers</option>

                {cashierOptions.map((cashier) => (
                  <option key={cashier.UserID} value={cashier.UserID}>
                    {cashier.FullName || cashier.UserName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="executive-refresh-button"
            disabled={loading || silentRefreshing}
            onClick={() => loadDashboard()}
          >
            {loading
              ? "Loading..."
              : silentRefreshing
                ? "Refreshing..."
                : "↻ Refresh"}
          </button>
        </div>
      </section>

      {loading && firstLoadRef.current ? (
        <div className="executive-dashboard-loading">
          <div className="executive-loading-spinner" />
          <strong>Loading executive dashboard...</strong>
        </div>
      ) : (
        <>
          <section className="executive-kpi-grid">
            <button
              type="button"
              className="executive-kpi-card primary-kpi executive-clickable-card"
              onClick={() =>
                handleNavigation(dashboardRoutes.orderReport, {
                  reportDate,
                })
              }
            >
              <div className="executive-kpi-top">
                <div className="executive-kpi-icon">₵</div>
                <TrendBadge value={summary.NetSalesChangePercentage} />
              </div>

              <span>Net Sales</span>

              <strong>GHS {money(summary.NetSales)}</strong>

              <small>Yesterday: GHS {money(summary.PreviousNetSales)}</small>
            </button>

            <button
              type="button"
              className="executive-kpi-card executive-clickable-card"
              onClick={() => handleNavigation(dashboardRoutes.orderReport)}
            >
              <div className="executive-kpi-top">
                <div className="executive-kpi-icon orders">🧾</div>

                <TrendBadge value={summary.OrdersChangePercentage} />
              </div>

              <span>Orders</span>

              <strong>{wholeNumber(summary.NumberOfOrders)}</strong>

              <small>
                Yesterday: {wholeNumber(summary.PreviousNumberOfOrders)}
              </small>
            </button>

            <button
              type="button"
              className="executive-kpi-card executive-clickable-card"
              onClick={() => handleNavigation(dashboardRoutes.orderReport)}
            >
              <div className="executive-kpi-top">
                <div className="executive-kpi-icon average">📊</div>

                <TrendBadge value={summary.AverageOrderValueChangePercentage} />
              </div>

              <span>Average Order</span>

              <strong>GHS {money(summary.AverageOrderValue)}</strong>

              <small>
                Yesterday: GHS {money(summary.PreviousAverageOrderValue)}
              </small>
            </button>

            <button
              type="button"
              className="executive-kpi-card executive-clickable-card"
              onClick={() => handleNavigation(dashboardRoutes.orderReport)}
            >
              <div className="executive-kpi-top">
                <div className="executive-kpi-icon tax">%</div>

                <TrendBadge value={summary.TotalTaxChangePercentage} />
              </div>

              <span>Total Tax</span>

              <strong>GHS {money(summary.TotalTax)}</strong>

              <small>Yesterday: GHS {money(summary.PreviousTotalTax)}</small>
            </button>

            <article className="executive-kpi-card">
              <div className="executive-kpi-top">
                <div className="executive-kpi-icon discount">🏷</div>

                <TrendBadge value={summary.DiscountChangePercentage} inverse />
              </div>

              <span>Discounts</span>

              <strong>GHS {money(summary.TotalDiscount)}</strong>

              <small>
                Yesterday: GHS {money(summary.PreviousTotalDiscount)}
              </small>
            </article>

            <article
              className={`executive-health-card health-${healthLabel
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              <div className="health-score-circle">
                <strong>{healthScore}</strong>
                <span>/100</span>
              </div>

              <div>
                <span>Restaurant Health</span>
                <strong>{healthLabel}</strong>
                <small>Based on today’s exceptions</small>
              </div>
            </article>
          </section>

          <section className="executive-chart-grid">
            <article className="executive-dashboard-card sales-trend-card">
              <header className="executive-card-header">
                <div>
                  <span>Revenue Trend</span>
                  <h2>Sales by Hour</h2>
                </div>

                <div className="executive-header-value">
                  <small>Peak performance</small>
                  <strong>GHS {money(summary.NetSales)}</strong>
                </div>
              </header>

              <div className="executive-chart-container">
                {hourlyChartData.length === 0 ? (
                  <div className="executive-empty-state">
                    No hourly sales data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={hourlyChartData}
                      margin={{
                        top: 15,
                        right: 15,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="salesGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.42}
                          />

                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0.03}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#ececf3"
                      />

                      <XAxis
                        dataKey="hour"
                        tick={{
                          fontSize: 11,
                          fill: "#77748b",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "#77748b",
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          Number(value).toLocaleString()
                        }
                      />

                      <Tooltip
                        formatter={(value, name) => [
                          name === "sales"
                            ? `GHS ${money(value)}`
                            : wholeNumber(value),
                          name === "sales" ? "Net Sales" : "Orders",
                        ]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />

                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        fill="url(#salesGradient)"
                        activeDot={{
                          r: 6,
                          strokeWidth: 3,
                          stroke: "#ffffff",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="executive-dashboard-card payment-donut-card">
              <header className="executive-card-header">
                <div>
                  <span>Collections</span>
                  <h2>Payment Mix</h2>
                </div>
              </header>

              <div className="payment-donut-layout">
                <div className="payment-donut-chart">
                  {paymentChartData.length === 0 ? (
                    <div className="executive-empty-state">
                      No payment data.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={88}
                          paddingAngle={3}
                        >
                          {paymentChartData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={paymentColors[entry.name] || "#6c5ce7"}
                            />
                          ))}
                        </Pie>

                        <Tooltip formatter={(value) => `GHS ${money(value)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  <div className="payment-donut-center">
                    <span>Total</span>
                    <strong>GHS {money(summary.NetSales)}</strong>
                  </div>
                </div>

                <div className="payment-legend-list">
                  {dashboard.payments.map((payment) => (
                    <div
                      className="payment-legend-row"
                      key={payment.PaymentMode}
                    >
                      <span
                        className="payment-color-dot"
                        style={{
                          background:
                            paymentColors[payment.PaymentMode] || "#6c5ce7",
                        }}
                      />

                      <div>
                        <strong>{payment.PaymentMode}</strong>

                        <small>
                          {Number(payment.PercentageOfNetSales || 0).toFixed(1)}
                          %
                        </small>
                      </div>

                      <b>GHS {money(payment.Amount)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="executive-ranking-grid">
            <article className="executive-dashboard-card">
              <header className="executive-card-header">
                <div>
                  <span>Sales Channels</span>
                  <h2>Order Types</h2>
                </div>
              </header>

              <div className="executive-ranked-list">
                {dashboard.orderTypes.map((orderType, index) => (
                  <div
                    className="executive-ranked-row"
                    key={orderType.OrderTypeID}
                  >
                    <span className="executive-rank-number">{index + 1}</span>

                    <div className="executive-rank-content">
                      <div>
                        <strong>{orderType.OrderTypeName}</strong>

                        <small>
                          {wholeNumber(orderType.NumberOfOrders)} orders
                        </small>
                      </div>

                      <div className="executive-progress-track">
                        <div
                          className="executive-progress-fill"
                          style={{
                            width: `${
                              (Number(orderType.NetSales || 0) /
                                orderTypeMaximum) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <b>GHS {money(orderType.NetSales)}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="executive-dashboard-card">
              <header className="executive-card-header">
                <div>
                  <span>Menu Performance</span>
                  <h2>Top Products</h2>
                </div>
              </header>

              <div className="executive-ranked-list">
                {dashboard.topProducts.slice(0, 7).map((product, index) => (
                  <div className="executive-ranked-row" key={product.ProductID}>
                    <span className="executive-rank-number product-rank">
                      {index + 1}
                    </span>

                    <div className="executive-rank-content">
                      <div>
                        <strong title={product.ProductName}>
                          {product.ProductName}
                        </strong>

                        <small>{wholeNumber(product.QuantitySold)} sold</small>
                      </div>

                      <div className="executive-progress-track">
                        <div
                          className="executive-progress-fill product-fill"
                          style={{
                            width: `${
                              (Number(product.QuantitySold || 0) /
                                productMaximum) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <b>GHS {money(product.SalesValue)}</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="executive-dashboard-card">
              <header className="executive-card-header">
                <div>
                  <span>Team Performance</span>
                  <h2>Cashier Leaderboard</h2>
                </div>
              </header>

              <div className="executive-ranked-list">
                {dashboard.cashiers.slice(0, 7).map((cashier, index) => (
                  <button
                    type="button"
                    className={`executive-ranked-row cashier-leader-row ${
                      Number(selectedUserID) === Number(cashier.UserID)
                        ? "active"
                        : ""
                    }`}
                    key={cashier.UserID}
                    onClick={() => {
                      if (isAdministrator) {
                        setSelectedUserID(cashier.UserID);
                      }
                    }}
                    disabled={!isAdministrator}
                  >
                    <div className={`leader-position leader-${index + 1}`}>
                      {index < 3 ? ["🥇", "🥈", "🥉"][index] : index + 1}
                    </div>

                    <div className="executive-rank-content">
                      <div>
                        <strong>{cashier.FullName || cashier.UserName}</strong>

                        <small>
                          {wholeNumber(cashier.NumberOfOrders)} orders · Avg GHS{" "}
                          {money(cashier.AverageOrderValue)}
                        </small>
                      </div>

                      <div className="executive-progress-track">
                        <div
                          className="executive-progress-fill cashier-fill"
                          style={{
                            width: `${
                              (Number(cashier.NetSales || 0) / cashierMaximum) *
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

          <section className="executive-alert-section">
            <header className="executive-alert-header">
              <div>
                <span>Exception Monitoring</span>
                <h2>Alert Centre</h2>
              </div>

              <div
                className={`alert-status-pill ${
                  Number(alerts.HasAlerts || 0) === 1 ? "has-alerts" : "clear"
                }`}
              >
                {Number(alerts.HasAlerts || 0) === 1
                  ? "Attention Required"
                  : "All Clear"}
              </div>
            </header>

            <div className="executive-alert-grid">
              <button
                type="button"
                className={`executive-alert-card deleted-alert ${
                  Number(alerts.DeletedOrders || 0) > 0 ? "active" : ""
                }`}
                onClick={() => {
                  if (isAdministrator) {
                    handleNavigation("deleted-order");
                  }
                }}
                disabled={!isAdministrator}
              >
                <div className="executive-alert-icon">🗑</div>

                <div>
                  <span>Deleted Orders</span>
                  <strong>{wholeNumber(alerts.DeletedOrders)}</strong>
                  <small>GHS {money(alerts.DeletedOrderValue)}</small>
                </div>
              </button>

              <button
                type="button"
                className={`executive-alert-card waiter-alert ${
                  Number(alerts.OrdersWithoutWaiter || 0) > 0 ? "active" : ""
                }`}
                onClick={() => handleNavigation("report")}
              >
                <div className="executive-alert-icon">👤</div>

                <div>
                  <span>Without Waiter</span>
                  <strong>{wholeNumber(alerts.OrdersWithoutWaiter)}</strong>
                  <small>GHS {money(alerts.OrdersWithoutWaiterValue)}</small>
                </div>
              </button>

              <button
                type="button"
                className={`executive-alert-card discount-alert ${
                  Number(alerts.DiscountedOrders || 0) > 0 ? "active" : ""
                }`}
                onClick={() => handleNavigation("report")}
              >
                <div className="executive-alert-icon">🏷</div>

                <div>
                  <span>Discounted Orders</span>
                  <strong>{wholeNumber(alerts.DiscountedOrders)}</strong>
                  <small>GHS {money(alerts.TotalDiscountGiven)}</small>
                </div>
              </button>

              <button
                type="button"
                className={`executive-alert-card cashup-alert status-${String(
                  alerts.CashUpStatus || "PENDING",
                ).toLowerCase()}`}
                onClick={() => handleNavigation("report")}
              >
                <div className="executive-alert-icon">💰</div>

                <div>
                  <span>Cash-Up Status</span>
                  <strong>{alerts.CashUpStatus || "PENDING"}</strong>
                  <small>
                    {alerts.CashUpStatus === "SHORTAGE"
                      ? `Short by GHS ${money(Math.abs(cashUpDifference))}`
                      : alerts.CashUpStatus === "OVERAGE"
                        ? `Over by GHS ${money(Math.abs(cashUpDifference))}`
                        : alerts.CashUpStatus === "BALANCED"
                          ? "Cash-up reconciled"
                          : "Cash-up not submitted"}
                  </small>
                </div>
              </button>
            </div>
          </section>

          <footer className="executive-dashboard-footer">
            <span>
              Showing:{" "}
              <strong>
                {selectedUserID === null
                  ? "All Cashiers"
                  : cashierOptions.find(
                      (cashier) =>
                        Number(cashier.UserID) === Number(selectedUserID),
                    )?.FullName ||
                    dashboard.cashiers.find(
                      (cashier) =>
                        Number(cashier.UserID) === Number(selectedUserID),
                    )?.FullName ||
                    user?.FullName ||
                    user?.UserName ||
                    "Selected Cashier"}
              </strong>
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

            <span>
              Auto refresh: <strong>Every 3 minutes</strong>
            </span>
          </footer>
        </>
      )}

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
