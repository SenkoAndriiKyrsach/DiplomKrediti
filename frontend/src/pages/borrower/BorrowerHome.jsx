import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSettings } from "../../api/backend";

export default function BorrowerHome({ setLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [agencyName, setAgencyName] = useState("КредитБюро");

  const isActive = (path) => location.pathname.includes(path);

  useEffect(() => {
    getSettings("general").then((d) => {
      const row = (d.general || []).find((r) => r.key === "agency.name");
      if (row?.value) setAgencyName(row.value);
    }).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    setLogin("");
    navigate("/");
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🏦</span>
          <span className="sidebar-brand-name">{agencyName}</span>
        </div>

        <nav className="sidebar-nav-label">Навігація</nav>

        <Link to="profile"  className={`menu-item ${isActive("profile")  ? "active" : ""}`}>👤 Профіль</Link>
        <Link to="catalog"  className={`menu-item ${isActive("catalog")  ? "active" : ""}`}>📋 Продукти</Link>
        <Link to="apply"    className={`menu-item ${isActive("apply")    ? "active" : ""}`}>✍️ Подати заявку</Link>
        <Link to="loans"    className={`menu-item ${isActive("loans")    ? "active" : ""}`}>💳 Мої кредити</Link>
        <Link to="history"  className={`menu-item ${isActive("history")  ? "active" : ""}`}>📁 Заявки</Link>

        <button className="logout-btn" onClick={logout}>🚪 Вийти</button>
      </aside>

      <section className="content">
        <Outlet />
      </section>
    </div>
  );
}
