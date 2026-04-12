import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../../api/backend";
import "./AdminHome.css";

export default function BkiSettingsPage() {
  const [items,  setItems]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    getSettings("bki").then((d) => setItems(d.bki || []));
  }, []);

  const change = (key, value) =>
    setItems(items.map((i) => (i.key === key ? { ...i, value } : i)));

  const get     = (key)       => items.find((i) => i.key === key)?.value ?? "";
  const getBool = (key)       => get(key) === "true";
  const setBool = (key, bool) => change(key, bool ? "true" : "false");

  const save = async () => {
    setSaving(true); setSaved(false);
    await saveSettings(items.map(({ key, value }) => ({ key, value })));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-wrapper">
      <h2 className="settings-title">Налаштування БКІ</h2>
      <p className="settings-subtitle">
        Параметри використання даних Бюро кредитних історій при оцінці заявок
      </p>

      <div className="settings-card">

        <div className="setting-row">
          <div className="setting-checkbox-row">
            <input
              type="checkbox"
              checked={getBool("bki.enabled")}
              onChange={(e) => setBool("bki.enabled", e.target.checked)}
            />
            <label className="setting-label" style={{ marginBottom: 0 }}>
              БКІ перевірка активна
            </label>
          </div>
          <span className="setting-desc" style={{ marginTop: 4 }}>
            Якщо вимкнено — дані БКІ не враховуються при скорингу та авто-відмові
          </span>
        </div>

        <div className="settings-divider" />

        <div className="setting-row">
          <label className="setting-label">Авто-відмова: максимальна к-ть прострочених кредитів</label>
          <span className="setting-desc">
            Якщо кількість прострочених кредитів у БКІ ≥ N — заявка автоматично відхиляється.
            0 — вимкнено.
          </span>
          <input
            className="setting-input"
            type="number" step="1" min="0" max="100"
            value={get("bki.auto_reject_overdue_count")}
            onChange={(e) => change("bki.auto_reject_overdue_count", e.target.value)}
          />
        </div>

        <div className="settings-divider" />

        <div className="setting-row">
          <label className="setting-label">Авто-відмова: максимальна прострочка (днів)</label>
          <span className="setting-desc">
            Якщо максимальна прострочка в БКІ ≥ N днів — заявка автоматично відхиляється.
            0 — вимкнено.
          </span>
          <input
            className="setting-input"
            type="number" step="1" min="0" max="3650"
            value={get("bki.auto_reject_max_days")}
            onChange={(e) => change("bki.auto_reject_max_days", e.target.value)}
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
