import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerProfile, getMyLoans, getMyApplications } from "../../api/backend";
import "./BorrowerDashboard.css";

export default function BorrowerDashboard({ customerId }) {
  const [profile,     setProfile]     = useState(null);
  const [loanCount,   setLoanCount]   = useState("…");
  const [appCount,    setAppCount]    = useState("…");

  useEffect(() => {
    if (!customerId) return;
    getCustomerProfile(customerId)
      .then(setProfile)
      .catch(() => {});

    getMyLoans(customerId)
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.loans || []);
        // Рахуємо тільки активні (залишились непогашені платежі)
        setLoanCount(list.filter((l) => l.payments_left > 0).length);
      })
      .catch(() => setLoanCount(0));

    getMyApplications(customerId)
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.applications || []);
        setAppCount(list.length);
      })
      .catch(() => setAppCount(0));
  }, [customerId]);

  const fullName = profile?.full_name || localStorage.getItem("login") || "Клієнте";

  const cards = [
    { icon: "👤", title: "Мій профіль",     desc: "Персональні дані та документи", to: "profile" },
    { icon: "📋", title: "Продукти",         desc: "Кредитні пропозиції",          to: "catalog" },
    { icon: "✍️", title: "Подати заявку",    desc: "Новий кредитний запит",        to: "apply" },
    { icon: "💳", title: "Мої кредити",      desc: "Активні кредити та платежі",   to: "loans" },
    { icon: "📁", title: "Мої заявки",       desc: "Історія заявок",               to: "history" },
  ];

  return (
    <div className="bwr-dashboard-wrapper">
      <div className="bwr-dashboard-header">
        <div>
          <h1 className="bwr-dashboard-title">Вітаємо, {fullName}! 👋</h1>
          <p className="bwr-dashboard-subtitle">Ваш особистий кабінет клієнта</p>
        </div>
        <div className="bwr-dashboard-stats">
          <div className="bwr-stat-item">
            <span className="bwr-stat-value">{loanCount}</span>
            <span className="bwr-stat-label">Активних кредитів</span>
          </div>
          <div className="bwr-stat-item">
            <span className="bwr-stat-value">{appCount}</span>
            <span className="bwr-stat-label">Заявок</span>
          </div>
        </div>
      </div>

      <div className="bwr-dashboard-grid">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="bwr-dash-card">
            <span className="bwr-dash-icon">{c.icon}</span>
            <div>
              <div className="bwr-dash-title">{c.title}</div>
              <div className="bwr-dash-desc">{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
