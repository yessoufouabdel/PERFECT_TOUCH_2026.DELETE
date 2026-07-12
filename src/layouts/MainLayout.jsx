import { useState } from "react";

import Dashboard from "../pages/Dashboard";
// import OrderScreen from "../pages/OrderScreen";
// import OrderReport from "../pages/OrderReport";
import ChangePassword from "../pages/ChangePassword";
import DeleteOrder from "../pages/DeleteOrder";
import DeletedOrder from "../pages/DeletedOrder";

import logo from "../assets/logo.png";
import "../styles/MainLayout.css";

function MainLayout({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");

  const [dashboardDate, setDashboardDate] = useState(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const [pageParams, setPageParams] = useState({});

  const handleNavigation = (page, params = {}) => {
    setPageParams(params);
    setActivePage(page);
  };

  const renderPage = () => {
    if (activePage === "dashboard") {
      return (
        <Dashboard
          user={user}
          reportDate={dashboardDate}
          onReportDateChange={setDashboardDate}
          onNavigate={handleNavigation}
        />
      );
    }

    // if (activePage === "order") {
    //   return <OrderScreen user={user} />;
    // }

    // if (activePage === "report") {
    //   return (
    //     <OrderReport
    //       user={user}
    //       initialDate={
    //         pageParams?.reportDate || dashboardDate
    //       }
    //     />
    //   );
    // }

    if (activePage === "delete-order") {
      return (
        <DeleteOrder
          user={user}
          initialDate={pageParams?.reportDate || dashboardDate}
        />
      );
    }

    if (activePage === "deleted-order") {
      return (
        <DeletedOrder
          user={user}
          initialDate={pageParams?.reportDate || dashboardDate}
        />
      );
    }

    if (activePage === "password") {
      return (
        <ChangePassword
          user={user}
          onCancel={() => setActivePage("dashboard")}
          onLogout={onLogout}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        reportDate={dashboardDate}
        onReportDateChange={setDashboardDate}
        onNavigate={handleNavigation}
      />
    );
  };

  return (
    <div className="main-layout">
      <header className="main-topbar">
        <div className="topbar-brand">
          <img src={logo} alt="Perfect Touch" />

          <div>
            <strong>Perfect Touch POS</strong>
            <span>{user?.CompanyLocationName || "Restaurant"}</span>
          </div>
        </div>

        <nav className="topbar-menu">
          <button
            type="button"
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => handleNavigation("dashboard")}
          >
            📊 Dashboard
          </button>

          {/* <button
            type="button"
            className={activePage === "order" ? "active" : ""}
            onClick={() => setActivePage("order")}
          >
            🍽 Order
          </button> */}

          {/* <button
            type="button"
            className={activePage === "report" ? "active" : ""}
            onClick={() => setActivePage("report")}
          >
            🧾 Order Report
          </button> */}

          {Number(user?.RoleID) === 1 && (
            <>
              <button
                type="button"
                className={activePage === "delete-order" ? "active" : ""}
                onClick={() => setActivePage("delete-order")}
              >
                🗑 Delete Order
              </button>

              <button
                type="button"
                className={activePage === "deleted-order" ? "active" : ""}
                onClick={() => setActivePage("deleted-order")}
              >
                🗂 Deleted Orders
              </button>
            </>
          )}

          <button
            type="button"
            className={activePage === "password" ? "active" : ""}
            onClick={() => setActivePage("password")}
          >
            🔐 Change Password
          </button>

          <button type="button" className="logout-btn" onClick={onLogout}>
            🚪 Log Out
          </button>
        </nav>

        <div className="topbar-user">
          <div className="user-circle">
            {user?.FullName?.trim()?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <strong>{user?.FullName || user?.UserName}</strong>

            <span>
              {Number(user?.RoleID) === 1 ? "Administrator" : "Cashier"}
            </span>
          </div>
        </div>
      </header>

      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default MainLayout;
