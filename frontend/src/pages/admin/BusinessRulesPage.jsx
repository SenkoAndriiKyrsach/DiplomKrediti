import { useEffect, useState } from "react";
import { getSettings, saveSettings, getEmploymentTypes } from "../../api/backend";
import "./AdminHome.css";

export default function BusinessRulesPage() {
  const [items,       setItems]       = useState([]);
  const [empTypes,    setEmpTypes]    = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    getSettings("rules").then((d) => setItems(d.rules || []));
    getEmploymentTypes().then((d) => setEmpTypes(d.employment_types || []));
  }, []);

  const change = (key, value) =>
    setItems(items.map((i) => (i.key === key ? { ...i, value } : i)));

  const get = (key) => items.find((i) => i.key === key)?.value ?? "";

  const save = async () => {
    setSaving(true); setSaved(false);
    await saveSettings(items.map(({ key, value }) => ({ key, value })));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-wrapper">
      <h2 className="settings-title">Бізнес-правила</h2>
      <p className="settings-subtitle">
        Умови, які автоматично перевіряються при подачі заявки.
        Порушення будь-якого правила → заявка не проходить перевірку.
      </p>

      <div className="settings-card">

        <div className="setting-row">
          <label className="setting-label">Мінімальний місячний дохід (грн)</label>
          <span className="setting-desc">
            Дохід клієнта повинен бути не менше цього значення
          </span>
          <input
            className="setting-input"
            type="number" step="500" min="0"
            value={get("rules.min_income")}
            onChange={(e) => change("rules.min_income", e.target.value)}
          />
        </div>

        <div className="settings-divider" />

        <div className="setting-row">
          <label className="setting-label">Максимальний DTI (частка)</label>
          <span className="setting-desc">
            Відношення щомісячного платежу до доходу. 0.4 = 40%.
            Якщо (сума / термін) / дохід &gt; DTI_max — правило не виконано.
          </span>
          <input
            className="setting-input"
            type="number" step="0.01" min="0" max="1"
            value={get("rules.dti_max")}
            onChange={(e) => change("rules.dti_max", e.target.value)}
          />
        </div>

        <div className="settings-divider" />

        <div className="setting-row">
          <label className="setting-label">Мінімальний стаж (місяців)</label>
          <span className="setting-desc">
            Клієнт повинен працювати на поточному місці не менше цього терміну
          </span>
          <input
            className="setting-input"
            type="number" step="1" min="0" max="120"
            value={get("rules.min_employment_months")}
            onChange={(e) => change("rules.min_employment_months", e.target.value)}
          />
        </div>

        <div className="settings-divider" />

        <div className="setting-row">
          <label className="setting-label">Заборонений тип зайнятості</label>
          <span className="setting-desc">
            Клієнти з цим типом зайнятості автоматично не проходять перевірку
          </span>
          <select
            className="setting-input"
            value={get("rules.forbidden_employment_type")}
            onChange={(e) => change("rules.forbidden_employment_type", e.target.value)}
          >
            {empTypes.map((t) => (
              <option key={t.employment_type_id} value={t.employment_type_id}>
                {t.employment_type_name} (ID: {t.employment_type_id})
              </option>
            ))}
          </select>
        </div>

        <div className="settings-divider" />
        {saved && <span className="settings-saved-msg">✓ Збережено</span>}
        <button className="settings-save-btn" onClick={save} disabled={saving}>
          {saving ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </div>
  );
}
