import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../../api/backend";
import "./AdminHome.css";

export default function GeneralSettingsPage() {
  const [agencyName, setAgencyName] = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    getSettings("general").then((d) => {
      const row = (d.general || []).find((r) => r.key === "agency.name");
      if (row) setAgencyName(row.value);
    });
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    await saveSettings([{ key: "agency.name", value: agencyName }]);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-wrapper">
      <h2 className="settings-title">Загальні налаштування</h2>
      <p className="settings-subtitle">
        Базова конфігурація кредитної агенції
      </p>

      <div className="settings-card">
        <div className="setting-row">
          <label className="setting-label">Назва кредитної агенції</label>
          <span className="setting-desc">
            Відображається у заголовку всіх панелей системи
          </span>
          <input
            className="setting-input"
            type="text"
            maxLength={100}
            placeholder="Введіть назву агенції"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
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
