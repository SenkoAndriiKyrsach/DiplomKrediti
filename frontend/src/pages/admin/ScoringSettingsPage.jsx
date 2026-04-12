import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../../api/backend";
import "./AdminHome.css";

const FIELDS = [
  {
    key: "scoring.base_score",
    label: "Базовий скоринговий бал",
    desc: "Початкове значення балу до застосування знижок",
    step: 1, min: 0, max: 1000,
  },
  {
    key: "scoring.income_threshold",
    label: "Поріг доходу (грн)",
    desc: "Якщо дохід клієнта нижче цього значення — застосовується штраф",
    step: 500, min: 0, max: 100000,
  },
  {
    key: "scoring.income_penalty",
    label: "Штраф за низький дохід (балів)",
    desc: "Знижка до балу при доході нижче порогу",
    step: 5, min: 0, max: 300,
  },
  {
    key: "scoring.overdue_penalty_per_loan",
    label: "Штраф за прострочений кредит (балів/шт)",
    desc: "Знижка за кожен прострочений кредит у даних БКІ",
    step: 5, min: 0, max: 200,
  },
  {
    key: "scoring.max_delay_threshold",
    label: "Поріг великої прострочки (днів)",
    desc: "Прострочка вище цього значення додатково знижує бал",
    step: 1, min: 0, max: 365,
  },
  {
    key: "scoring.max_delay_penalty",
    label: "Штраф за велику прострочку (балів)",
    desc: "Знижка при прострочці вище порогу",
    step: 5, min: 0, max: 300,
  },
  {
    key: "scoring.risk_medium_threshold",
    label: "Поріг середнього ризику (бал)",
    desc: "Бал нижче якого рівень ризику = середній",
    step: 5, min: 0, max: 900,
  },
  {
    key: "scoring.risk_high_threshold",
    label: "Поріг високого ризику (бал)",
    desc: "Бал нижче якого рівень ризику = високий → авто-відмова",
    step: 5, min: 0, max: 900,
  },
];

const WEIGHT_FIELDS = [
  {
    key: "scoring.weight_income",
    label: "Вага: Дохід",
    desc: "Множник штрафу за низький дохід. 1.0 = стандарт, 2.0 = подвійний вплив",
    step: 0.1, min: 0, max: 5,
  },
  {
    key: "scoring.weight_bki",
    label: "Вага: Кредитна історія (БКІ)",
    desc: "Множник штрафів за прострочки у даних БКІ. 1.0 = стандарт",
    step: 0.1, min: 0, max: 5,
  },
  {
    key: "scoring.weight_employment",
    label: "Вага: Зайнятість / стаж",
    desc: "Резервний множник для майбутніх штрафів за стаж. 1.0 = стандарт",
    step: 0.1, min: 0, max: 5,
  },
];

export default function ScoringSettingsPage() {
  const [items, setItems]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    getSettings("scoring").then((d) => setItems(d.scoring || []));
  }, []);

  const allFields = [...FIELDS, ...WEIGHT_FIELDS];

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
      <h2 className="settings-title">Параметри скорингу</h2>
      <p className="settings-subtitle">
        Налаштування алгоритму розрахунку скорингового балу та рівнів ризику
      </p>

      <div className="settings-card">
        <div className="settings-section-title">Параметри балів та порогів</div>
        {FIELDS.map((f, i) => (
          <div key={f.key}>
            <div className="setting-row">
              <label className="setting-label">{f.label}</label>
              <span className="setting-desc">{f.desc}</span>
              <input
                className="setting-input"
                type="number"
                step={f.step} min={f.min} max={f.max}
                value={get(f.key)}
                onChange={(e) => change(f.key, e.target.value)}
              />
            </div>
            {i < FIELDS.length - 1 && <div className="settings-divider" style={{ marginTop: 16 }} />}
          </div>
        ))}

        <div className="settings-divider" />
        <div className="settings-section-title">Ваги характеристик</div>
        <p className="settings-subtitle" style={{ margin: "0 0 8px" }}>
          Множники для кожної групи факторів. Значення 1.0 — стандартна вага, 2.0 — подвійна, 0.5 — половинна.
        </p>
        {WEIGHT_FIELDS.map((f, i) => (
          <div key={f.key}>
            <div className="setting-row">
              <label className="setting-label">{f.label}</label>
              <span className="setting-desc">{f.desc}</span>
              <input
                className="setting-input"
                type="number"
                step={f.step} min={f.min} max={f.max}
                value={get(f.key)}
                onChange={(e) => change(f.key, e.target.value)}
              />
            </div>
            {i < WEIGHT_FIELDS.length - 1 && <div className="settings-divider" style={{ marginTop: 16 }} />}
          </div>
        ))}

        <div className="settings-divider" />
        {saved && <span className="settings-saved-msg">✓ Збережено</span>}
        <button className="settings-save-btn" onClick={save} disabled={saving}>
          {saving ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </div>
  );
}
