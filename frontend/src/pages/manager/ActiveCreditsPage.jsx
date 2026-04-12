import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveCredits, managerPayScheduleItem, getPaymentSchedule } from "../../api/backend";
import "./ActiveCreditsPage.css";

export default function ActiveCreditsPage() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    getActiveCredits().then((d) => {
      setCredits(d.credits || []);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  if (loading) return <p>Завантаження…</p>;

  return (
    <div className="active-credits-wrapper">
      <h2 className="active-credits-title">Активні кредити</h2>

      {credits.length === 0 && (
        <p style={{ color: "#888" }}>Немає активних кредитів.</p>
      )}

      <table className="credits-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Клієнт</th>
            <th>Сума</th>
            <th>Платіж / міс.</th>
            <th>Залишок</th>
            <th>Наст. платіж</th>
            <th>Прострочок</th>
            <th>Заявка</th>
          </tr>
        </thead>
        <tbody>
          {credits.map((c) => (
            <tr
              key={c.credit_id}
              className={c.overdue_count > 0 ? "row-overdue" : ""}
            >
              <td>#{c.credit_id}</td>
              <td>
                <div className="client-name">{c.full_name}</div>
                <div className="client-login">{c.login}</div>
              </td>
              <td>{Number(c.amount_approved).toLocaleString("uk-UA")} грн</td>
              <td>{Number(c.monthly_payment).toLocaleString("uk-UA")} грн</td>
              <td className={c.remaining_balance > 0 ? "balance-positive" : "balance-zero"}>
                {Number(c.remaining_balance).toLocaleString("uk-UA")} грн
              </td>
              <td>
                {c.next_payment_date
                  ? new Date(c.next_payment_date).toLocaleDateString("uk-UA")
                  : "—"}
              </td>
              <td>
                {c.overdue_count > 0 ? (
                  <span className="overdue-badge">{c.overdue_count}</span>
                ) : (
                  <span className="ok-badge">✓</span>
                )}
              </td>
              <td>
                <button
                  className="view-btn"
                  onClick={() => navigate(`/manager/application/${c.application_id}`)}
                >
                  Переглянути
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
