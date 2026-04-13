import { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from "../api/backend";
import { useAgencyName } from "../hooks/useAgencyName";
import "./Login.css";

export default function Login({ setLogin }) {
  const agencyName              = useAgencyName();
  const [login, setLoginInput]  = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleAuthResult = (data) => {
    localStorage.setItem("login", data.login);
    // Manager
    if (data.role === "manager" || data.manager_id) {
      if (data.manager_id) localStorage.setItem("manager_id", data.manager_id);
      setLogin(data.login, { must_change_password: !!data.must_change_password });
      return;
    }
    // Admin
    if (data.login === "admin") {
      setLogin("admin");
      return;
    }
    // Borrower
    if (data.customer_id) {
      localStorage.setItem("customer_id", String(data.customer_id));
      setLogin(data.login);
      return;
    }
    setError("Помилка: не вдалося визначити роль");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(login.trim().toLowerCase(), password);
      handleAuthResult(data);
    } catch (err) {
      setError(err.message || "Помилка входу");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      handleAuthResult(data);
    } catch (err) {
      setError(err.message || "Помилка Google входу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-brand">
          <span className="login-brand-icon">🏦</span>
          <span className="login-brand-name">{agencyName}</span>
        </div>
        <h2>Вхід до системи</h2>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Помилка Google Sign-In")}
            width="100%"
            text="signin_with"
            shape="rectangular"
            theme="outline"
            locale="uk"
          />
        </div>

        <div className="login-divider">
          <span>або через логін і пароль</span>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>Логін</label>
          <input
            type="text"
            placeholder="Введіть логін"
            value={login}
            onChange={(e) => setLoginInput(e.target.value)}
            required
          />

          <label>Пароль</label>
          <input
            type="password"
            placeholder="Введіть пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Вхід…" : "Увійти"}
          </button>
        </form>

        <p className="login-register-link">
          Немає акаунту? <Link to="/register">Зареєструватись</Link>
        </p>
      </div>
    </div>
  );
}
