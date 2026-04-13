export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ========================================================================
//                            AUTH
// ========================================================================
export async function loginUser(login, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Помилка входу");
  }
  return res.json();
}

export async function loginWithGoogle(credential) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Помилка Google входу");
  }
  return res.json();
}

export async function registerUser(login, password, full_name) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password, full_name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Помилка реєстрації");
  }
  return res.json();
}


// ========================================================================
//                            CUSTOMER / BORROWER
// ========================================================================
export async function getCustomerProfile(customerId) {
  const res = await fetch(`${API_URL}/customer/${customerId}`);
  return res.json();
}

export async function updateCustomerProfile(customerId, data) {
  const res = await fetch(`${API_URL}/customer/${customerId}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMaxLoanInfo(customerId) {
  const res = await fetch(`${API_URL}/customer/${customerId}/max-loan`);
  return res.json();
}

export async function getMyApplications(customerId) {
  const res = await fetch(`${API_URL}/customer/${customerId}/applications`);
  return res.json();
}

export async function getMyLoans(customerId) {
  const res = await fetch(`${API_URL}/customer/${customerId}/loans`);
  return res.json();
}


// ========================================================================
//                            DICTIONARIES
// ========================================================================
export async function getCitizenships() {
  const res = await fetch(`${API_URL}/dictionaries/citizenships`);
  return res.json();
}

export async function getEmploymentTypes() {
  const res = await fetch(`${API_URL}/dictionaries/employment-types`);
  return res.json();
}


// ========================================================================
//                            CREDIT PRODUCTS
// ========================================================================
export async function getCreditProducts() {
  const res = await fetch(`${API_URL}/product`);
  return res.json(); // повертає масив
}

export async function getAllProductsManager() {
  const res = await fetch(`${API_URL}/product/all`);
  return res.json();
}

export async function getCreditProductById(productId) {
  const res = await fetch(`${API_URL}/product/${productId}`);
  return res.json();
}

export async function createCreditProduct(data) {
  const res = await fetch(`${API_URL}/product/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCreditProduct(id, data) {
  const res = await fetch(`${API_URL}/product/update/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deactivateCreditProduct(id) {
  const res = await fetch(`${API_URL}/product/${id}/deactivate`, { method: "POST" });
  return res.json();
}

// Backward-compat
export async function getCreditProduct() {
  const products = await getCreditProducts();
  return Array.isArray(products) ? products[0] : products;
}


// ========================================================================
//                            APPLICATIONS
// ========================================================================
export async function createApplication(data) {
  const res = await fetch(`${API_URL}/application/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getApplicationFullDetails(id) {
  const res = await fetch(`${API_URL}/application/details/${id}`);
  return res.json();
}


// ========================================================================
//                            MANAGER
// ========================================================================
export async function getApplicationsByStatus(statusId) {
  const res = await fetch(`${API_URL}/manager/by-status/${statusId}`);
  return res.json();
}

export async function createManagerDecision(appId, data) {
  const res = await fetch(`${API_URL}/application/${appId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getActiveCredits() {
  const res = await fetch(`${API_URL}/manager/active-credits`);
  return res.json();
}


// ========================================================================
//                            BLACKLIST
// ========================================================================
export async function getBlacklist() {
  const res = await fetch(`${API_URL}/blacklist`);
  return res.json();
}

export async function addToBlacklist(customer_id, reason) {
  const res = await fetch(`${API_URL}/blacklist/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id, reason }),
  });
  return res.json();
}

export async function removeFromBlacklist(blacklist_id) {
  const res = await fetch(`${API_URL}/blacklist/${blacklist_id}/remove`, { method: "POST" });
  return res.json();
}

export async function searchCustomersForBlacklist(q) {
  const res = await fetch(`${API_URL}/blacklist/search?q=${encodeURIComponent(q)}`);
  return res.json();
}


// ========================================================================
//                            PAYMENTS
// ========================================================================
export async function getPaymentSchedule(applicationId) {
  const res = await fetch(`${API_URL}/payment/application/${applicationId}/payments`);
  return res.json();
}

export async function payScheduleItem(paymentId) {
  const res = await fetch(`${API_URL}/payment/pay/${paymentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Payment failed");
  return res.json();
}

export async function payPenalty(paymentId) {
  const res = await fetch(`${API_URL}/payment/pay-penalty/${paymentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Penalty payment failed");
  return res.json();
}

// ========================================================================
//                            ADMIN SETTINGS
// ========================================================================
export async function getSettings(category = null) {
  const url = category
    ? `${API_URL}/settings?category=${category}`
    : `${API_URL}/settings`;
  const res = await fetch(url);
  return res.json();
}

export async function saveSettings(entries) {
  const res = await fetch(`${API_URL}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries),
  });
  return res.json();
}


export async function managerPayScheduleItem(paymentId) {
  const res = await fetch(`${API_URL}/payment/manager/pay/${paymentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Payment failed");
  return res.json();
}

// ========================================================================
//                        ADMIN — MANAGERS
// ========================================================================
export async function getManagers() {
  const res = await fetch(`${API_URL}/admin/managers`);
  return res.json();
}

export async function createManager(login, full_name) {
  const res = await fetch(`${API_URL}/admin/managers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, full_name }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Помилка"); }
  return res.json();
}

export async function setManagerActive(id, active) {
  const action = active ? "activate" : "deactivate";
  const res = await fetch(`${API_URL}/admin/managers/${id}/${action}`, { method: "PATCH" });
  return res.json();
}

export async function changeManagerPassword(login, old_password, new_password) {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, old_password, new_password }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Помилка"); }
  return res.json();
}

// ========================================================================
//                        ADMIN — SCORING CRITERIA
// ========================================================================
export async function getScoringConfig() {
  const res = await fetch(`${API_URL}/admin/scoring`);
  return res.json();
}

export async function saveScoringConfig(updates) {
  const res = await fetch(`${API_URL}/admin/scoring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  return res.json();
}

export async function getLogs(limit = 200, actionType = null) {
  const params = new URLSearchParams({ limit });
  if (actionType) params.set("action_type", actionType);
  const res = await fetch(`${API_URL}/admin/logs?${params}`);
  return res.json();
}
