// src/print/ThermalReceipt.jsx
import React from "react";
import "./ThermalReceipt.css";

// Smart currency: up to 2dp, no trailing zeros (saves space)
const fmt = (n) => {
  const val = Number(n ?? 0);
  if (!isFinite(val)) return "0";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const readLS = (k) => {
  try {
    const raw = localStorage.getItem(k);
    if (raw == null) return "";
    const v = String(raw).trim();
    const lc = v.toLowerCase();
    if (!v || lc === "null" || lc === "undefined") return "";
    return v;
  } catch {
    return "";
  }
};

export default function ThermalReceipt({
  paper = "58",                 // "58" | "80"
  saleNo,
  customerName,
  items = [],
  saleTotal,
  discount,
  netTotal,
  amountPaid,
  paymentModeName = "",
  cashier = readLS("username") || "",
  // Optional overrides (otherwise read from localStorage)
  companyGroupName  = readLS("CompanyGroupName"),
  companyName  = readLS("CompanyName"),
  companyLocationName  = readLS("CompanyLocationName"),
  phone        = readLS("CompanyPhoneNo"),
  address      = readLS("Address"),
  vatNo        = readLS("VATNo"),
  firstText    = readLS("FirstTextBelowReceipt"),
  secondText   = readLS("SecondTextBelowReceipt"),
}) {
  const change = Number(amountPaid || 0) - Number(netTotal || 0);
  const dateStr = new Date().toLocaleString();

  return (
    <div className={`ticket ${paper === "80" ? "w80" : "w58"}`}>
      <div className="meta">
        {companyName && <div className="title">{companyName}</div>}
        {companyLocationName && <div className="title">{companyLocationName}</div>}
        {phone && <div>Phone: {phone}</div>}
        {vatNo && <div>VAT No.: {vatNo}</div>}
        {address && <div>{address}</div>}
        {saleNo ? <div>#{String(saleNo)}</div> : null}
      </div>

      <div className="meta">
        <div>{dateStr}</div>
        {cashier && <div>Cashier: {cashier}</div>}
        {customerName && <div>Customer: {customerName}</div>}
        {paymentModeName && <div>Payment: {paymentModeName}</div>}
        <div>** Cash Sale **</div>
      </div>

      <table className="items">
        <colgroup>
          <col className="col-item" />
          <col className="col-qty" />
          <col className="col-price" />
          <col className="col-total" />
        </colgroup>

        <thead>
          <tr>
            <th className="left">Item</th>
            <th className="right qty">Qty</th>
            <th className="right">Price</th>
            <th className="right">Total</th>
          </tr>
        </thead>

        <tbody>
          {(items || []).map((it, i) => {
            const name  = it.productName ?? it.ProductName ?? "";
            const pkg   = it.packageName ?? it.PackageName ?? "";
            const unit  = it.unitPrice  ?? it.UnitPrice  ?? 0;
            const qty   = it.qty        ?? it.Qty        ?? 0;
            const total = it.total      ?? it.Total      ?? Number(unit) * Number(qty);

            return (
              <React.Fragment key={`${name}-${i}`}>
                {/* Row 1: Item name (spans full width) */}
                <tr className="item-name-row">
                  <td className="left name bigcell name-only" colSpan={4}>
                    {name}{pkg ? ` — ${pkg}` : ""}
                  </td>
                </tr>

                {/* Row 2: aligned numbers under Price | Qty | Total */}
                <tr className="item-detail-row">
                  <td /> {/* keeps columns aligned */}
                  <td className="right bigcell num">{fmt(qty)}</td>
                  <td className="right bigcell num">{fmt(unit)}</td>
                  <td className="right bigcell num">{fmt(total)}</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>

      </table>

      <div className="rule" />

      <div className="totals">
        <div className="row">
          <span>Total</span>
          <strong>{fmt(saleTotal)}</strong>
        </div>
        <div className="row">
          <span>Discount</span>
          <strong>{fmt(discount)}</strong>
        </div>
        <div className="row">
          <span>Amount Due</span>
          <strong>{fmt(netTotal)}</strong>
        </div>
        <div className="row">
          <span>Paid</span>
          <strong>{fmt(amountPaid)}</strong>
        </div>
        <div className="row">
          <span>Change</span>
          <strong>{fmt(change)}</strong>
        </div>
      </div>

      {firstText ? <div className="foot">{firstText}</div> : null}
      {secondText ? <div className="foot italic">{secondText}</div> : null}

      <div className="cutline">-----------------------------------</div>
      <div className="foot">Software Contact: 0244 40 50 03</div>
    </div>
  );
}
