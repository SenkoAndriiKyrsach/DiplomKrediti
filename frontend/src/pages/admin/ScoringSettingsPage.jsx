import { useEffect, useState } from "react";
import { getScoringConfig, saveScoringConfig, getSettings, saveSettings } from "../../api/backend";
import "./AdminHome.css";
import "./ScoringSettingsPage.css";

export default function ScoringSettingsPage() {
  const [config,   setConfig]  = useState(null);
  const [passPct,  setPassPct] = useState(80);
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);

  const load = async () => {
    const [cfg, sets] = await Promise.all([
      getScoringConfig(),
      getSettings("scoring"),
    ]);
    setConfig(cfg);
    const row = (sets.scoring || []).find((r) => r.key === "scoring.pass_percentage");
    if (row) setPassPct(Number(row.value));
  };

  useEffect(() => { load(); }, []);

  const setWeight = (criterionId, val) =>
    setConfig((c) => ({
      ...c,
      criteria: c.criteria.map((cr) =>
        cr.id === criterionId ? { ...cr, weight: Number(val) } : cr
      ),
    }));

  const setRangeValue = (criterionId, rangeId, val) =>
    setConfig((c) => ({
      ...c,
      criteria: c.criteria.map((cr) =>
        cr.id !== criterionId ? cr : {
          ...cr,
          ranges: cr.ranges.map((r) =>
            r.id === rangeId ? { ...r, score_value: Number(val) } : r
          ),
        }
      ),
    }));

  // Перерахувати min/max/pass на льоту
  const computed = config ? (() => {
    let maxS = 0, minS = 0;
    config.criteria.forEach((c) => {
      const vals = c.ranges.map((r) => r.score_value);
      maxS += Math.max(...vals) * c.weight;
      minS += Math.min(...vals) * c.weight;
    });
    return {
      min:  minS.toFixed(2),
      max:  maxS.toFixed(2),
      pass: (passPct * maxS / 100).toFixed(2),
    };
  })() : null;

  const save = async () => {
    setSaving(true); setSaved(false);
    const updates = [];
    config.criteria.forEach((c) => {
      updates.push({ type: "criterion", id: c.id, weight: c.weight });
      c.ranges.forEach((r) => updates.push({ type: "range", id: r.id, score_value: r.score_value }));
    });
    await Promise.all([
      saveScoringConfig(updates),
      saveSettings([{ key: "scoring.pass_percentage", value: String(passPct) }]),
    ]);
    await load();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!config) return <div className="settings-wrapper"><p>Завантаження…</p></div>;

  return (
    <div className="settings-wrapper" style={{ maxWidth: 900 }}>
      <h2 className="settings-title">Параметри скорингу</h2>
      <p className="settings-subtitle">
        Бал клієнта = сума (значення_діапазону × вага). Прохідний бал = % від максимуму.
      </p>

      {/* ── Criteria table ── */}
      {config.criteria.map((c) => (
        <div key={c.id} className="criterion-card">
          <div className="criterion-header">
            <span className="criterion-name">{c.name}</span>
            <div className="weight-row">
              <label>Вага:</label>
              <input
                type="number" step="0.05" min="0" max="1"
                className="weight-input"
                value={c.weight}
                onChange={(e) => setWeight(c.id, e.target.value)}
              />
            </div>
          </div>

          <table className="ranges-table">
            <colgroup>
              <col className="col-label" />
              <col className="col-bound" />
              <col className="col-bound" />
              <col className="col-value" />
              <col className="col-contrib" />
            </colgroup>
            <thead>
              <tr>
                <th>Діапазон</th>
                <th className="th-center">Від</th>
                <th className="th-center">До</th>
                <th className="th-center">Значення</th>
                <th className="th-right">Внесок (знач × вага)</th>
              </tr>
            </thead>
            <tbody>
              {c.ranges.map((r) => (
                <tr key={r.id}>
                  <td className="range-label">{r.label}</td>
                  <td className="range-bound">{r.range_min ?? "−∞"}</td>
                  <td className="range-bound">{r.range_max ?? "+∞"}</td>
                  <td className="range-value-cell">
                    <input
                      type="number" step="10" min="0"
                      className="range-value-input"
                      value={r.score_value}
                      onChange={(e) => setRangeValue(c.id, r.id, e.target.value)}
                    />
                  </td>
                  <td className="range-contrib">
                    {(r.score_value * c.weight).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ── Pass % + summary ── */}
      <div className="settings-card scoring-summary-card">
        <div className="settings-section-title">Прохідний поріг</div>
        <div className="summary-grid">
          <div className="summary-row">
            <span className="summary-label">Мінімальний бал</span>
            <strong className="summary-val">{computed?.min}</strong>
          </div>
          <div className="summary-row">
            <span className="summary-label">Максимальний бал</span>
            <strong className="summary-val">{computed?.max}</strong>
          </div>
          <div className="summary-row highlight">
            <span className="summary-label">Прохідний відсоток (%)</span>
            <input
              type="number" step="1" min="1" max="100"
              className="setting-input pass-pct-input"
              value={passPct}
              onChange={(e) => setPassPct(Number(e.target.value))}
            />
          </div>
          <div className="summary-row highlight">
            <span className="summary-label">Прохідний бал = {passPct}% × {computed?.max}</span>
            <strong className="summary-val pass-score">{computed?.pass}</strong>
          </div>
        </div>

        <div className="settings-divider" />
        {saved && <span className="settings-saved-msg">✓ Збережено</span>}
        <button className="settings-save-btn" onClick={save} disabled={saving}>
          {saving ? "Збереження…" : "Зберегти всі налаштування"}
        </button>
      </div>
    </div>
  );
}
