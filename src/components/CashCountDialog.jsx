import { useEffect, useMemo, useState } from "react";
import CashUpReceipt from "../print/CashUpReceipt";
import { printThermal } from "../print/printThermal";
import { insertShiftDetail, selectShiftDetail } from "../api/orderApi";
import AppDialog from "./AppDialog";
import "../styles/Components.css";

const denominations = [
  { key: "GHC200", label: "GHS 200 Note", value: 200 },
  { key: "GHC100", label: "GHS 100 Note", value: 100 },
  { key: "GHC50", label: "GHS 50 Note", value: 50 },
  { key: "GHC20", label: "GHS 20 Note", value: 20 },
  { key: "GHC10", label: "GHS 10 Note", value: 10 },
  { key: "GHC5", label: "GHS 5 Note", value: 5 },
  { key: "GHC2", label: "GHS 2 Note", value: 2 },
  { key: "GHC1", label: "GHS 1 Note", value: 1 },

  { key: "GHC2Coin", label: "GHS 2 Coin", value: 2 },
  { key: "GHC1Coin", label: "GHS 1 Coin", value: 1 },

  { key: "GP50", label: "50 Pesewas", value: 0.5 },
  { key: "GP20", label: "20 Pesewas", value: 0.2 },
  //   { key: "GP10", label: "10 Pesewas", value: 0.1 },
  //   { key: "GP5", label: "5 Pesewas", value: 0.05 },
  //   { key: "GP1", label: "1 Pesewa", value: 0.01 },
];

const keypadKeys = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  ".",
  "00",
];

const paymentFields = [
  {
    key: "momo",
    label: "Momo",
    icon: "📱",
  },
  {
    key: "pos",
    label: "POS",
    icon: "💳",
  },
  {
    key: "waiter",
    label: "Waiter",
    icon: "👤",
  },
  {
    key: "bolt",
    label: "Bolt",
    icon: "🚗",
  },
];

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const createEmptyCounts = () =>
  Object.fromEntries(
    denominations.map((denomination) => [denomination.key, ""]),
  );

const mapShiftDetailToCounts = (detail) => {
  if (!detail) {
    return createEmptyCounts();
  }

  return {
    GHC200: String(detail.GHC200 ?? ""),
    GHC100: String(detail.GHC100 ?? ""),
    GHC50: String(detail.GHC50 ?? ""),
    GHC20: String(detail.GHC20 ?? ""),
    GHC10: String(detail.GHC10 ?? ""),
    GHC5: String(detail.GHC5 ?? ""),
    GHC2: String(detail.GHC2 ?? ""),
    GHC1: String(detail.GHC1 ?? ""),

    GHC2Coin: String(detail.GHC2Coin ?? ""),
    GHC1Coin: String(detail.GHC1Coin ?? ""),

    GP50: String(detail.GP50 ?? ""),
    GP20: String(detail.GP20 ?? ""),
    GP10: String(detail.GP10 ?? ""),
    GP5: String(detail.GP5 ?? ""),
    GP1: String(detail.GP1 ?? ""),
  };
};

const createExtraPayments = (shiftDetail, summary = {}) => ({
  momo:
    shiftDetail?.Momo != null
      ? String(shiftDetail.Momo)
      : summary.momoPayment
        ? String(summary.momoPayment)
        : "",

  pos:
    shiftDetail?.POS != null
      ? String(shiftDetail.POS)
      : summary.visaPayment
        ? String(summary.visaPayment)
        : "",

  waiter: summary.waiterPayment ? String(summary.waiterPayment) : "",

  bolt:
    shiftDetail?.Bolt != null
      ? String(shiftDetail.Bolt)
      : summary.boltCharge
        ? String(summary.boltCharge)
        : "",
});

