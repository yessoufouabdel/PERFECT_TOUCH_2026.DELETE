import React from "react";
import "./ThermalReceipt.css";

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CashUpReceipt({
  paper = "80",
  companyName,
  companyLocationName,
  reportDate,
  cashierName,
  report = [],
  summary,
  counts = {},
  countedCash,
  extraPayments,
  nonCashTotal,
  countedGrandTotal,
  difference,
  status,
  denominations = [],
}) {
  return (
    <div className={`ticket ${paper === "80" ? "w80" : "w58"}`}>
      <div className="meta">
        <div className="title">{companyName}</div>
        <div className="title">{companyLocationName}</div>
        <div>DAILY CASH-UP REPORT</div>
        <div>{reportDate}</div>
        <div>Prepared by: {cashierName}</div>
        <div>Printed: {new Date().toLocaleString()}</div>
      </div>

      <div className="rule" />

      <div className="totals">
        {report.map((row) => (
          <div className="row" key={row.UserID}>
            <span>{row.UserName}</span>
            <strong>{money(row.NetTotal)}</strong>
          </div>
        ))}
      </div>

      <div className="rule" />

      <div className="totals">
        <div className="row">
          <span>GROSS TOTAL</span>
          <strong>{money(summary.grossTotal)}</strong>
        </div>

        <div className="row">
          <span>DISCOUNT</span>
          <strong>{money(summary.discount)}</strong>
        </div>

        <div className="row">
          <span>NET TOTAL</span>
          <strong>{money(summary.netTotal)}</strong>
        </div>
      </div>

      <div className="rule" />

      <div className="meta">
        <strong>DENOMINATION COUNT</strong>
      </div>

      <div className="totals">
        {denominations
          .filter((denomination) => Number(counts[denomination.key] || 0) > 0)
          .map((denomination) => {
            const quantity = Number(counts[denomination.key] || 0);

            return (
              <div className="row" key={denomination.key}>
                <span>
                  {denomination.label} × {quantity}
                </span>

                <strong>{money(denomination.value * quantity)}</strong>
              </div>
            );
          })}
      </div>

      <div className="rule" />

      <div className="totals">
        <div className="row">
          <span>COUNTED CASH</span>
          <strong>{money(countedCash)}</strong>
        </div>

        <div className="row">
          <span>MOMO</span>
          <strong>{money(extraPayments.momo)}</strong>
        </div>

        <div className="row">
          <span>POS</span>
          <strong>{money(extraPayments.pos)}</strong>
        </div>

        <div className="row">
          <span>WAITER</span>
          <strong>{money(extraPayments.waiter)}</strong>
        </div>

        <div className="row">
          <span>BOLT</span>
          <strong>{money(extraPayments.bolt)}</strong>
        </div>

        <div className="row">
          <span>NON-CASH TOTAL</span>
          <strong>{money(nonCashTotal)}</strong>
        </div>

        <div className="row">
          <span>COUNTED TOTAL</span>
          <strong>{money(countedGrandTotal)}</strong>
        </div>
      </div>

      <div className="rule" />

      <div className="totals">
        <div className="row">
          <span>EXPECTED</span>
          <strong>{money(summary.netTotal)}</strong>
        </div>

        <div className="row">
          <span>
            {status === "balanced"
              ? "BALANCED"
              : status === "overage"
                ? "OVERAGE"
                : "SHORTAGE"}
          </span>

          <strong>{money(Math.abs(difference))}</strong>
        </div>
      </div>

      <div className="rule" />

      <div className="foot">Cashier Signature: __________________</div>

      <div className="foot">Supervisor Signature: _______________</div>

      <div className="cutline">-----------------------------------</div>
    </div>
  );
}
