import { useEffect, useState } from "react";
import {
  getCustomerProfile,
  updateCustomerProfile,
  getCitizenships,
  getEmploymentTypes,
} from "../../api/backend";
import "./ProfilePage.css";

export default function ProfilePage({ customerId }) {
  const [profile,        setProfile]        = useState(null);
  const [originalProfile,setOriginalProfile] = useState(null);
  const [citizenships,   setCitizenships]   = useState([]);
  const [employmentTypes,setEmploymentTypes] = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, c, e] = await Promise.all([
        getCustomerProfile(customerId),
        getCitizenships(),
        getEmploymentTypes(),
      ]);
      setProfile(p);
      setOriginalProfile(JSON.parse(JSON.stringify(p)));
      setCitizenships(Array.isArray(c) ? c : []);
      setEmploymentTypes(Array.isArray(e) ? e : []);
    } catch {
      setError("Не вдалося завантажити дані профілю");
    }
  };

  const set = (field, value) => {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const hasChanges = profile && originalProfile &&
    JSON.stringify(profile) !== JSON.stringify(originalProfile);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateCustomerProfile(customerId, profile);
      setOriginalProfile(JSON.parse(JSON.stringify(profile)));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Помилка збереження. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="profile-loading">Завантаження...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">Профіль</h1>
        <span className="profile-login">@{profile.login}</span>
      </div>

      {/* ── Секція 1: Особисті дані ──────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="section-title">Особисті дані</h2>
        <div className="profile-fields">

          <div className="field-row">
            <label className="field-label">Повне ім'я</label>
            <input
              className="field-input"
              type="text"
              placeholder="Прізвище Ім'я По-батькові"
              value={profile.full_name || ""}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Дата народження</label>
            <input
              className="field-input"
              type="date"
              value={profile.birth_date ? profile.birth_date.slice(0, 10) : ""}
              onChange={(e) => set("birth_date", e.target.value)}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Громадянство</label>
            <select
              className="field-input"
              value={profile.citizenship || ""}
              onChange={(e) => set("citizenship", e.target.value)}
            >
              <option value="">Оберіть громадянство</option>
              {citizenships.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ── Секція 2: Фінансова інформація ───────────────────────────── */}
      <div className="profile-section">
        <h2 className="section-title">Фінансова інформація</h2>
        <div className="profile-fields">

          <div className="field-row">
            <label className="field-label">
              Щомісячний дохід
              <span className="field-unit">грн</span>
            </label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0"
              value={profile.monthly_income || ""}
              onChange={(e) => set("monthly_income", e.target.value)}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Тип зайнятості</label>
            <select
              className="field-input"
              value={profile.employment_type_id || ""}
              onChange={(e) => set("employment_type_id", e.target.value)}
            >
              <option value="">Оберіть тип</option>
              {employmentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label className="field-label">
              Стаж роботи
              <span className="field-unit">місяців</span>
            </label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0"
              value={profile.employment_term_months || ""}
              onChange={(e) => set("employment_term_months", e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* ── Футер з кнопкою і повідомленнями ─────────────────────────── */}
      <div className="profile-footer">
        {saved  && <span className="msg-success">✓ Дані збережено</span>}
        {error  && <span className="msg-error">{error}</span>}
        <button
          className="save-btn"
          onClick={save}
          disabled={!hasChanges || saving}
        >
          {saving ? "Збереження…" : "Зберегти зміни"}
        </button>
      </div>
    </div>
  );
}
