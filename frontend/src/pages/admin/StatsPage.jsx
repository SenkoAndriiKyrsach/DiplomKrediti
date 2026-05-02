import { useEffect, useState, useCallback } from "react";
import { getApplicationStats, getManagersForFilter } from "../../api/backend";
import "./StatsPage.css";

// ── статусна метадата ──────────────────────────────────────────────────────
// статуси 2 і 6 об'єднуємо у "rejected" перед рендером
const STATUS_META = {
  1:         { label: "Нова",                                       color: "#6c757d", bg: "#f8f9fa" },
  3:         { label: "На розгляді",                                color: "#fd7e14", bg: "#fff8f0" },
  4:         { label: "Очікує",                                     color: "#0dcaf0", bg: "#f0fdff" },
  5:         { label: "Схвалена",                                   color: "#198754", bg: "#f0fff4" },
  rejected:  { label: "Відхилена (в т.ч. автоматично)",            color: "#dc3545", bg: "#fff5f5" },
};

// Об'єднує статуси 2 (авто) і 6 (вручну) в один рядок зі збереженням деталей
function mergeRejected(list) {
  let autoCount = 0, manualCount = 0, rejAmount = 0;
  const result = [];
  for (const s of list) {
    if (s.status_id === 2) { autoCount   += s.count; rejAmount += s.total_amount; }
    else if (s.status_id === 6) { manualCount += s.count; rejAmount += s.total_amount; }
    else { result.push(s); }
  }
  const total = autoCount + manualCount;
  if (total > 0) {
    result.push({
      status_id:    "rejected",
      status_name:  "Відхилена",
      count:        total,
      total_amount: rejAmount,
      manualCount,
      autoCount,
    });
  }
  return result;
}

const PERIODS = [
  { key: "day",   label: "За день"    },
  { key: "week",  label: "За тиждень" },
  { key: "month", label: "За місяць"  },
  { key: "all",   label: "Весь час"   },
];

function fmt(n) {
  return Number(n).toLocaleString("uk-UA");
}

