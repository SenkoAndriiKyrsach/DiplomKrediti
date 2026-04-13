import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSettings } from "../../api/backend";

export default function ManagerHome({ setLogin }) {
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

        <nav className="sidebar-nav-label">Менеджер</nav>

        <Link to="/manager" className={`menu-item ${location.pathname === "/manager" ? "active" : ""}`}>🏠 Головна</Link>
        <Link to="applications/3" className={`menu-item ${isActive("applications/3") ? "active" : ""}`}>
          📄 На розгляді
        </Link>
        <Link to="applications/5" className={`menu-item ${isActive("applications/5") ? "active" : ""}`}>
          ✅ Схвалені
        </Link>
        <Link to="applications/6" className={`menu-item ${isActive("applications/6") ? "active" : ""}`}>
          ❌ Відхилені
        </Link>
        <Link to="active-credits" className={`menu-item ${isActive("active-credits") ? "active" : ""}`}>
          💳 Активні кредити
        </Link>
        <Link to="blacklist" className={`menu-item ${isActive("blacklist") ? "active" : ""}`}>
          🚫 Чорний список
        </Link>

        <button className="logout-btn" onClick={logout}>🚪 Вийти</button>
      </aside>

      <section className="content">
        <Outlet />
      </section>
    </div>
  );
}
