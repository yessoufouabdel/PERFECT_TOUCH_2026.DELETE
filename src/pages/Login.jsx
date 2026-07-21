import { useEffect, useRef, useState } from "react";
import { getCashiers, checkUserLogin } from "../api/userApi";
import UserTile from "../components/UserTile";
import AppDialog from "../components/AppDialog";
import NumericKeypad from "../components/NumericKeypad";
import logo from "../assets/logo.png";
import "../styles/Login.css";

function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const passwordInputRef = useRef(null);

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
    loadUsers();

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const closeDialog = () => {
    setDialog((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getCashiers();
      setUsers(data.filter((u) => u.IsActive));
    } catch (error) {
      showMessage({
        type: "error",
        title: "Failed to Load Cashiers",
        message:
          "The list of cashiers could not be loaded. Please check the connection and try again.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setPassword("");

    requestAnimationFrame(() => {
      passwordInputRef.current?.focus();
    });
  };

  const handleLogin = async () => {
    if (!selectedUser) {
      showMessage({
        type: "error",
        title: "No User Selected",
        message: "Please select a user to login.",
      });
      return;
    }

    if (!password) {
      showMessage({
        type: "error",
        title: "No Password Entered",
        message: "Please enter your password.",
      });
      return;
    }

    try {
      setLoading(true);

      const loginResult = await checkUserLogin(
        selectedUser.UserName.trim(),
        password,
      );

      if (loginResult?.errorNumber !== 0 || loginResult?.status !== 200) {
        showMessage({
          type: "error",
          title: "Invalid Credentials",
          message: loginResult?.errorMessage || "Invalid username or password",
        });
        return;
      }

      localStorage.setItem("loggedInUser", JSON.stringify(loginResult));
      localStorage.setItem(
        "companyInfo",
        JSON.stringify({
          CompanyName: loginResult.CompanyName,
          CompanyLocationID: loginResult.CompanyLocationID,
          CompanyLocationName: loginResult.CompanyLocationName,
          VATRate: loginResult.VATRate,
          NHILRate: loginResult.NHILRate,
          TLRate: loginResult.TLRate,
          ServiceChargeRate: loginResult.ServiceChargeRate,
          ShowVAT: loginResult.ShowVAT,
          NoOfReceiptToPrint: loginResult.NoOfReceiptToPrint,
          NoOfOrderToPrint: loginResult.NoOfOrderToPrint,
          FirstTextBelowReceipt: loginResult.FirstTextBelowReceipt,
          SecondTextBelowReceipt: loginResult.SecondTextBelowReceipt,
        }),
      );

      onLogin(loginResult);
    } catch (error) {
      console.error(error);
      showMessage({
        type: "error",
        title: "Login Failed",
        message:
          "An error occurred while logging in. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="animated-bg"></div>

      <section className="login-left">
        <div className="top-bar">
          <div className="login-brand">
            <img src={logo} alt="Perfect Touch" />
            <div>
              <h1>Perfect Touch POS</h1>
            </div>
          </div>

          <div className="clock-box">
            <strong>
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
            <span>
              {now.toLocaleDateString([], {
                weekday: "long",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="login-loading">Loading cashiers...</div>
        ) : (
          <div className="user-grid">
            {users.map((user) => (
              <UserTile
                key={user.UserID}
                user={user}
                selected={selectedUser?.UserID === user.UserID}
                onClick={() => handleSelectUser(user)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="login-right">
        <div className="password-panel">
          <div className="selected-user-box">
            <div className="selected-avatar">
              {selectedUser?.FullName?.trim()?.charAt(0)?.toUpperCase() || "?"}
            </div>

            <div>
              <h2>
                {selectedUser ? selectedUser.FullName : "No cashier selected"}
              </h2>
              <p>
                {selectedUser ? selectedUser.RoleName : "Select cashier first"}
              </p>
            </div>
          </div>

          <input
            ref={passwordInputRef}
            className="password-input"
            type="password"
            value={password}
            placeholder="Enter password"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                handleLogin();
              }
            }}
            disabled={loading}
            aria-label="Password"
          />

          <NumericKeypad
            onKeyPress={(key) => setPassword((prev) => prev + key)}
            onBackspace={() => setPassword((prev) => prev.slice(0, -1))}
            onClear={() => setPassword("")}
          />

          <button className="login-button ripple" onClick={handleLogin}>
            Login
          </button>
        </div>
      </section>

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

export default Login;
