import { useEffect, useState } from "react";
import { getMyApplications } from "../../api/backend";
import { Link } from "react-router-dom";
import "./HistoryPage.css";

export default function HistoryPage({ customerId }) {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await getMyApplications(customerId);
    setApps(data.applications || []);
  };

  return (
    <div className="history-wrapper">
      <h2 className="history-title">Історія заявок</h2>

      <table className="history-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Статус</th>
            <th>Сума</th>
            <th>Дата</th>
          </tr>
        </thead>

        <tbody>
          {apps.length === 0 && (
            <tr>
              <td colSpan="4" className="empty-row">Немає заявок</td>
            </tr>
          )}

          {apps.map((a) => (
            <tr key={a.application_id}>
              <td>
                <Link
                  className="history-link"
                  to={`/borrower/application/${a.application_id}`}
                >
                  #{a.application_id}
                </Link>
              </td>
              <td>{a.status_name}</td>
              <td>{a.amount_requested} грн</td>
              <td>{new Date(a.created_at).toLocaleString("uk-UA")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
