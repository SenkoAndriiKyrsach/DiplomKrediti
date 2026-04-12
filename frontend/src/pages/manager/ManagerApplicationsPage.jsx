import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getApplicationsByStatus } from "../../api/backend";
import "./ManagerApplicationsPage.css";

export default function ManagerApplicationsPage() {
  const { statusId } = useParams();
  const [apps, setApps] = useState([]);

  const titles = {
    3: "Заявки на розгляд",
    5: "Схвалені заявки",
    6: "Відхилені заявки",
  };

  useEffect(() => { load(); }, [statusId]);

  async function load() {
    const res = await getApplicationsByStatus(statusId);
    setApps(res.applications || []);
  }

  return (
    <div className="manager-apps-wrapper">
      <h1 className="manager-apps-title">{titles[statusId] || "Заявки"}</h1>

      {apps.length === 0 ? (
        <p className="apps-empty">Заявок немає</p>
      ) : (
        <div className="apps-table-wrapper">
          <table className="apps-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ПІБ клієнта</th>
                <th>Сума (грн)</th>
                <th>Термін (міс)</th>
                <th>Дата подачі</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.application_id}>
                  <td>
                    <Link
                      to={`/manager/application/${a.application_id}`}
                      state={{ fromPending: statusId === "3" }}
                      className="app-link"
                    >
                      #{a.application_id}
                    </Link>
                  </td>
                  <td className="app-name">{a.full_name}</td>
                  <td>{Number(a.amount_requested).toLocaleString("uk-UA")}</td>
                  <td>{a.term_months}</td>
                  <td>{new Date(a.created_at).toLocaleDateString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
