import { useEffect, useState } from "react";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("loggedInUser");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
  };

  return (
    <>
      {user ? (
        <MainLayout user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={setUser} />
      )}
    </>
  );
}

export default App;