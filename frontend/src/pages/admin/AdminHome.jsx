import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSettings } from "../../api/backend";
import "./AdminHome.css";

export default function AdminHome({ setLogin }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const isActive  = (path) => location.pathname.includes(path);
  const [agencyName, setAgencyName] = useState("Адмін-панель");

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
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🏦</span>
          <span className="sidebar-brand-name">{agencyName}</span>
        </div>
        <nav className="sidebar-nav-label">Адміністратор</nav>

        <Link to="/admin"         className={`menu-item ${location.pathname === "/admin" ? "active" : ""}`}>🏠 Головна</Link>
        <Link to="managers"      className={`menu-item ${isActive("managers") ? "active" : ""}`}>👥 Менеджери</Link>
        <Link to="products"      className={`menu-item ${isActive("products") || isActive("product/") ? "active" : ""}`}>🏷️ Продукти</Link>
        <div className="sidebar-nav-label" style={{marginTop:8}}>Налаштування</div>
        <Link to="general"       className={`menu-item ${isActive("general") ? "active" : ""}`}>⚙️ Загальні</Link>
        <Link to="penalty"       className={`menu-item ${isActive("penalty") ? "active" : ""}`}>💰 Штрафи</Link>
        <Link to="scoring"       className={`menu-item ${isActive("scoring") ? "active" : ""}`}>📊 Скоринг</Link>
        <Link to="business-rules" className={`menu-item ${isActive("business-rules") ? "active" : ""}`}>📏 Бізнес-правила</Link>
        <Link to="bki"           className={`menu-item ${isActive("bki") ? "active" : ""}`}>🔍 БКІ</Link>

        <button className="logout-btn" onClick={logout}>🚪 Вийти</button>
      </aside>

      <section className="content">
        <Outlet />
      </section>
    </div>
  );
}
