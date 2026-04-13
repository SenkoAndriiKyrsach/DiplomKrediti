import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { registerUser, loginWithGoogle } from "../api/backend";
import { useAgencyName } from "../hooks/useAgencyName";
import "./Login.css";

export default function Register({ setLogin }) {
  const agencyName              = useAgencyName();
  const navigate                = useNavigate();
  const [form, setForm]         = useState({ login: "", password: "", confirm: "", full_name: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleGoogleSuccess = async ({ credential }) => {
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      localStorage.setItem("login", data.login);
      if (data.customer_id) localStorage.setItem("customer_id", String(data.customer_id));
      setLogin?.(data.login);
      navigate("/borrower");
    } catch (err) {
      setError(err.message || "Помилка Google Sign-In");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Паролі не збігаються"); return; }
    if (form.password.length < 4)       { setError("Пароль мінімум 4 символи"); return; }
    if (!form.full_name.trim())          { setError("Вкажіть ПІБ"); return; }

    setLoading(true);
    try {
      await registerUser(form.login.trim().toLowerCase(), form.password, form.full_name.trim());
      alert("Реєстрація успішна! Тепер увійдіть.");
      navigate("/");
    } catch (err) {
      setError(err.message || "Помилка реєстрації");
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
        <h2>Реєстрація</h2>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Помилка Google Sign-In")}
            width="100%"
            text="signup_with"
            shape="rectangular"
            theme="outline"
            locale="uk"
          />
        </div>

        <div className="login-divider">
          <span>або заповніть форму</span>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>ПІБ</label>
          <input
            type="text"
            placeholder="Іваненко Іван Іванович"
            value={form.full_name}
            onChange={set("full_name")}
            required
          />

          <label>Логін</label>
          <input
            type="text"
            placeholder="Мінімум 3 символи"
            value={form.login}
            onChange={set("login")}
            required
          />

          <label>Пароль</label>
          <input
            type="password"
            placeholder="Мінімум 4 символи"
            value={form.password}
            onChange={set("password")}
            required
          />

          <label>Підтвердження пароля</label>
          <input
            type="password"
            placeholder="Повторіть пароль"
            value={form.confirm}
            onChange={set("confirm")}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Реєстрація…" : "Зареєструватись"}
          </button>
        </form>

        <p className="login-register-link">
          Вже є акаунт? <Link to="/">Увійти</Link>
        </p>
      </div>
    </div>
  );
}
