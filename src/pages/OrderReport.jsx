import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrderReport, selectShiftDetail } from "../api/orderApi";
import CashCountDialog from "../components/CashCountDialog";
import AppDialog from "../components/AppDialog";
import "../styles/OrderReport.css";

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function OrderReport({ user }) {
  const [reportDate, setReportDate] = useState(getToday());
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCashCount, setShowCashCount] = useState(false);
  const [shiftDetail, setShiftDetail] = useState(null);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
    }));
  };

  const showMessage = ({ type = "info", title, message }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  const loadReportData = useCallback(async () => {
    if (!reportDate || !user?.UserID) {
      return;
    }

    try {
      setLoading(true);

      const companyLocationID = user?.CompanyLocationID || 1;

      const [reportData, shiftData] = await Promise.all([
        getOrderReport({
          OrderDate: reportDate,
          CompanyLocationID: companyLocationID,
        }),

        selectShiftDetail({
          OrderDate: reportDate,
          CompanyLocationID: companyLocationID,
          UserID: user.UserID,
        }),
      ]);

      setReport(Array.isArray(reportData) ? reportData : []);

      setShiftDetail(
        Array.isArray(shiftData) && shiftData.length > 0 ? shiftData[0] : null,
      );
    } catch (error) {
      console.error("Failed to load order report:", error);

      setReport([]);
      setShiftDetail(null);

      showMessage({
        type: "error",
        title: "Unable to Load Report",
        message:
          error?.response?.data?.Message ||
          error?.response?.data?.ErrorMessage ||
          "The order report could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [reportDate, user?.UserID, user?.CompanyLocationID]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const totals = useMemo(() => {
    return report.reduce(
      (summary, row) => {
        summary.grossTotal += Number(row.GrossTotal || 0);
        summary.discount += Number(row.Discount || 0);
        summary.netTotal += Number(row.NetTotal || 0);
        summary.momoPayment += Number(row.MomoPayment || 0);
        summary.visaPayment += Number(row.VisaPayment || 0);
        summary.waiterPayment += Number(row.WaiterPayment || 0);
        summary.boltCharge += Number(row.BoltCharge || 0);
        summary.cashPayment += Number(row.CashPayment || 0);

        return summary;
      },
      {
        grossTotal: 0,
        discount: 0,
        netTotal: 0,
        momoPayment: 0,
        visaPayment: 0,
        waiterPayment: 0,
        boltCharge: 0,
        cashPayment: 0,
      },
    );
  }, [report]);

  const derivedCash =
    totals.cashPayment > 0
      ? totals.cashPayment
      : Math.max(
          0,
          totals.netTotal -
            totals.momoPayment -
            totals.visaPayment -
            totals.waiterPayment -
            totals.boltCharge,
        );

  const reportSummary = {
    ...totals,
    expectedCash: derivedCash,
  };

  return (
    <div className="order-report-page">
      <section className="report-toolbar">
        <div className="report-title">
          <span className="report-eyebrow">Daily Sales</span>
          <h2>Order Report</h2>
          <p>Review cashier sales and complete the daily cash count.</p>
        </div>

        <div className="report-toolbar-actions">
          <div className="report-date-field">
            <label htmlFor="report-date">Report Date</label>

            <input
              id="report-date"
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="refresh-report-button"
            onClick={loadReportData}
            disabled={loading}
          >
            ↻ {loading ? "Loading..." : "Refresh"}
          </button>

          <button
            type="button"
            className="cash-up-button"
            onClick={() => setShowCashCount(true)}
            disabled={loading || report.length === 0}
          >
            🧾 Cash Up / Print
          </button>
        </div>
      </section>

      <section className="report-kpi-grid">
        <div className="report-kpi-card">
          <span>Gross Total</span>
          <strong>GHS {money(totals.grossTotal)}</strong>
        </div>

        <div className="report-kpi-card discount">
          <span>Discount</span>
          <strong>GHS {money(totals.discount)}</strong>
        </div>

        <div className="report-kpi-card net">
          <span>Net Total</span>
          <strong>GHS {money(totals.netTotal)}</strong>
        </div>

        <div className="report-kpi-card cash">
          <span>Expected Cash</span>
          <strong>GHS {money(derivedCash)}</strong>
        </div>
      </section>

      <section className="cashier-report-panel">
        <div className="cashier-report-header">
          <div>
            <h3>Cashier Summary</h3>
            <p>{report.length} cashier record(s)</p>
          </div>

          <div className="branch-badge">
            {shiftDetail
              ? `Saved Cash-Up #${shiftDetail.ShiftDetailID}`
              : "Not Yet Saved"}
          </div>
        </div>

        {loading ? (
          <div className="report-state">Loading report...</div>
        ) : report.length === 0 ? (
          <div className="report-state">
            No orders were found for this date.
          </div>
        ) : (
          <div className="cashier-list">
            {report.map((row) => (
              <div
                className="cashier-report-row"
                key={`${row.CompanyLocationID}-${row.UserID}`}
              >
                <div className="cashier-report-avatar">
                  {row.UserName?.trim()?.charAt(0)?.toUpperCase() || "?"}
                </div>

                <div className="cashier-report-name">
                  <strong>{row.UserName}</strong>
                  <span>{row.CompanyLocationName}</span>
                </div>

                <div className="cashier-payment-mini">
                  <span>Momo</span>
                  <strong>GHS {money(row.MomoPayment)}</strong>
                </div>

                <div className="cashier-payment-mini">
                  <span>POS</span>
                  <strong>GHS {money(row.VisaPayment)}</strong>
                </div>

                <div className="cashier-net-total">
                  <span>Net Total</span>
                  <strong>GHS {money(row.NetTotal)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="report-payment-breakdown">
          <div>
            <span>Cash</span>
            <strong>GHS {money(derivedCash)}</strong>
          </div>

          <div>
            <span>Momo</span>
            <strong>GHS {money(totals.momoPayment)}</strong>
          </div>

          <div>
            <span>POS</span>
            <strong>GHS {money(totals.visaPayment)}</strong>
          </div>

          <div>
            <span>Waiter</span>
            <strong>GHS {money(totals.waiterPayment)}</strong>
          </div>

          <div>
            <span>Bolt</span>
            <strong>GHS {money(totals.boltCharge)}</strong>
          </div>

          <div className="overall-report-total">
            <span>Overall Total</span>
            <strong>GHS {money(totals.netTotal)}</strong>
          </div>
        </div>
      </section>

      {showCashCount && (
        <CashCountDialog
          user={user}
          reportDate={reportDate}
          report={report}
          summary={reportSummary}
          shiftDetail={shiftDetail}
          onCancel={() => setShowCashCount(false)}
          onSaved={(savedRecord) => {
            setShiftDetail(savedRecord);
          }}
        />
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

export default OrderReport;