function CashCountDialog({
  user,
  reportDate,
  report = [],
  summary = {},
  shiftDetail = null,
  onCancel,
  onSaved,
}) {
  const [counts, setCounts] = useState(() =>
    mapShiftDetailToCounts(shiftDetail),
  );

  const [extraPayments, setExtraPayments] = useState(() =>
    createExtraPayments(shiftDetail, summary),
  );

  const [activeField, setActiveField] = useState({
    type: "denomination",
    key: "GHC200",
  });

  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    setCounts(mapShiftDetailToCounts(shiftDetail));
    setExtraPayments(createExtraPayments(shiftDetail, summary));
  }, [shiftDetail, summary]);

  const countedCash = useMemo(() => {
    return denominations.reduce((total, denomination) => {
      const quantity = Number(counts[denomination.key] || 0);

      return total + denomination.value * quantity;
    }, 0);
  }, [counts]);

  const nonCashTotal = useMemo(() => {
    return (
      Number(extraPayments.momo || 0) +
      Number(extraPayments.pos || 0) +
      Number(extraPayments.waiter || 0) +
      Number(extraPayments.bolt || 0)
    );
  }, [extraPayments]);

  const countedGrandTotal = countedCash + nonCashTotal;
  const expectedTotal = Number(summary.netTotal || 0);
  const difference = countedGrandTotal - expectedTotal;

  const status =
    Math.abs(difference) < 0.01
      ? "balanced"
      : difference > 0
        ? "overage"
        : "shortage";

  const closeMessageDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
    }));
  };

  const updateActiveField = (value) => {
    if (activeField.type === "denomination") {
      setCounts((previous) => ({
        ...previous,
        [activeField.key]: value,
      }));

      return;
    }

    setExtraPayments((previous) => ({
      ...previous,
      [activeField.key]: value,
    }));
  };

  const getActiveValue = () => {
    if (activeField.type === "denomination") {
      return String(counts[activeField.key] || "");
    }

    return String(extraPayments[activeField.key] || "");
  };

  const appendKey = (key) => {
    const currentValue = getActiveValue();

    if (key === "." && currentValue.includes(".")) {
      return;
    }

    /*
     * Denomination fields represent quantities, so they should
     * accept only whole numbers. Decimal values are allowed only
     * for Momo, POS, Waiter and Bolt.
     */
    if (activeField.type === "denomination" && key === ".") {
      return;
    }

    updateActiveField(`${currentValue}${key}`);
  };

  const backspace = () => {
    updateActiveField(getActiveValue().slice(0, -1));
  };

  const clearActive = () => {
    updateActiveField("");
  };

  const clearAll = () => {
    setCounts(createEmptyCounts());

    setExtraPayments({
      momo: "",
      pos: "",
      waiter: "",
      bolt: "",
    });

    setActiveField({
      type: "denomination",
      key: "GHC200",
    });
  };

  const handlePrint = async () => {
    if (saving) {
      return;
    }

    if (!user?.UserID) {
      setDialog({
        open: true,
        type: "error",
        title: "Invalid User",
        message: "The logged-in user could not be identified.",
      });

      return;
    }

    const payload = {
      ShiftID: 1,
      ShiftDetailID: Number(shiftDetail?.ShiftDetailID || 0),
      OrderDate: reportDate,
      UserID: Number(user.UserID),

      GHC200: Number(counts.GHC200 || 0),
      GHC100: Number(counts.GHC100 || 0),
      GHC50: Number(counts.GHC50 || 0),
      GHC20: Number(counts.GHC20 || 0),
      GHC10: Number(counts.GHC10 || 0),
      GHC5: Number(counts.GHC5 || 0),
      GHC2: Number(counts.GHC2 || 0),
      GHC1: Number(counts.GHC1 || 0),

      GHC2Coin: Number(counts.GHC2Coin || 0),
      GHC1Coin: Number(counts.GHC1Coin || 0),

      GP50: Number(counts.GP50 || 0),
      GP20: Number(counts.GP20 || 0),
      GP10: Number(counts.GP10 || 0),
      GP5: Number(counts.GP5 || 0),
      GP1: Number(counts.GP1 || 0),

      Momo: Number(extraPayments.momo || 0),
      Pos: Number(extraPayments.pos || 0),
      Bolt: Number(extraPayments.bolt || 0),
    };

    try {
      setSaving(true);

      const response = await insertShiftDetail(payload);

      const successful =
        response?.Success === 1 ||
        response?.success === 1 ||
        response?.ErrorNumber === 0 ||
        response?.errorNumber === 0;

      if (!successful) {
        setDialog({
          open: true,
          type: "error",
          title: "Cash-Up Not Saved",
          message:
            response?.Message ||
            response?.message ||
            response?.ErrorMessage ||
            response?.errorMessage ||
            "The cash-up details could not be saved.",
        });

        return;
      }

      /*
       * Reload the saved record so the next save uses the
       * correct ShiftDetailID and performs an update.
       */
      const refreshedShiftData = await selectShiftDetail({
        OrderDate: reportDate,
        CompanyLocationID: user?.CompanyLocationID || 1,
        UserID: user.UserID,
      });

      const refreshedShiftDetail =
        Array.isArray(refreshedShiftData) && refreshedShiftData.length > 0
          ? refreshedShiftData[0]
          : null;

      if (typeof onSaved === "function") {
        onSaved(refreshedShiftDetail);
      }

      await printThermal(
        <CashUpReceipt
          paper="80"
          companyName={user?.CompanyName}
          companyLocationName={user?.CompanyLocationName}
          reportDate={reportDate}
          cashierName={user?.FullName || user?.UserName}
          report={report}
          summary={summary}
          counts={counts}
          denominations={denominations}
          countedCash={countedCash}
          extraPayments={extraPayments}
          nonCashTotal={nonCashTotal}
          countedGrandTotal={countedGrandTotal}
          difference={difference}
          status={status}
        />,
        {
          title: `Cash Up ${reportDate}`,
        },
      );

      setDialog({
        open: true,
        type: "success",
        title: shiftDetail ? "Cash-Up Updated" : "Cash-Up Completed",
        message: shiftDetail
          ? "The saved cash-up details were updated and the report was sent to the printer."
          : "The cash-up details were saved and the report was sent to the printer.",
      });
    } catch (error) {
      console.error("Cash-up save/print failed:", error);

      setDialog({
        open: true,
        type: "error",
        title: "Cash-Up Failed",
        message:
          error?.response?.data?.Message ||
          error?.response?.data?.message ||
          error?.response?.data?.ErrorMessage ||
          error?.response?.data?.errorMessage ||
          error?.message ||
          "The cash-up details could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cash-count-backdrop">
      <div className="cash-count-dialog">
        <div className="cash-count-header">
          <div>
            <span>End of Day</span>

            <h2>Cash Count & Reconciliation</h2>

            <p>
              {reportDate} · Expected: GHS {money(expectedTotal)}
            </p>

            <div className="cash-up-record-status">
              {shiftDetail ? (
                <>
                  <span className="saved-indicator" />
                  Updating saved cash-up #{shiftDetail.ShiftDetailID}
                </>
              ) : (
                <>
                  <span className="new-indicator" />
                  New cash-up entry
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className="cash-count-close"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close cash count"
          >
            ×
          </button>
        </div>

        <div className="cash-count-body">
          <section className="denomination-section">
            <div className="cash-count-section-title">
              <div>
                <h3>Cash Denominations</h3>

                <p>Enter the number of each note or coin.</p>
              </div>

              <button
                type="button"
                className="clear-all-counts"
                onClick={clearAll}
                disabled={saving}
              >
                Clear All
              </button>
            </div>

            <div className="denomination-grid">
              {denominations.map((denomination) => {
                const count = Number(counts[denomination.key] || 0);

                const lineTotal = denomination.value * count;

                const isActive =
                  activeField.type === "denomination" &&
                  activeField.key === denomination.key;

                return (
                  <div
                    className={`denomination-card ${isActive ? "active" : ""}`}
                    key={denomination.key}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setActiveField({
                        type: "denomination",
                        key: denomination.key,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setActiveField({
                          type: "denomination",
                          key: denomination.key,
                        });
                      }
                    }}
                  >
                    <div className="denomination-value">
                      {denomination.label}
                    </div>

                    <input
                      value={counts[denomination.key]}
                      readOnly
                      inputMode="numeric"
                      placeholder="0"
                      aria-label={`${denomination.label} quantity`}
                      onFocus={() =>
                        setActiveField({
                          type: "denomination",
                          key: denomination.key,
                        })
                      }
                    />

                    <strong>GHS {money(lineTotal)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="other-payment-grid">
              {paymentFields.map((field) => {
                const isActive =
                  activeField.type === "payment" &&
                  activeField.key === field.key;

                return (
                  <div
                    key={field.key}
                    className={`other-payment-field ${
                      isActive ? "active" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setActiveField({
                        type: "payment",
                        key: field.key,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setActiveField({
                          type: "payment",
                          key: field.key,
                        });
                      }
                    }}
                  >
                    <label htmlFor={`cash-up-${field.key}`}>
                      {field.icon} {field.label}
                    </label>

                    <input
                      id={`cash-up-${field.key}`}
                      value={extraPayments[field.key]}
                      readOnly
                      inputMode="decimal"
                      placeholder="0.00"
                      onFocus={() =>
                        setActiveField({
                          type: "payment",
                          key: field.key,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="cash-count-side">
            <div className="cash-count-keypad">
              {keypadKeys.map((key) => (
                <button
                  type="button"
                  key={key}
                  disabled={
                    saving ||
                    (activeField.type === "denomination" && key === ".")
                  }
                  onClick={() => appendKey(key)}
                >
                  {key}
                </button>
              ))}

              <button
                type="button"
                className="count-backspace"
                onClick={backspace}
                disabled={saving}
              >
                ⌫
              </button>

              <button
                type="button"
                className="count-clear"
                onClick={clearActive}
                disabled={saving}
              >
                Clear
              </button>
            </div>

            <div className="reconciliation-summary">
              <div>
                <span>Expected Total</span>
                <strong>GHS {money(expectedTotal)}</strong>
              </div>

              <div>
                <span>Counted Cash</span>
                <strong>GHS {money(countedCash)}</strong>
              </div>

              <div>
                <span>Non-Cash Total</span>
                <strong>GHS {money(nonCashTotal)}</strong>
              </div>

              <div>
                <span>Counted Total</span>
                <strong>GHS {money(countedGrandTotal)}</strong>
              </div>

              <div className={`difference-row ${status}`}>
                <span>
                  {status === "balanced"
                    ? "Balanced"
                    : status === "overage"
                      ? "Overage"
                      : "Shortage"}
                </span>

                <strong>GHS {money(Math.abs(difference))}</strong>
              </div>
            </div>
          </aside>
        </div>

        <div className="cash-count-footer">
          <button
            type="button"
            className="cash-count-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="cash-count-print"
            onClick={handlePrint}
            disabled={saving}
          >
            {saving
              ? "Saving Cash-Up..."
              : shiftDetail
                ? "🖨 Update & Print Cash-Up"
                : "🖨 Save & Print Cash-Up"}
          </button>
        </div>
      </div>

      <AppDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText="OK"
        showCancel={false}
        onCancel={closeMessageDialog}
        onConfirm={closeMessageDialog}
      />
    </div>
  );
}

export default CashCountDialog;
