import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login    from "./pages/Login";
import Register from "./pages/Register";

// Borrower
import BorrowerHome  from "./pages/borrower/BorrowerHome";
import ProfilePage   from "./pages/borrower/ProfilePage";
import ApplyPage     from "./pages/borrower/ApplyPage";
import HistoryPage   from "./pages/borrower/HistoryPage";
import CatalogPage   from "./pages/borrower/CatalogPage";
import LoansPage     from "./pages/borrower/LoansPage";

// Manager
import ManagerHome             from "./pages/manager/ManagerHome";
import ManagerApplicationsPage from "./pages/manager/ManagerApplicationsPage";
import BlacklistPage           from "./pages/manager/BlacklistPage";
import ActiveCreditsPage       from "./pages/manager/ActiveCreditsPage";

// Admin
import AdminHome              from "./pages/admin/AdminHome";
import GeneralSettingsPage   from "./pages/admin/GeneralSettingsPage";
import PenaltySettingsPage   from "./pages/admin/PenaltySettingsPage";
import ScoringSettingsPage   from "./pages/admin/ScoringSettingsPage";
import BusinessRulesPage     from "./pages/admin/BusinessRulesPage";
import BkiSettingsPage       from "./pages/admin/BkiSettingsPage";
import AdminProductListPage  from "./pages/admin/AdminProductListPage";
import AdminProductPage      from "./pages/admin/AdminProductPage";

// Shared
import ApplicationDetailsPage from "./pages/ApplicationDetailsPage";

function App() {
  const [login, setLogin] = useState(localStorage.getItem("login") || "");

  const isManager = login === "manager";
  const isAdmin   = login === "admin";

  // Не залогінений — тільки login / register
  if (!login) {
    return (
      <Router>
        <Routes>
          <Route path="/register" element={<Register setLogin={setLogin} />} />
          <Route path="*"         element={<Login setLogin={setLogin} />} />
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
        <Route path="/borrower" element={<BorrowerHome setLogin={setLogin} />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile"  element={<ProfilePage  customerId={localStorage.getItem("customer_id")} />} />
          <Route path="catalog"  element={<CatalogPage />} />
          <Route path="apply"    element={<ApplyPage    customerId={localStorage.getItem("customer_id")} />} />
          <Route path="loans"    element={<LoansPage    customerId={localStorage.getItem("customer_id")} />} />
          <Route path="history"  element={<HistoryPage  customerId={localStorage.getItem("customer_id")} />} />
          <Route path="application/:id" element={<ApplicationDetailsPage />} />
        </Route>

        {/* ═══════════════ MANAGER ═══════════════ */}
        <Route path="/manager" element={<ManagerHome setLogin={setLogin} />}>
          <Route index element={<Navigate to="applications/3" replace />} />
          <Route path="applications/:statusId" element={<ManagerApplicationsPage />} />
          <Route path="application/:id"        element={<ApplicationDetailsPage />} />
          <Route path="active-credits"         element={<ActiveCreditsPage />} />
          <Route path="blacklist"              element={<BlacklistPage />} />
        </Route>

        {/* ═══════════════ ADMIN ═══════════════ */}
        <Route path="/admin" element={<AdminHome setLogin={setLogin} />}>
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general"       element={<GeneralSettingsPage />} />
          <Route path="penalty"       element={<PenaltySettingsPage />} />
          <Route path="scoring"       element={<ScoringSettingsPage />} />
          <Route path="business-rules" element={<BusinessRulesPage />} />
          <Route path="bki"           element={<BkiSettingsPage />} />
          <Route path="products"      element={<AdminProductListPage />} />
          <Route path="product/new"   element={<AdminProductPage />} />
          <Route path="product/:productId" element={<AdminProductPage />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