function fmtMoney(n) {
  return Number(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₴";
}

// ── бар-чарт зі статичними лейблами (без hover-тултіпів в overflow) ────────
function BarChart({ data }) {
  if (!data || data.length === 0) return <p className="stats-empty">Немає даних за вибраний період</p>;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.date} className="bar-col">
          {/* лейбл зверху — завжди видимий, не виходить за межі overflow */}
          <span className="bar-count-label">{d.count}</span>
          <div
            className="bar-fill"
            style={{ height: `${Math.max(6, (d.count / maxCount) * 120)}px` }}
            title={`${d.count} заявок · ${fmtMoney(d.amount)}`}
          />
          <div className="bar-label">{d.date.slice(5)}</div>
          <div className="bar-amount-label">{fmtMoney(d.amount)}</div>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const [period,    setPeriod]    = useState("month");
  const [managerId, setManagerId] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const [stats,    setStats]    = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // ── завантаження менеджерів для дропдауну ──────────────────────────────
  useEffect(() => {
    getManagersForFilter()
      .then((d) => setManagers(d.managers || []))
      .catch(() => {});
  }, []);

  // ── завантаження статистики при зміні фільтрів ────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    getApplicationStats({
      period,
      managerId: managerId !== "" ? Number(managerId) : null,
      amountMin: amountMin !== "" ? Number(amountMin) : null,
      amountMax: amountMax !== "" ? Number(amountMax) : null,
    })
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, managerId, amountMin, amountMax]);

  useEffect(() => { load(); }, [load]);

  const byStatus = mergeRejected(stats?.by_status || []);

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1 className="stats-title">Статистика заявок</h1>
        <button className="stats-refresh-btn" onClick={load} disabled={loading}>
          {loading ? "⏳" : "🔄"} Оновити
        </button>
      </div>

      {/* ── ФІЛЬТРИ ──────────────────────────────────────────────────────── */}
      <div className="stats-filters">
        {/* Часовий фільтр */}
        <div className="filter-group">
          <span className="filter-label">Період</span>
          <div className="filter-pills">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`pill ${period === p.key ? "active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Менеджер */}
        <div className="filter-group">
          <span className="filter-label">Менеджер</span>
          <select
            className="filter-select"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">Всі менеджери</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.login})
              </option>
            ))}
          </select>
        </div>

        {/* Сума */}
        <div className="filter-group">
          <span className="filter-label">Сума заявки, ₴</span>
          <div className="filter-range">
            <input
              type="number"
              className="filter-input"
              placeholder="Від"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              min={0}
            />
            <span className="filter-range-sep">—</span>
            <input
              type="number"
              className="filter-input"
              placeholder="До"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              min={0}
            />
          </div>
        </div>

        {/* Скинути */}
        {(managerId || amountMin || amountMax) && (
          <button
            className="pill reset-pill"
            onClick={() => { setManagerId(""); setAmountMin(""); setAmountMax(""); }}
          >
            ✕ Скинути фільтри
          </button>
        )}
      </div>

      {/* ── ЗАГАЛЬНІ ПОКАЗНИКИ ───────────────────────────────────────────── */}
      <div className="stats-summary">
        <div className="summary-card total">
          <div className="summary-value">{loading ? "…" : fmt(stats?.total_count ?? 0)}</div>
          <div className="summary-label">Заявок всього</div>
        </div>
        <div className="summary-card amount">
          <div className="summary-value">{loading ? "…" : fmtMoney(stats?.total_amount ?? 0)}</div>
          <div className="summary-label">Загальна сума заявок</div>
        </div>
        {byStatus.find((s) => s.status_id === 5) && (
          <div className="summary-card approved">
            <div className="summary-value">
              {loading ? "…" : fmt(byStatus.find((s) => s.status_id === 5)?.count ?? 0)}
            </div>
            <div className="summary-label">Схвалено</div>
          </div>
        )}
        {byStatus.find((s) => s.status_id === "rejected") && (
          <div className="summary-card rejected">
            <div className="summary-value">
              {loading ? "…" : fmt(byStatus.find((s) => s.status_id === "rejected")?.count ?? 0)}
            </div>
            <div className="summary-label">Відхилено</div>
          </div>
        )}
        {byStatus.find((s) => s.status_id === 3) && (
          <div className="summary-card pending">
            <div className="summary-value">
              {loading ? "…" : fmt(byStatus.find((s) => s.status_id === 3)?.count ?? 0)}
            </div>
            <div className="summary-label">На розгляді</div>
          </div>
        )}
      </div>

      {/* ── КАРТКИ ПО СТАТУСАХ ───────────────────────────────────────────── */}
      <h2 className="stats-section-title">По статусах</h2>
      {byStatus.length === 0 && !loading ? (
        <p className="stats-empty">За вибраним фільтром заявок не знайдено</p>
      ) : (
        <div className="status-grid">
          {byStatus.map((s) => {
            const meta = STATUS_META[s.status_id] || { label: s.status_name, color: "#555", bg: "#f5f5f5" };
            const isRejected = s.status_id === "rejected";
            return (
              <div key={s.status_id} className="status-card" style={{ borderTopColor: meta.color, background: meta.bg }}>
                <div className="status-name" style={{ color: meta.color }}>{meta.label}</div>
                <div className="status-count">
                  {isRejected
                    ? `${fmt(s.manualCount)}(${fmt(s.autoCount)})`
                    : fmt(s.count)}
                </div>
                <div className="status-amount">{fmtMoney(s.total_amount)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ДИНАМІКА ─────────────────────────────────────────────────────── */}
      <h2 className="stats-section-title">
        Динаміка ({PERIODS.find((p) => p.key === period)?.label.toLowerCase()})
      </h2>
      <div className="chart-wrapper">
        {loading ? (
          <p className="stats-empty">Завантаження…</p>
        ) : (
          <BarChart data={stats?.timeline || []} />
        )}
      </div>

      {/* ── МЕНЕДЖЕРИ ────────────────────────────────────────────────────── */}
      {stats?.managers_stats?.length > 0 && (
        <>
          <h2 className="stats-section-title">Робота менеджерів</h2>
          <div className="managers-table-wrap">
            <table className="managers-table">
              <thead>
                <tr>
                  <th>Менеджер</th>
                  <th>Опрацьовано</th>
                  <th>Схвалено</th>
                  <th>Відхилено</th>
                  <th>% схвалення</th>
                </tr>
              </thead>
              <tbody>
                {stats.managers_stats.map((m) => {
                  const rate = m.processed > 0
                    ? Math.round((m.approved / m.processed) * 100)
                    : 0;
                  return (
                    <tr key={m.manager_id}>
                      <td>
                        <span className="mgr-name">{m.full_name}</span>
                        <span className="mgr-login">@{m.login}</span>
                      </td>
                      <td className="num">{fmt(m.processed)}</td>
                      <td className="num approved-num">{fmt(m.approved)}</td>
                      <td className="num rejected-num">{fmt(m.rejected)}</td>
                      <td className="num">
                        <span
                          className="rate-badge"
                          style={{ background: rate >= 60 ? "#d1fae5" : rate >= 30 ? "#fef9c3" : "#fee2e2" }}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
