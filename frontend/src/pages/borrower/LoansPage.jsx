import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyLoans } from "../../api/backend";
import "./LoansPage.css";

function fmt(n) {
  return Number(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function LoansPage({ customerId }) {
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyLoans(customerId).then((data) => {
      setLoans(data.loans || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loans-loading">Завантаження…</div>;

  const active = loans.filter((l) => (l.payments_left ?? 0) > 0);
  const closed = loans.filter((l) => (l.payments_left ?? 0) <= 0);

  const Card = ({ loan }) => {
    const isActive = (loan.payments_left ?? 0) > 0;
    return (
      <div
        className={`loan-card ${isActive ? "loan-card--active" : "loan-card--closed"}`}
        onClick={() => navigate(`/borrower/application/${loan.application_id}`)}
      >
        {/* ── рядок 1: ID + статус ── */}
        <div className="loan-card__head">
          <span className="loan-card__id">Кредит #{loan.credit_id}</span>
          <span className={`loan-card__badge ${isActive ? "badge--active" : "badge--closed"}`}>
            {isActive ? "Активний" : "Закритий"}
          </span>
        </div>

        {/* ── основні поля ── */}
        <div className="loan-card__body">
          <div className="loan-card__row">
            <span className="loan-card__label">Сума кредиту</span>
            <span className="loan-card__value">{fmt(loan.amount_approved)} грн</span>
          </div>
          <div className="loan-card__row">
            <span className="loan-card__label">Залишок боргу</span>
            <span className={`loan-card__value ${isActive ? "value--debt" : "value--zero"}`}>
              {fmt(loan.remaining_balance)} грн
            </span>
          </div>
          <div className="loan-card__row">
            <span className="loan-card__label">Платежів залишилось</span>
            <span className="loan-card__value">{loan.payments_left ?? 0}</span>
          </div>
        </div>

        <div className="loan-card__footer">Переглянути графік платежів →</div>
      </div>
    );
  };

  return (
    <div className="loans-page">
      <h1 className="loans-title">Мої кредити</h1>

      {loans.length === 0 && (
        <p className="loans-empty">У вас ще немає кредитів.</p>
      )}

      {active.length > 0 && (
        <section className="loans-section">
          <h2 className="loans-section-title">Активні</h2>
          <div className="loans-grid">
            {active.map((l) => <Card key={l.credit_id} loan={l} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section className="loans-section">
          <h2 className="loans-section-title">Закриті</h2>
          <div className="loans-grid">
            {closed.map((l) => <Card key={l.credit_id} loan={l} />)}
          </div>
        </section>
      )}
    </div>
  );
}
