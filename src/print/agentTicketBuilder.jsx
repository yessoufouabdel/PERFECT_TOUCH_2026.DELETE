// --- agentTicketBuilder.js ---

// Safe read from localStorage -> "" if null/undefined
const ls = (k) => {
  try {
    const v = String(localStorage.getItem(k) ?? "").trim();
    const lc = v.toLowerCase();
    return (v && lc !== "null" && lc !== "undefined") ? v : "";
  } catch { return ""; }
};

// Force a number (0 if NaN/undefined)
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// POS → Agent payload matching app.py build_ticket()
export function buildAgentTicket({
  saleNo,
  customerName = "",
  items = [],
  saleTotal = 0,
  discount = 0,
  netTotal = 0,
  amountPaid = 0,
  paymentModeName = "",       // e.g., "Cash"
  paper = "80",               // "58" | "80"
  saleTypeOverride = "",      // optional explicit sale type
}) {
  // Compute per your JSX
  const change = num(amountPaid) - num(netTotal || saleTotal);
  const dateStr = new Date().toLocaleString();

  // Flatten items to { name, price, qty, total } like the agent needs
  const flatItems = (items || []).map(it => {
    const name  = it.productName ?? it.ProductName ?? "";
    const packageName = it.packageName ?? it.PackageName ?? "";
    const unit  = num(it.vatUnitPrice ?? it.discountedUnitPrice ?? it.effectiveUnitPrice ?? it.unitPrice ?? it.UnitPrice);
    const qty   = num(it.qty ?? it.Qty);
    const total = num(it.total ?? it.Total ?? (unit * qty));
    return { name, packageName, price: unit, qty, total };
  });

  return {
    // Header fields
    paper,
    companyName:        ls("CompanyName") || ls("CompanyGroupName"),
    companyLocationName:ls("CompanyLocationName"),
    phone:              ls("CompanyPhoneNo"),
    vatNo:              ls("VATNo"),
    address:            ls("Address"),

    // Meta
    saleNo,
    dateStr,
    cashier:            ls("username"),
    customerName,
    paymentModeName,                             // shown in JSX
    saleType: saleTypeOverride || `${paymentModeName || "Cash"} Sale`,  // prints ** X Sale **

    // Items/table
    items: flatItems,

    // Totals (names match app.py)
    totals: {
      total:       num(saleTotal),
      discount:    num(discount),
      amount_due:  num(netTotal || saleTotal),
      paid:        num(amountPaid),
      change:      num(change),
    },

    // Footer (either texts or agent will also accept footer array)
    firstText:  ls("FirstTextBelowReceipt"),
    secondText: ls("SecondTextBelowReceipt"),

    // Cut mode (partial|full)
    cut: "partial",

    // Optional:
    // printerName: "Your POS-58",
  };
}
