import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../../api/backend";
import "./AdminHome.css";

export default function PenaltySettingsPage() {
  const [items, setItems]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    getSettings("penalty").then((d) => setItems(d.penalty || []));
  }, []);

  const change = (key, value) =>
    setItems(items.map((i) => (i.key === key ? { ...i, value } : i)));

  const save = async () => {
    setSaving(true); setSaved(false);
    await saveSettings(items.map(({ key, value }) => ({ key, value })));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const get = (key) => items.find((i) => i.key === key)?.value ?? "";

  return (
    <div className="settings-wrapper">
      <h2 className="settings-title">Налаштування штрафів</h2>
      <p className="settings-subtitle">
        Формула: штраф = сума_платежу × (ставка% ÷ 100) × (днів_прострочки − пільговий_період)
      </p>

      <div className="settings-card">

        <div className="setting-row">
          <label className="setting-label">Ставка штрафу на день (%)</label>
          <span className="setting-desc">
            Відсоток від суми платежу за кожен день прострочки.
            Наприклад: 0.1 = 0.1% на день, 1 = 1% на день.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              className="setting-input"
              style={{ maxWidth: 200 }}
              type="number" step="0.01" min="0" max="10"
              value={get("penalty.daily_rate")}
              onChange={(e) => change("penalty.daily_rate", e.target.value)}
            />
            <span style={{ fontWeight: 700, color: "#0057B8" }}>%</span>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="setting-row">
          <label className="setting-label">Пільговий період (днів)</label>
          <span className="setting-desc">
            Кількість днів після дати платежу до початку нарахування штрафу.
            0 — штраф нараховується з першого дня прострочки.
          </span>
          <input
            className="setting-input"
            style={{ maxWidth: 200 }}
            type="number" step="1" min="0" max="90"
            value={get("penalty.grace_days")}
            onChange={(e) => change("penalty.grace_days", e.target.value)}
          />
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
