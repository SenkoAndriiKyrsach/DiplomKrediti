import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login    from "./pages/Login";
import Register from "./pages/Register";

// Borrower
import BorrowerHome      from "./pages/borrower/BorrowerHome";
import BorrowerDashboard from "./pages/borrower/BorrowerDashboard";
import ProfilePage       from "./pages/borrower/ProfilePage";
import ApplyPage         from "./pages/borrower/ApplyPage";
import HistoryPage       from "./pages/borrower/HistoryPage";
import CatalogPage       from "./pages/borrower/CatalogPage";
import LoansPage         from "./pages/borrower/LoansPage";

// Manager
import ManagerHome             from "./pages/manager/ManagerHome";
import ManagerDashboard        from "./pages/manager/ManagerDashboard";
import ManagerApplicationsPage from "./pages/manager/ManagerApplicationsPage";
import BlacklistPage           from "./pages/manager/BlacklistPage";
import ActiveCreditsPage       from "./pages/manager/ActiveCreditsPage";
import ChangePasswordPage      from "./pages/manager/ChangePasswordPage";

// Admin
import AdminHome             from "./pages/admin/AdminHome";
import AdminDashboard        from "./pages/admin/AdminDashboard";
import GeneralSettingsPage   from "./pages/admin/GeneralSettingsPage";
import PenaltySettingsPage   from "./pages/admin/PenaltySettingsPage";
import ScoringSettingsPage   from "./pages/admin/ScoringSettingsPage";
import BusinessRulesPage     from "./pages/admin/BusinessRulesPage";
import BkiSettingsPage       from "./pages/admin/BkiSettingsPage";
import AdminProductListPage  from "./pages/admin/AdminProductListPage";
import AdminProductPage      from "./pages/admin/AdminProductPage";
import ManagersPage          from "./pages/admin/ManagersPage";
import LogsPage              from "./pages/admin/LogsPage";
import StatsPage             from "./pages/admin/StatsPage";

// Shared
import ApplicationDetailsPage from "./pages/ApplicationDetailsPage";

function App() {
  const [login, setLogin] = useState(localStorage.getItem("login") || "");

  const isAdmin   = login === "admin";
  // Менеджер — будь-який логін що не admin і не порожній, і не customer_id в localStorage
  const isManager = !isAdmin && !!login && !localStorage.getItem("customer_id")
    ? true : false;

  const mustChangePassword = localStorage.getItem("must_change_password") === "true";

  const handleSetLogin = (newLogin, extra = {}) => {
    if (extra.must_change_password) {
      localStorage.setItem("must_change_password", "true");
    } else {
      localStorage.removeItem("must_change_password");
    }
    setLogin(newLogin);
  };

  // Не залогінений
  if (!login) {
    return (
      <Router>
        <Routes>
          <Route path="/register" element={<Register setLogin={handleSetLogin} />} />
          <Route path="*"         element={<Login    setLogin={handleSetLogin} />} />
        </Routes>
      </Router>
    );
  }

  // Менеджер, який ще не змінив пароль — окрема сторінка
  if (isManager && mustChangePassword) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<ChangePasswordPage setLogin={handleSetLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>

        {/* DEFAULT REDIRECT */}
        <Route path="/" element={
          isAdmin   ? <Navigate to="/admin"    /> :
          isManager ? <Navigate to="/manager"  /> :
                      <Navigate to="/borrower" />
        } />

        {/* ═══════════════ BORROWER ═══════════════ */}
        <Route path="/borrower" element={<BorrowerHome setLogin={handleSetLogin} />}>
          <Route index element={<BorrowerDashboard customerId={localStorage.getItem("customer_id")} />} />
          <Route path="profile"  element={<ProfilePage  customerId={localStorage.getItem("customer_id")} />} />
          <Route path="catalog"  element={<CatalogPage />} />
          <Route path="apply"    element={<ApplyPage    customerId={localStorage.getItem("customer_id")} />} />
          <Route path="loans"    element={<LoansPage    customerId={localStorage.getItem("customer_id")} />} />
          <Route path="history"  element={<HistoryPage  customerId={localStorage.getItem("customer_id")} />} />
          <Route path="application/:id" element={<ApplicationDetailsPage />} />
        </Route>

        {/* ═══════════════ MANAGER ═══════════════ */}
        <Route path="/manager" element={<ManagerHome setLogin={handleSetLogin} />}>
          <Route index element={<ManagerDashboard />} />
          <Route path="applications/:statusId" element={<ManagerApplicationsPage />} />
          <Route path="application/:id"        element={<ApplicationDetailsPage />} />
          <Route path="active-credits"         element={<ActiveCreditsPage />} />
          <Route path="blacklist"              element={<BlacklistPage />} />
        </Route>

        {/* ═══════════════ ADMIN ═══════════════ */}
        <Route path="/admin" element={<AdminHome setLogin={handleSetLogin} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="general"        element={<GeneralSettingsPage />} />
          <Route path="penalty"        element={<PenaltySettingsPage />} />
          <Route path="scoring"        element={<ScoringSettingsPage />} />
          <Route path="business-rules" element={<BusinessRulesPage />} />
          <Route path="bki"            element={<BkiSettingsPage />} />
          <Route path="products"       element={<AdminProductListPage />} />
          <Route path="product/new"    element={<AdminProductPage />} />
          <Route path="product/:productId" element={<AdminProductPage />} />
          <Route path="managers"       element={<ManagersPage />} />
          <Route path="logs"           element={<LogsPage />} />
          <Route path="stats"          element={<StatsPage />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
