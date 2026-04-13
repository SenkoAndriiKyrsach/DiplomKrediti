import { useEffect, useState } from "react";
import { getManagers, createManager, setManagerActive } from "../../api/backend";
import "./AdminHome.css";
import "./ManagersPage.css";

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [login,    setLogin]    = useState("");
  const [fullName, setFullName] = useState("");
  const [error,    setError]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [added,    setAdded]    = useState(null);

  const load = () => getManagers().then((d) => setManagers(d.managers || []));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true); setAdded(null);
    try {
      const res = await createManager(login.trim().toLowerCase(), fullName.trim());
      setAdded(res);
      setLogin(""); setFullName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m) => {
    await setManagerActive(m.id, !m.is_active);
    load();
  };

  return (
    <div className="settings-wrapper">
      <h2 className="settings-title">Управління менеджерами</h2>
      <p className="settings-subtitle">
        Новий менеджер отримує пароль <strong>1234</strong> і зобов'язаний змінити його при першому вході
      </p>

      {/* ── Create form ── */}
      <div className="settings-card" style={{ marginBottom: 28 }}>
        <div className="settings-section-title">Додати менеджера</div>
        <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="setting-row">
            <label className="setting-label">Логін</label>
            <input className="setting-input" value={login}
              onChange={(e) => setLogin(e.target.value)} placeholder="мін. 3 символи" required />
          </div>
          <div className="setting-row">
            <label className="setting-label">ПІБ</label>
            <input className="setting-input" value={fullName}
              onChange={(e) => setFullName(e.target.value)} placeholder="Іваненко Іван Іванович" required />
          </div>
          {error && <div className="mgr-error">{error}</div>}
          {added && (
            <div className="mgr-success">
              ✅ Менеджера <strong>{added.manager?.login}</strong> створено.
              Тимчасовий пароль: <strong>1234</strong>
            </div>
          )}
          <button className="settings-save-btn" type="submit" disabled={saving}>
            {saving ? "Збереження…" : "Створити менеджера"}
          </button>
        </form>
      </div>

      {/* ── Managers list ── */}
      <div className="settings-card">
        <div className="settings-section-title">Список менеджерів</div>
        {managers.length === 0 ? (
          <p style={{ color: "#7a90b0" }}>Немає менеджерів</p>
        ) : (
          <table className="mgr-table">
            <thead>
              <tr>
                <th>Логін</th>
                <th>ПІБ</th>
                <th>Статус</th>
                <th>Зміна пароля</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} className={m.is_active ? "" : "mgr-row-inactive"}>
                  <td className="mgr-login">{m.login}</td>
                  <td>{m.full_name || "—"}</td>
                  <td>
                    {m.is_active
                      ? <span className="badge-active">Активний</span>
                      : <span className="badge-inactive">Деактивовано</span>}
                  </td>
                  <td>
                    {m.must_change_password
                      ? <span className="badge-warn">Потрібна зміна</span>
                      : <span className="badge-ok">Змінено</span>}
                  </td>
                  <td>
                    <button
                      className={`mgr-toggle-btn ${m.is_active ? "deactivate" : "activate"}`}
                      onClick={() => toggle(m)}
                    >
                      {m.is_active ? "Деактивувати" : "Активувати"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
