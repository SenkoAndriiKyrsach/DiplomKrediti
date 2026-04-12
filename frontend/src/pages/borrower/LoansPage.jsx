import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyLoans } from "../../api/backend";
import "./HistoryPage.css";

export default function LoansPage({ customerId }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyLoans(customerId).then((data) => {
      setLoans(data.loans || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Завантаження…</p>;

  const getStatusClass = (remaining, endDate) => {
    if (remaining <= 0) return "status-paid";
    const isOverdue = new Date(endDate) < new Date();
    return isOverdue ? "status-overdue" : "status-active";
  };

  const getStatusLabel = (remaining, endDate) => {
    if (remaining <= 0) return "Погашено";
    const isOverdue = new Date(endDate) < new Date();
    return isOverdue ? "Прострочено" : "Активний";
  };

  return (
    <div className="history-wrapper">
      <h2 className="history-title">Мої кредити</h2>

      {loans.length === 0 && (
        <p style={{ color: "#888" }}>Немає активних кредитів.</p>
      )}

      <div className="loans-cards">
        {loans.map((loan) => (
          <div
            key={loan.credit_id}
            className="loan-card"
            onClick={() => navigate(`/borrower/application/${loan.application_id}`)}
          >
            <div className="loan-card-header">
              <span className="loan-id">Кредит #{loan.credit_id}</span>
              <span className={`loan-status ${getStatusClass(loan.remaining_balance, loan.end_date)}`}>
                {getStatusLabel(loan.remaining_balance, loan.end_date)}
              </span>
            </div>

            <div className="loan-card-body">
              <div className="loan-row">
                <span>Сума кредиту</span>
                <strong>{Number(loan.amount_approved).toLocaleString("uk-UA")} грн</strong>
              </div>
              <div className="loan-row">
                <span>Щомісячний платіж</span>
                <strong>{Number(loan.monthly_payment).toLocaleString("uk-UA")} грн</strong>
              </div>
              <div className="loan-row">
                <span>Відсоткова ставка</span>
                <strong>{loan.interest_rate}% річних</strong>
              </div>
              <div className="loan-row">
                <span>Початок</span>
                <strong>{new Date(loan.start_date).toLocaleDateString("uk-UA")}</strong>
              </div>
              <div className="loan-row">
                <span>Кінець</span>
                <strong>{new Date(loan.end_date).toLocaleDateString("uk-UA")}</strong>
              </div>
              <div className="loan-row highlight">
                <span>Залишок боргу</span>
                <strong style={{ color: loan.remaining_balance > 0 ? "#d93025" : "#34a853" }}>
                  {Number(loan.remaining_balance).toLocaleString("uk-UA")} грн
                </strong>
              </div>
              <div className="loan-row">
                <span>Платежів залишилось</span>
                <strong>{loan.payments_left}</strong>
              </div>
            </div>

            <div className="loan-card-footer">
              Натисніть, щоб переглянути графік платежів →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
