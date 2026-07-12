import { useState } from "react";
import NumericKeypad from "../components/NumericKeypad";
import AppDialog from "../components/AppDialog";
import { checkUserLogin, changeUserPassword } from "../api/userApi";
import "../styles/ChangePassword.css";

function ChangePassword({ user, onCancel, onLogout }) {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeField, setActiveField] = useState("currentPassword");
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: null,
  });

  const fields = [
    {
      key: "currentPassword",
      label: "Current Password",
      placeholder: "Enter current password",
      icon: "🔐",
    },
    {
      key: "newPassword",
      label: "New Password",
      placeholder: "Enter new password",
      icon: "🔑",
    },
    {
      key: "confirmPassword",
      label: "Confirm New Password",
      placeholder: "Re-enter new password",
      icon: "✓",
    },
  ];

  const showMessage = ({
    type = "info",
    title,
    message,
    confirmText = "OK",
    onConfirm = null,
  }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
      confirmText,
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
      onConfirm: null,
    }));
  };

  const logoutAfterPasswordChange = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("companyInfo");

    if (typeof onLogout === "function") {
      onLogout();
    }
  };

  const updateActivePassword = (value) => {
    setPasswords((previous) => ({
      ...previous,
      [activeField]: value,
    }));
  };

  const appendKey = (key) => {
    const currentValue = passwords[activeField] || "";

    updateActivePassword(`${currentValue}${key}`);
  };

  const backspace = () => {
    const currentValue = passwords[activeField] || "";

    updateActivePassword(currentValue.slice(0, -1));
  };

  const clearActiveField = () => {
    updateActivePassword("");
  };

  const clearForm = () => {
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setActiveField("currentPassword");
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((previous) => ({
      ...previous,
      [fieldName]: !previous[fieldName],
    }));
  };

  const validateForm = () => {
    if (!passwords.currentPassword) {
      showMessage({
        type: "warning",
        title: "Current Password Required",
        message: "Please enter your current password.",
      });

      setActiveField("currentPassword");
      return false;
    }

    if (!passwords.newPassword) {
      showMessage({
        type: "warning",
        title: "New Password Required",
        message: "Please enter your new password.",
      });

      setActiveField("newPassword");
      return false;
    }

    if (passwords.newPassword.length < 4) {
      showMessage({
        type: "warning",
        title: "Password Too Short",
        message: "The new password must contain at least four characters.",
      });

      setActiveField("newPassword");
      return false;
    }

    if (passwords.newPassword === passwords.currentPassword) {
      showMessage({
        type: "warning",
        title: "Choose a Different Password",
        message:
          "The new password must be different from the current password.",
      });

      setActiveField("newPassword");
      return false;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage({
        type: "error",
        title: "Passwords Do Not Match",
        message: "The new password and confirmation password do not match.",
      });

      setActiveField("confirmPassword");
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm() || saving) {
      return;
    }

    try {
      setSaving(true);

      const username = user?.UserName?.trim() || user?.username?.trim() || "";

      if (!username) {
        showMessage({
          type: "error",
          title: "User Not Identified",
          message:
            "The logged-in username could not be identified. Please log out and try again.",
        });

        return;
      }

      const loginResult = await checkUserLogin(
        username,
        passwords.currentPassword,
      );

      const currentPasswordIsValid =
        Number(loginResult?.errorNumber) === 0 &&
        Number(loginResult?.status) === 200 &&
        Number(loginResult?.UserID) === Number(user?.UserID);

      if (!currentPasswordIsValid) {
        showMessage({
          type: "error",
          title: "Current Password Incorrect",
          message:
            loginResult?.errorMessage ||
            "The current password you entered is incorrect.",
        });

        setActiveField("currentPassword");
        return;
      }

      const updateResult = await changeUserPassword({
        userID: Number(user.UserID),
        username: user.UserName,
        password: passwords.newPassword,
      });

      const successful =
        updateResult?.Success === 1 ||
        updateResult?.success === 1 ||
        updateResult?.ErrorNumber === 0 ||
        updateResult?.errorNumber === 0;

      if (!successful) {
        showMessage({
          type: "error",
          title: "Password Not Updated",
          message:
            updateResult?.Message ||
            updateResult?.message ||
            updateResult?.ErrorMessage ||
            updateResult?.errorMessage ||
            "The new password could not be saved.",
        });

        return;
      }

      clearForm();

      showMessage({
        type: "success",
        title: "Password Updated",
        message:
          "Your password was changed successfully. You will now be logged out so you can sign in with the new password.",
        confirmText: "Log In Again",
        onConfirm: logoutAfterPasswordChange,
      });
    } catch (error) {
      console.error("Password change failed:", error);

      showMessage({
        type: "error",
        title: "Password Update Failed",
        message:
          error?.response?.data?.Message ||
          error?.response?.data?.message ||
          error?.response?.data?.ErrorMessage ||
          error?.response?.data?.errorMessage ||
          error?.message ||
          "Your password could not be changed.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="change-password-page">
      <section className="change-password-card">
        <header className="change-password-header">
          <div className="change-password-header-icon">🔐</div>

          <div>
            <span className="change-password-eyebrow">Account Security</span>

            <h1>Change Password</h1>

            <p>Create a new password for your Perfect Touch POS account.</p>
          </div>
        </header>

        <div className="change-password-content">
          <section className="password-form-section">
            <div className="password-user-card">
              <div className="password-user-avatar">
                {user?.FullName?.trim()?.charAt(0)?.toUpperCase() || "?"}
              </div>

              <div>
                <strong>{user?.FullName || user?.UserName || "User"}</strong>

                <span>
                  {user?.RoleName ||
                    (Number(user?.RoleID) === 1 ? "Administrator" : "Cashier")}
                </span>
              </div>

              <div className="password-user-branch">
                {user?.CompanyLocationName || ""}
              </div>
            </div>

            <div className="password-fields">
              {fields.map((field) => {
                const isActive = activeField === field.key;

                return (
                  <div
                    key={field.key}
                    className={`change-password-field ${
                      isActive ? "active" : ""
                    }`}
                    onClick={() => setActiveField(field.key)}
                  >
                    <label htmlFor={field.key}>
                      <span>{field.icon}</span>
                      {field.label}
                    </label>

                    <div className="change-password-input-wrapper">
                      <input
                        id={field.key}
                        type={showPasswords[field.key] ? "text" : "password"}
                        value={passwords[field.key]}
                        readOnly
                        placeholder={field.placeholder}
                        onFocus={() => setActiveField(field.key)}
                      />

                      <button
                        type="button"
                        className="password-visibility-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePasswordVisibility(field.key);
                        }}
                        aria-label={
                          showPasswords[field.key]
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPasswords[field.key] ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="password-requirements">
              <strong>Password guidance</strong>
              <span>Use at least four characters.</span>
              <span>Choose a password different from your current one.</span>
            </div>
          </section>

          <section className="password-keyboard-section">
            <div className="password-keyboard-title">
              <span>⌨</span>

              <div>
                <strong>Touch Keyboard</strong>
                <small>
                  Entering:{" "}
                  {fields.find((field) => field.key === activeField)?.label}
                </small>
              </div>
            </div>

            <NumericKeypad
              onKeyPress={appendKey}
              onBackspace={backspace}
              onClear={clearActiveField}
            />
          </section>
        </div>

        <footer className="change-password-footer">
          <button
            type="button"
            className="change-password-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            ← Cancel
          </button>

          <button
            type="button"
            className="change-password-clear"
            onClick={clearForm}
            disabled={saving}
          >
            Clear Fields
          </button>

          <button
            type="button"
            className="change-password-submit"
            onClick={handleChangePassword}
            disabled={saving}
          >
            {saving ? "Updating..." : "✓ Update Password"}
          </button>
        </footer>
      </section>

      <AppDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        showCancel={false}
        onCancel={closeDialog}
        onConfirm={() => {
          const callback = dialog.onConfirm;

          closeDialog();

          if (typeof callback === "function") {
            callback();
          }
        }}
      />
    </div>
  );
}

export default ChangePassword;
