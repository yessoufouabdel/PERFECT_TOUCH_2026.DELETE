import { useEffect, useState } from "react";
import { getProductCategories, getProductsByCategory } from "../api/productApi";
import { getWaiters } from "../api/userApi";
import { getOrderTypes, saveOrder } from "../api/orderApi";

import ThermalReceipt from "../print/ThermalReceipt";
import { printThermal } from "../print/printThermal";
import { pingAgent, printViaAgentEscPos } from "../print/agentClient";
import { buildAgentTicket } from "../print/agentTicketBuilder";
import KitchenSlip from "../print/KitchenSlip";
import PaymentDialog from "../components/PaymentDialog";
import AppDialog from "../components/AppDialog";
import ProductOptionDialog from "../components/ProductOptionDialog";

import "../styles/OrderScreen.css";

function OrderScreen({ user }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orderTypes, setOrderTypes] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [selectedOrderTypeId, setSelectedOrderTypeId] = useState("1");
  const [selectedWaiterId, setSelectedWaiterId] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [optionItem, setOptionItem] = useState(null);

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

  useEffect(() => {
    loadCategories();
    loadOrderTypes();
    loadWaiters();
  }, []);

  const closeDialog = () => {
    setDialog((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
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

  const showConfirm = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "confirm",
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

  const loadCategories = async () => {
    const data = await getProductCategories();
    setCategories(data || []);
  };

  const saveProductOption = (note) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ProductID === optionItem.ProductID &&
        item.PackageID === optionItem.PackageID
          ? { ...item, ProductOption: note }
          : item,
      ),
    );

    setOptionItem(null);
  };

  const loadOrderTypes = async () => {
    try {
      const data = await getOrderTypes();
      const availableOrderTypes = data || [];

      setOrderTypes(availableOrderTypes);

      const inOrderType = availableOrderTypes.find(
        (type) => Number(type.OrderTypeID) === 1,
      );

      setSelectedOrderTypeId(
        inOrderType ? String(inOrderType.OrderTypeID) : "",
      );
    } catch (error) {
      console.error("Failed to load order types:", error);
      showMessage({
        type: "error",
        title: "Unable to Load Order Types",
        message:
          "The order types could not be loaded. Please check the connection and try again.",
      });
    }
  };

  const loadWaiters = async () => {
    try {
      const data = await getWaiters(user?.CompanyLocationID || 1);

      setWaiters((data || []).filter((waiter) => waiter.IsActive));
      setSelectedWaiterId("");
    } catch (error) {
      console.error("Failed to load waiters:", error);
      showMessage({
        type: "error",
        title: "Unable to Load Waiters",
        message: "The waiter list could not be loaded.",
      });
    }
  };

  const handleCancelOrder = () => {
    if (cart.length === 0) {
      return;
    }

    showConfirm({
      type: "confirm",
      title: "Cancel Current Order?",
      message:
        "All selected products, quantities, options and discounts will be removed.",
      confirmText: "Yes, Cancel Order",
      cancelText: "Keep Order",
      onConfirm: () => {
        setCart([]);
        setDiscount(0);
        setSelectedWaiterId("");
        setSelectedOrderTypeId("1");
        setShowPaymentDialog(false);
        setOptionItem(null);

        showMessage({
          type: "success",
          title: "Order Cancelled",
          message: "The current order has been cleared successfully.",
        });
      },
    });
  };

  const printReceiptCopies = async ({ orderResponse, orderItems, payload }) => {
    const copies = Number(user?.NoOfReceiptToPrint || 1);

    const saleNo = orderResponse.OrderNo;
    const customerName = payload.customerName || "";
    const saleTotal = payload.orderTotal;
    const amountPaid = payload.amountPaid;
    const vat = Number(orderResponse?.VAT || 0);
    const nhil = Number(orderResponse?.NHIL || 0);
    const tourism = Number(orderResponse?.TL || 0);
    const grossTotal = Number(payload.orderTotal || 0);
    const subTotal = grossTotal - vat - nhil - tourism;
    const paymentModeName = "Cash";

    const receiptItems = orderItems.map((item) => ({
      ...item,
      unitPrice: item.SellingPriceWithTAX,
      qty: item.Qty,
      total: item.Total,
    }));

    const ticket = buildAgentTicket({
      saleNo,
      customerName,
      items: receiptItems,
      saleTotal,
      discount,
      netTotal: payload.netTotal,
      amountPaid,
      paymentModeName,
      paper: "80",
    });

    try {
      if (await pingAgent()) {
        for (let i = 0; i < copies; i++) {
          await printViaAgentEscPos(ticket);
        }
      } else {
        for (let i = 0; i < copies; i++) {
          await printThermal(
            <ThermalReceipt
              paper="80"
              saleNo={saleNo}
              customerName={customerName}
              items={receiptItems}
              saleTotal={saleTotal}
              subTotal={subTotal}
              nhil={nhil}
              vat={vat}
              tourism={tourism}
              grossTotal={grossTotal}
              discount={payload.discount}
              netTotal={payload.netTotal}
              amountPaid={amountPaid}
              paymentModeName={paymentModeName}
              cashier={orderResponse?.CashierName || user?.FullName}
              companyName={user?.CompanyName}
              companyLocationName={user?.CompanyLocationName}
              phone={user?.CompanyPhoneNo}
              vatNo={user?.VATNo}
              firstText={user?.FirstTextBelowReceipt}
              secondText={user?.SecondTextBelowReceipt}
            />,
            { title: `Receipt ${saleNo}` },
          );
        }
      }
    } catch (e) {
      console.warn("Agent print failed:", e);

      for (let i = 0; i < copies; i++) {
        await printThermal(
          <ThermalReceipt
            paper="80"
            saleNo={saleNo}
            customerName={customerName}
            items={receiptItems}
            saleTotal={saleTotal}
            subTotal={subTotal}
            nhil={nhil}
            vat={vat}
            tourism={tourism}
            grossTotal={grossTotal}
            discount={payload.discount}
            netTotal={payload.netTotal}
            amountPaid={amountPaid}
            paymentModeName={paymentModeName}
            cashier={orderResponse?.CashierName || user?.FullName}
            companyName={user?.CompanyName}
            companyLocationName={user?.CompanyLocationName}
            phone={user?.CompanyPhoneNo}
            vatNo={user?.VATNo}
            firstText={user?.FirstTextBelowReceipt}
            secondText={user?.SecondTextBelowReceipt}
          />,
          { title: `Receipt ${saleNo}` },
        );
      }
    }
  };

  const printKitchenSlip = async ({ orderResponse, orderItems }) => {
    const copies = Number(user?.NoOfOrderToPrint || 1);

    for (let i = 0; i < copies; i++) {
      await printThermal(
        <KitchenSlip
          paper="80"
          orderNo={orderResponse.OrderNo}
          orderTypeName={orderResponse.OrderTypeName}
          cashierName={orderResponse.CashierName}
          waiterName={orderResponse.WaiterName}
          companyName={user?.CompanyName}
          companyLocationName={user?.CompanyLocationName}
          orderDate={orderResponse.OrderDate}
          items={orderItems}
        />,
        { title: `Kitchen Order ${orderResponse.OrderNo}` },
      );
    }
  };

  const handlePay = async (paymentInfo) => {
    if (cart.length === 0) {
      showMessage({
        type: "warning",
        title: "Empty Order",
        message:
          "Please add at least one product before proceeding to payment.",
      });
      return;
    }

    if (!selectedOrderTypeId) {
      showMessage({
        type: "warning",
        title: "Order Type Required",
        message: "Please select the order type before continuing.",
      });
      return;
    }

    const orderItems = cart.map((item) => ({
      ...item,
      Qty: item.qty,
      Total: Number(item.SellingPriceWithTAX || 0) * item.qty,
      ProductOption: item.ProductOption || "",
      IsItNewOrder: true,
      IsSelectedForPromotion: false,
    }));

    const payload = {
      orderID: 0,
      orderTotal: total,
      discount: Number(discount || 0),
      netTotal: net,
      WaiterName: selectedWaiterId
        ? waiters.find(
            (waiter) => Number(waiter.UserID) === Number(selectedWaiterId),
          )?.FullName || ""
        : "",
      customerID: 0,
      customerName: "",
      userID: String(user.UserID),
      shiftID: 1,
      tableID: 1,
      orderTypeID: Number(selectedOrderTypeId),
      companyLocationID: String(user.CompanyLocationID),
      data: orderItems,
      customerLocation: "",
      customerPhoneNo: "",
      cashPayment: paymentInfo.cashPayment,
      momoPayment: paymentInfo.momoPayment,
      visaPayment: paymentInfo.visaPayment,
      waiterPayment: 0,
      amountPaid: paymentInfo.amountPaid,
      boltCharge: paymentInfo.boltCharge,
    };

    try {
      const response = await saveOrder(payload);

      if (response?.Success !== 1) {
        showMessage({
          type: "error",
          title: "Order Not Saved",
          message: response?.Message || "The order could not be saved.",
        });

        return false;
      }

      const orderResponse = {
        ...response,
        NewlyInsertedOrderID: response.OrderID,
        OrderTypeName:
          orderTypes.find(
            (x) => Number(x.OrderTypeID) === Number(selectedOrderTypeId),
          )?.OrderTypeName || "",
        CashierName: user?.FullName || user?.UserName || "",
        WaiterName:
          waiters.find((x) => Number(x.UserID) === Number(selectedWaiterId))
            ?.FullName || "",
        OrderDate: new Date().toISOString(),
      };

      await printKitchenSlip({
        orderResponse,
        orderItems,
      });

      await printReceiptCopies({
        orderResponse,
        orderItems,
        payload,
      });

      setCart([]);
      setDiscount(0);
      setSelectedWaiterId("");
      setSelectedOrderTypeId("1");

      return true;
    } catch (error) {
      console.error(error);
      showMessage({
        type: "error",
        title: "Failed to Save Order",
        message: "An error occurred while saving the order.",
      });
      return false;
    }
  };

  const selectCategory = async (category) => {
    setSelectedCategory(category);
    setShowCategoryDialog(false);

    try {
      setLoadingProducts(true);

      const data = await getProductsByCategory({
        CompanyLocationID: user?.CompanyLocationID || 1,
        ProductCategoryID: category.ProductCategoryID,
        ProductName: "",
      });

      setProducts(data || []);
    } catch (error) {
      console.error(error);
      showMessage({
        type: "error",
        title: "Failed to Load Products",
        message:
          "The products could not be loaded. Please check the connection and try again.",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.ProductID === product.ProductID &&
          item.PackageID === product.PackageID,
      );

      if (existing) {
        return prev.map((item) =>
          item.ProductID === product.ProductID &&
          item.PackageID === product.PackageID
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  const increaseQty = (productId, packageId) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ProductID === productId && item.PackageID === packageId
          ? { ...item, qty: item.qty + 1 }
          : item,
      ),
    );
  };

  const decreaseQty = (productId, packageId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.ProductID === productId && item.PackageID === packageId
            ? { ...item, qty: item.qty - 1 }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const removeItem = (productId, packageId) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.ProductID === productId && item.PackageID === packageId),
      ),
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.SellingPriceWithTAX || 0) * item.qty,
    0,
  );

  const net = total - Number(discount || 0);

  return (
    <div className="order-page no-category-list">
      <section className="product-panel">
        <div className="product-header">
          <div className="product-heading">
            <span className="product-heading-label">Point of Sale</span>

            <h2>
              {selectedCategory
                ? selectedCategory.ProductCategoryName
                : "Select a product category"}
            </h2>

            <p>
              {selectedCategory
                ? `${products.length} product${products.length === 1 ? "" : "s"} available`
                : "Choose a category to start adding items"}
            </p>
          </div>

          <button
            type="button"
            className="select-category-btn"
            onClick={() => setShowCategoryDialog(true)}
          >
            <span>▦</span>
            Select Category
          </button>
        </div>

        {loadingProducts ? (
          <div className="panel-loading">Loading products...</div>
        ) : (
          <div className="product-grid">
            {products.length === 0 ? (
              <div className="empty-products">
                Select a category to show products
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={`${product.ProductID}-${product.PackageID}`}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-image">🍽️</div>
                  <strong>{product.ProductName}</strong>
                  <span>
                    GHS {Number(product.SellingPriceWithTAX || 0).toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <aside className="cart-panel">
        <div className="cart-top-selectors">
          <div className="order-selector">
            <label htmlFor="order-type">Order Type</label>

            <div className="select-wrapper">
              <span className="select-icon">▣</span>

              <select
                id="order-type"
                value={selectedOrderTypeId}
                onChange={(event) => setSelectedOrderTypeId(event.target.value)}
              >
                <option value="">Select order type</option>

                {orderTypes.map((type) => (
                  <option key={type.OrderTypeID} value={type.OrderTypeID}>
                    {type.OrderTypeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="order-selector">
            <label htmlFor="waiter">
              Waiter <span className="optional-label">Optional</span>
            </label>

            <div className="select-wrapper">
              <span className="select-icon">♟</span>

              <select
                id="waiter"
                value={selectedWaiterId}
                onChange={(event) => setSelectedWaiterId(event.target.value)}
              >
                <option value="">No waiter selected</option>

                {waiters.map((waiter) => (
                  <option key={waiter.UserID} value={waiter.UserID}>
                    {waiter.FullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="cart-title-row">
          <div>
            <span className="cart-title-label">Checkout</span>
            <h3>Current Order</h3>
          </div>

          <div className="cart-count">
            {cart.reduce((sum, item) => sum + Number(item.qty || 0), 0)}
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">No items added</div>
          ) : (
            cart.map((item) => (
              <div
                className="cart-item"
                key={`${item.ProductID}-${item.PackageID}`}
              >
                <div className="cart-item-info">
                  <div className="cart-item-header">
                    <strong>{item.ProductName}</strong>

                    <span className="cart-item-price">
                      GHS {Number(item.SellingPriceWithTAX || 0).toFixed(2)}
                    </span>
                  </div>

                  {item.ProductOption && (
                    <small className="cart-option-note">
                      📝 {item.ProductOption}
                    </small>
                  )}
                </div>

                <div className="cart-actions">
                  <button
                    onClick={() => decreaseQty(item.ProductID, item.PackageID)}
                  >
                    -
                  </button>
                  <b>{item.qty}</b>
                  <button
                    onClick={() => increaseQty(item.ProductID, item.PackageID)}
                  >
                    +
                  </button>
                  <button
                    className="option"
                    onClick={() => setOptionItem(item)}
                  >
                    ⋯
                  </button>
                  <button
                    className="remove"
                    onClick={() => removeItem(item.ProductID, item.PackageID)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary compact-summary">
          <div className="summary-line">
            <div>
              <span>Total</span>
              <strong>GHS {total.toFixed(2)}</strong>
            </div>

            <div>
              <span>Discount</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div>
              <span>Net</span>
              <strong>GHS {net.toFixed(2)}</strong>
            </div>
          </div>

          <div className="order-footer-actions">
            <button
              type="button"
              className="cancel-order-button"
              disabled={cart.length === 0}
              onClick={handleCancelOrder}
            >
              <span className="button-icon">✕</span>
              Cancel
            </button>

            <button
              type="button"
              className="pay-button"
              disabled={cart.length === 0}
              onClick={() => setShowPaymentDialog(true)}
            >
              <span className="button-icon">✓</span>
              Pay
            </button>
          </div>
        </div>
      </aside>

      {showCategoryDialog && (
        <div className="dialog-backdrop">
          <div className="category-dialog">
            <div className="dialog-header">
              <h2>Select Category</h2>
              <p className="dialog-subtitle">
                Tap a category to display its products
              </p>
              <button onClick={() => setShowCategoryDialog(false)}>×</button>
            </div>

            <div className="category-dialog-grid">
              {categories.map((cat) => (
                <button
                  key={cat.ProductCategoryID}
                  onClick={() => selectCategory(cat)}
                  className={
                    selectedCategory?.ProductCategoryID ===
                    cat.ProductCategoryID
                      ? "active"
                      : ""
                  }
                >
                  {cat.ProductCategoryName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPaymentDialog && (
        <PaymentDialog
          netTotal={net}
          onCancel={() => setShowPaymentDialog(false)}
          onConfirm={async (paymentInfo) => {
            const succeeded = await handlePay(paymentInfo);

            if (succeeded) {
              setShowPaymentDialog(false);
            }
          }}
        />
      )}

      {optionItem && (
        <ProductOptionDialog
          item={optionItem}
          onCancel={() => setOptionItem(null)}
          onSave={saveProductOption}
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

          if (callback) {
            callback();
          }
        }}
      />
    </div>
  );
}

export default OrderScreen;
