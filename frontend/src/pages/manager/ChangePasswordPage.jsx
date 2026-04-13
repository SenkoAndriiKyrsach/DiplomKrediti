import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeManagerPassword } from "../../api/backend";
import "./ChangePasswordPage.css";

export default function ChangePasswordPage({ setLogin }) {
  const navigate   = useNavigate();
  const login      = localStorage.getItem("login") || "";
  const [oldPw, setOldPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPw !== confirm) { setError("Паролі не збігаються"); return; }
    if (newPw.length < 4)   { setError("Новий пароль мінімум 4 символи"); return; }
    if (newPw === "1234")   { setError("Оберіть пароль відмінний від тимчасового"); return; }

    setSaving(true);
    try {
      await changeManagerPassword(login, oldPw, newPw);
      // Очистити must_change_password флаг локально
      localStorage.removeItem("must_change_password");
      // Викликаємо setLogin щоб App.jsx перерендерився і побачив оновлений localStorage
      if (setLogin) setLogin(login);
      else navigate("/manager");
    } catch (err) {
      setError(err.message || "Помилка зміни пароля");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="change-pw-wrapper">
      <div className="change-pw-box">
        <div className="change-pw-icon">🔐</div>
        <h2 className="change-pw-title">Обов'язкова зміна пароля</h2>
        <p className="change-pw-subtitle">
          Ваш акаунт використовує тимчасовий пароль.<br />
          Будь ласка, встановіть новий пароль для продовження.
        </p>

        <form onSubmit={submit} className="change-pw-form">
          <label>Поточний пароль</label>
          <input type="password" value={oldPw}
            onChange={(e) => setOldPw(e.target.value)} required placeholder="1234" />

          <label>Новий пароль</label>
          <input type="password" value={newPw}
            onChange={(e) => setNewPw(e.target.value)} required placeholder="Мінімум 4 символи" />

          <label>Підтвердження нового пароля</label>
          <input type="password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required placeholder="Повторіть пароль" />

          {error && <div className="change-pw-error">{error}</div>}

          <button type="submit" className="change-pw-btn" disabled={saving}>
            {saving ? "Збереження…" : "Змінити пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}
