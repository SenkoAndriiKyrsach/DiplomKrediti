import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSettings, getManagers } from "../../api/backend";
import "./AdminHome.css";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [agencyName, setAgencyName]   = useState("—");
  const [managerCount, setManagerCount] = useState("…");
  const [activeCount,  setActiveCount]  = useState("…");

  useEffect(() => {
    getSettings("general").then((d) => {
      const row = (d.general || []).find((r) => r.key === "agency.name");
      if (row?.value) setAgencyName(row.value);
    }).catch(() => {});

    getManagers().then((d) => {
      const list = d.managers || [];
      setManagerCount(list.length);
      setActiveCount(list.filter((m) => m.is_active).length);
    }).catch(() => {});
  }, []);

  const cards = [
    { icon: "💰", title: "Штрафи",          desc: "Ставка та пільговий період",   to: "penalty" },
    { icon: "📊", title: "Скоринг",         desc: "Критерії, ваги, прохідний бал", to: "scoring" },
    { icon: "📏", title: "Бізнес-правила",  desc: "DTI, мінімальний дохід, стаж", to: "business-rules" },
    { icon: "🔍", title: "БКІ",             desc: "Автоматичні перевірки БКІ",    to: "bki" },
    { icon: "👥", title: "Менеджери",       desc: "Створення та деактивація",     to: "managers" },
    { icon: "🏷️", title: "Кредитні продукти", desc: "Управління продуктами",     to: "products" },
    { icon: "⚙️", title: "Загальні",        desc: "Назва агенції",               to: "general" },
    { icon: "📈", title: "Статистика",       desc: "Заявки по статусах, менеджери", to: "stats" },
    { icon: "📋", title: "Журнал дій",      desc: "Всі дії в системі",           to: "logs" },
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Адміністративна панель</h1>
          <p className="dashboard-subtitle">{agencyName}</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-item">
            <span className="stat-value">{managerCount}</span>
            <span className="stat-label">Менеджерів</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{activeCount}</span>
            <span className="stat-label">Активних</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="dash-card">
            <span className="dash-card-icon">{c.icon}</span>
            <div>
              <div className="dash-card-title">{c.title}</div>
              <div className="dash-card-desc">{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
