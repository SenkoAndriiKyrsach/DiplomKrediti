import { useEffect, useState, useCallback } from "react";
import { getLogs } from "../../api/backend";
import "./LogsPage.css";

const TYPE_LABELS = {
  application:   "Заявка",
  status_change: "Статус заявки",
  admin:         "Адміністрування",
};

const TYPE_COLORS = {
  application:   "log-type-app",
  status_change: "log-type-status",
  admin:         "log-type-admin",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("uk-UA", {
    day:    "2-digit", month: "2-digit", year: "numeric",
    hour:   "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function LogsPage() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("");   // '' | 'application' | 'status_change' | 'admin'
  const [limit,      setLimit]      = useState(100);

  const load = useCallback(() => {
    setLoading(true);
    getLogs(limit, filter || null)
      .then((d) => setLogs(d.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [filter, limit]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="logs-wrapper">
      <div className="logs-header">
        <div>
          <h2 className="logs-title">Журнал дій</h2>
          <p className="logs-subtitle">Повна історія подій у системі</p>
        </div>
        <button className="logs-refresh-btn" onClick={load} disabled={loading}>
          🔄 Оновити
        </button>
      </div>

      {/* Фільтри */}
      <div className="logs-filters">
        <span className="logs-filter-label">Тип дії:</span>
        {[
          { value: "",              label: "Усі" },
          { value: "application",   label: "Заявки" },
          { value: "status_change", label: "Зміни статусів" },
          { value: "admin",         label: "Адміністрування" },
        ].map((opt) => (
          <button
            key={opt.value}
            className={`logs-filter-btn ${filter === opt.value ? "active" : ""}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}

        <span className="logs-filter-label" style={{ marginLeft: "auto" }}>Показати:</span>
        {[50, 100, 200].map((n) => (
          <button
            key={n}
            className={`logs-filter-btn ${limit === n ? "active" : ""}`}
            onClick={() => setLimit(n)}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Таблиця */}
      <div className="logs-table-wrap">
        {loading ? (
          <div className="logs-loading">Завантаження…</div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">Записів не знайдено</div>
        ) : (
          <table className="logs-table">
            <colgroup>
              <col className="col-date" />
              <col className="col-type" />
              <col className="col-actor" />
              <col className="col-desc" />
            </colgroup>
            <thead>
              <tr>
                <th>Дата і час</th>
                <th>Тип дії</th>
                <th>Хто</th>
                <th>Що зробилось</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.log_id}>
                  <td className="log-date">{formatDate(row.created_at)}</td>
                  <td>
                    <span className={`log-type-badge ${TYPE_COLORS[row.action_type] || ""}`}>
                      {TYPE_LABELS[row.action_type] || row.action_type}
                    </span>
                  </td>
                  <td className="log-actor">{row.actor || "—"}</td>
                  <td className="log-desc">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="logs-count">
        Показано {logs.length} {logs.length === limit ? `(ліміт ${limit})` : ""}
      </div>
    </div>
  );
}
