import { useMemo, useState } from "react";
import "../styles/Components.css";

function PaymentDialog({ netTotal, onCancel, onConfirm }) {
  const [payments, setPayments] = useState({
    cash: "",
    momo: "",
    pos: "",
    bolt: "",
  });

  const [activeField, setActiveField] = useState("cash");

  const totalPaid = useMemo(() => {
    return (
      Number(payments.cash || 0) +
      Number(payments.momo || 0) +
      Number(payments.pos || 0) +
      Number(payments.bolt || 0)
    );
  }, [payments]);

  const change = totalPaid - Number(netTotal || 0);

  const setFieldValue = (field, value) => {
    setPayments((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const appendKey = (key) => {
    setPayments((prev) => ({
      ...prev,
      [activeField]: `${prev[activeField] || ""}${key}`,
    }));
  };

  const backspace = () => {
    setPayments((prev) => ({
      ...prev,
      [activeField]: String(prev[activeField] || "").slice(0, -1),
    }));
  };

  const clearField = (field) => {
    setFieldValue(field, "");
  };

  const exactAmount = (field) => {
    setFieldValue(field, Number(netTotal || 0).toFixed(2));
  };

  const confirmPayment = () => {
    if (totalPaid < Number(netTotal || 0)) {
      alert("Amount paid is less than net total");
      return;
    }

    onConfirm({
      cashPayment: Number(payments.cash || 0),
      momoPayment: Number(payments.momo || 0),
      visaPayment: Number(payments.pos || 0),
      boltCharge: Number(payments.bolt || 0),
      amountPaid: totalPaid,
      change,
    });
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "00"];

  const paymentFields = [
    { key: "cash", label: "Cash" },
    { key: "momo", label: "Momo" },
    { key: "pos", label: "POS" },
    { key: "bolt", label: "Bolt" },
  ];

  return (
    <div className="payment-backdrop">
      <div className="payment-dialog">
        <div className="payment-header">
          <div>
            <h2>Payment</h2>
            <p>Net Total: GHS {Number(netTotal || 0).toFixed(2)}</p>
          </div>

          <button className="payment-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="payment-body">
          <div className="payment-fields">
            {paymentFields.map((field) => (
              <div
                key={field.key}
                className={`payment-field ${
                  activeField === field.key ? "active" : ""
                }`}
                onClick={() => setActiveField(field.key)}
              >
                <label>{field.label}</label>

                <input
                  value={payments[field.key]}
                  readOnly
                  placeholder="0.00"
                  onFocus={() => setActiveField(field.key)}
                />

                <div className="payment-field-actions">
                  <button onClick={() => exactAmount(field.key)}>Exact</button>
                  <button onClick={() => clearField(field.key)}>Clear</button>
                </div>
              </div>
            ))}
          </div>

          <div className="payment-keypad">
            {keys.map((key) => (
              <button key={key} onClick={() => appendKey(key)}>
                {key}
              </button>
            ))}

            <button className="payment-key-action" onClick={backspace}>
              ⌫
            </button>

            <button
              className="payment-key-action clear"
              onClick={() => clearField(activeField)}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="payment-summary">
          <div>
            <span>Total Paid</span>
            <strong>GHS {totalPaid.toFixed(2)}</strong>
          </div>

          <div>
            <span>Change</span>
            <strong className={change < 0 ? "negative-change" : ""}>
              GHS {change.toFixed(2)}
            </strong>
          </div>

          <button className="payment-cancel" onClick={onCancel}>
            Cancel
          </button>

          <button className="payment-confirm" onClick={confirmPayment}>
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentDialog;