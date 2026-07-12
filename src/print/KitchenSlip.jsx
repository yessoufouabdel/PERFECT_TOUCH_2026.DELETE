import React from "react";
import "./ThermalReceipt.css";

export default function KitchenSlip({
  paper = "80",
  orderNo,
  orderTypeName,
  cashierName,
  waiterName,
  companyName,
  companyLocationName,
  orderDate,
  items = [],
}) {
  return (
    <div className={`ticket ${paper === "80" ? "w80" : "w58"}`}>
      <div className="meta">
        <div className="title">{companyName}</div>
        <div className="title">{companyLocationName}</div>
        <div>*** KITCHEN ORDER ***</div>
      </div>

      <div className="rule" />

      <div className="meta">
        <div>Order No: {orderNo}</div>
        <div>Order Type: {orderTypeName}</div>
        <div>Cashier: {cashierName}</div>
        <div>Waiter: {waiterName}</div>
        <div>{new Date(orderDate).toLocaleString()}</div>
      </div>

      <div className="rule" />

      {(items || []).map((item, index) => {
        const price = Number(item.SellingPriceWithTAX || item.unitPrice || 0);

        return (
            <div
            key={`${item.ProductID}-${item.PackageID}-${index}`}
            style={{
                marginBottom: 14,
                fontSize: 21,
                lineHeight: 1.35,
                fontWeight: 700,
            }}
            >
            {item.Qty} x {item.ProductName} ({price.toFixed(2)})
            
            {item.ProductOption && (
                <div
                style={{
                    marginTop: 4,
                    marginLeft: 18,
                    fontSize: 18,
                    fontWeight: 600,
                }}
                >
                Note: {item.ProductOption}
                </div>
            )}
            </div>
        );
        })}

      <div className="rule" />
      <div className="foot">Send to Kitchen</div>
    </div>
  );
}