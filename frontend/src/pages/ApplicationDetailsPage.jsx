import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getApplicationFullDetails,
  createManagerDecision,
  getPaymentSchedule,
  payScheduleItem,
  payPenalty,
  managerPayScheduleItem,
} from "../api/backend";
import PaymentModal from "../components/PaymentModal";

import "./ApplicationDetailsPage.css";

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPending = location.state?.fromPending === true;
  const isManager = localStorage.getItem("login") === "manager";

  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [payingId, setPayingId] = useState(null);

  // модальне вікно оплати
  const [modal, setModal] = useState(null);
  // { paymentId, amount, label, type: "main"|"penalty" }

  useEffect(() => {
    load();
    loadSchedule();
  }, []);

  async function load() {
    const res = await getApplicationFullDetails(id);
    setData(res);
  }

  async function loadSchedule() {
    const res = await getPaymentSchedule(id);
    if (res?.schedule) {
      setSchedule(res.schedule);
      setRemainingBalance(res.remaining_balance ?? null);
    }
  }

  // відкриваємо модалку — реальний API викликається після підтвердження картки
  function openPayModal(paymentId, amount, type = "main") {
    setModal({
      paymentId,
      amount,
      type,
      label: type === "penalty" ? "Сплатити штраф" : "Сплатити платіж",
    });
  }

  async function handlePay(paymentId) {
    setPayingId(paymentId);
    try {
      await payScheduleItem(paymentId);
      await loadSchedule();
    } catch {
      alert("Помилка оплати");
    } finally {
      setPayingId(null);
    }
  }

  async function handlePayPenalty(paymentId) {
    setPayingId(paymentId);
    try {
      await payPenalty(paymentId);
      await loadSchedule();
    } catch {
      alert("Помилка оплати штрафу");
    } finally {
      setPayingId(null);
    }
  }

  async function handleManagerPay(paymentId) {
    setPayingId(paymentId);
    try {
      await managerPayScheduleItem(paymentId);
      await loadSchedule();
    } catch {
      alert("Помилка зарахування платежу");
    } finally {
      setPayingId(null);
    }
  }

  async function handleDecision(decision) {
    const comment = decision === "rejected"
      ? (window.prompt("Коментар (необов'язково):") ?? "")
      : "";

    await createManagerDecision(id, {
      manager_id: 1,
      final_decision: decision,
      comment,
      corrected_amount: null,
      corrected_term: null,
    });
    navigate("/manager/applications/3");
  }

  if (!data) return <p>Завантаження…</p>;

  const app = data.application;
  const borrower = data.borrower;
  const otherApps = data.other_applications || [];
  const BKIreports = data.bki_reports || [];

  const overdueCount = schedule.filter(
    (p) => !p.is_paid && p.penalty_amount > 0
  ).length;

  return (
    <div className="details-wrapper">
      <h1 className="page-title">Заявка #{id}</h1>

      {/* ===== ОСНОВНІ ДАНІ ===== */}
      <div className="details-grid">
        <div className="card">
          <h2>Дані по заявці</h2>
          <div className="row"><span>Статус:</span><strong>{app.status_name}</strong></div>
          <div className="row"><span>Продукт:</span><strong>{app.product_name || "—"}</strong></div>
          <div className="row"><span>Сума запиту:</span><strong>{Number(app.amount_requested).toLocaleString("uk-UA")} грн</strong></div>
          {app.down_payment_amount > 0 && (
            <div className="row"><span>Перший внесок:</span><strong>{Number(app.down_payment_amount).toLocaleString("uk-UA")} грн</strong></div>
          )}
          {app.down_payment_amount > 0 && (
            <div className="row"><span>Сума кредиту:</span><strong>{(Number(app.amount_requested) - Number(app.down_payment_amount)).toLocaleString("uk-UA")} грн</strong></div>
          )}
          <div className="row"><span>Термін:</span><strong>{app.term_months} міс.</strong></div>
          <div className="row"><span>Ціль:</span><strong>{app.purpose}</strong></div>
          <div className="row">
            <span>Створено:</span>
            <strong>{new Date(app.created_at).toLocaleString("uk-UA")}</strong>
          </div>
        </div>

        <div className="card">
          <h2>Дані позичальника</h2>
          <div className="row"><span>ПІБ:</span><strong>{borrower.full_name}</strong></div>
          <div className="row">
            <span>Дата народження:</span>
            <strong>{borrower.birth_date ? new Date(borrower.birth_date).toLocaleDateString("uk-UA") : "—"}</strong>
          </div>
          <div className="row"><span>Громадянство:</span><strong>{borrower.citizenship_name}</strong></div>
          <div className="row"><span>Місячний дохід:</span><strong>{Number(borrower.monthly_income).toLocaleString("uk-UA")} грн</strong></div>
          <div className="row"><span>Тип зайнятості:</span><strong>{borrower.employment_type_name}</strong></div>
          <div className="row"><span>Стаж:</span><strong>{borrower.employment_term_months} міс.</strong></div>
        </div>
      </div>

      {/* ===== ТІЛЬКИ ДЛЯ МЕНЕДЖЕРА: скоринг + бізнес-правила ===== */}
      {isManager && (
        <div className="details-grid">
          <div className="card">
            <h2>Перевірка бізнес-правил</h2>
            <div className="row"><span>Дохід:</span><strong className={data.business_rules.income_ok ? "ok" : "fail"}>{data.business_rules.income_ok ? "✅ OK" : "❌ Не відповідає"}</strong></div>
            <div className="row"><span>DTI:</span><strong className={data.business_rules.dti_ok ? "ok" : "fail"}>{data.business_rules.dti_ok ? "✅ OK" : "❌ Не відповідає"}</strong></div>
            <div className="row"><span>Тип зайнятості:</span><strong className={data.business_rules.employment_type_ok ? "ok" : "fail"}>{data.business_rules.employment_type_ok ? "✅ OK" : "❌ Не відповідає"}</strong></div>
            <div className="row"><span>Стаж:</span><strong className={data.business_rules.employment_ok ? "ok" : "fail"}>{data.business_rules.employment_ok ? "✅ OK" : "❌ Не відповідає"}</strong></div>
            <div className="row">
              <span>Загальний результат:</span>
              <strong className={data.business_rules.overall_result ? "ok" : "fail"}>
                {data.business_rules.overall_result ? "✅ PASS" : "❌ FAIL"}
              </strong>
            </div>
          </div>

          <div className="card">
            <h2>Скоринг</h2>
            <div className="row"><span>Скоринговий бал:</span><strong>{data.scoring.scoring_score}</strong></div>
            <div className="row"><span>Рівень ризику:</span><strong>{data.scoring.risk_level_name}</strong></div>
            <div className="row"><span>Версія моделі:</span><strong>{data.scoring.model_version}</strong></div>
          </div>
        </div>
      )}

      {/* ===== РЕКОМЕНДАЦІЯ СИСТЕМИ ===== */}
      {isManager && data.recommendation && (
        <div className="other-apps-wrapper recommendation-box">
          <h2>Рекомендація системи</h2>
          <p className="recommendation-text">{data.recommendation}</p>
        </div>
      )}

      {/* ===== БКІ ===== */}
      {isManager && (
        <div className="other-apps-wrapper">
          <h2>Бюро кредитних історій</h2>
          {BKIreports.length === 0 && <p className="empty-hint">Дані БКІ відсутні.</p>}
          {BKIreports.length > 0 && (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Звіт №</th>
                  <th>Дата</th>
                  <th>Всього кредитів</th>
                  <th>Прострочених</th>
                  <th>Макс. прострочка</th>
                  <th>БКІ скоринг</th>
                </tr>
              </thead>
              <tbody>
                {BKIreports.map((a) => (
                  <tr key={a.report_id}>
                    <td>{a.report_id}</td>
                    <td>{new Date(a.report_date).toLocaleDateString("uk-UA")}</td>
                    <td>{a.total_loans}</td>
                    <td className={a.overdue_loans > 0 ? "text-danger" : ""}>{a.overdue_loans}</td>
                    <td className={a.max_overdue_days > 30 ? "text-danger" : ""}>{a.max_overdue_days}</td>
                    <td>{a.external_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== ГРАФІК ПЛАТЕЖІВ ===== */}
      {schedule.length > 0 && (
        <div className="other-apps-wrapper">
          <div className="schedule-header">
            <h2>Графік платежів</h2>
            {remainingBalance !== null && (
              <div className="remaining-balance">
                Залишок боргу: <strong>{Number(remainingBalance).toLocaleString("uk-UA")} грн</strong>
                {overdueCount > 0 && (
                  <span className="overdue-warning"> · {overdueCount} прострочених</span>
                )}
              </div>
            )}
          </div>

          <table className="history-table schedule-table">
            <thead>
              <tr>
                <th style={{width:"4%"}}>№</th>
                <th style={{width:"14%"}}>Дата платежу</th>
                <th style={{width:"14%"}}>Сума</th>
                <th style={{width:"10%"}}>Статус</th>
                <th style={{width:"13%"}}>Штраф</th>
                <th style={{width:"13%"}}>Штраф сплачено</th>
                {!isManager && <th style={{width:"32%"}}>Дії</th>}
                {isManager  && <th style={{width:"32%"}}>Дії</th>}
              </tr>
            </thead>
            <tbody>
              {schedule.map((p, idx) => {
                const today    = new Date(); today.setHours(0,0,0,0);
                const payDate  = new Date(p.payment_date); payDate.setHours(0,0,0,0);
                const overdue  = !p.is_paid && payDate < today;

                // іконка статусу
                let statusIcon, statusClass;
                if (p.is_paid)    { statusIcon = "✓";  statusClass = "sched-paid";    }
                else if (overdue) { statusIcon = "⚠️"; statusClass = "sched-overdue"; }
                else              { statusIcon = "⏳"; statusClass = "sched-future";  }

                return (
                  <tr key={p.payment_id} className={overdue ? "row-overdue" : ""}>
                    <td className="td-center">{idx + 1}</td>
                    <td>{new Date(p.payment_date).toLocaleDateString("uk-UA")}</td>
                    <td>{Number(p.payment_amount).toLocaleString("uk-UA")} грн</td>
                    <td className="td-center">
                      <span className={`sched-status ${statusClass}`}>{statusIcon}</span>
                    </td>
                    <td>
                      {p.penalty_amount > 0
                        ? <span className="penalty-amt">{Number(p.penalty_amount).toLocaleString("uk-UA")} грн</span>
                        : <span className="td-dash">—</span>}
                    </td>
                    <td className="td-center">
                      {p.penalty_amount > 0
                        ? (p.penalty_paid
                            ? <span className="sched-status sched-paid">✓</span>
                            : <span className="sched-status sched-overdue">✗</span>)
                        : <span className="td-dash">—</span>}
                    </td>

                    {/* ── Дії клієнта ── */}
                    {!isManager && (
                      <td className="pay-actions">
                        {!p.is_paid && (
                          <button
                            className="pay-btn"
                            onClick={() => openPayModal(p.payment_id, p.payment_amount, "main")}
                            disabled={payingId === p.payment_id}
                          >
                            Сплатити
                          </button>
                        )}
                        {!p.penalty_paid && p.penalty_amount > 0 && (
                          <button
                            className="pay-btn penalty-btn"
                            onClick={() => openPayModal(p.payment_id, p.penalty_amount, "penalty")}
                            disabled={payingId === p.payment_id}
                          >
                            Сплатити штраф
                          </button>
                        )}
                        {/* якщо нічого не показуємо — дефіс */}
                        {p.is_paid && (p.penalty_amount <= 0 || p.penalty_paid) && (
                          <span className="td-dash">—</span>
                        )}
                      </td>
                    )}

                    {/* ── Дії менеджера ── */}
                    {isManager && (
                      <td>
                        {!p.is_paid ? (
                          <button
                            className="pay-btn"
                            onClick={() => handleManagerPay(p.payment_id)}
                            disabled={payingId === p.payment_id}
                          >
                            {payingId === p.payment_id ? "…" : "Зарахувати"}
                          </button>
                        ) : <span className="td-dash">—</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== МОДАЛЬНЕ ВІКНО ОПЛАТИ ===== */}
      {modal && (
        <PaymentModal
          amount={modal.amount}
          label={modal.label}
          onConfirm={async () => {
            if (modal.type === "penalty") {
              await handlePayPenalty(modal.paymentId);
            } else {
              await handlePay(modal.paymentId);
            }
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* ===== РІШЕННЯ МЕНЕДЖЕРА ===== */}
      {data.manager_decision && (
        <div className="other-apps-wrapper">
          <h2>Рішення менеджера</h2>
          <div className="row"><span>Рішення:</span>
            <strong className={data.manager_decision.final_decision === "approved" ? "ok" : "fail"}>
              {data.manager_decision.final_decision === "approved" ? "✅ Схвалено" : "❌ Відхилено"}
            </strong>
          </div>
          {data.manager_decision.comment && (
            <div className="row"><span>Коментар:</span><span>{data.manager_decision.comment}</span></div>
          )}
          {data.manager_decision.corrected_amount && (
            <div className="row"><span>Скоригована сума:</span><strong>{Number(data.manager_decision.corrected_amount).toLocaleString("uk-UA")} грн</strong></div>
          )}
        </div>
      )}

      {/* ===== ІНШІ ЗАЯВКИ КЛІЄНТА ===== */}
      {isManager && otherApps.length > 0 && (
        <div className="other-apps-wrapper">
          <h2>Інші заявки цього клієнта</h2>
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                <th>Скоринг</th>
                <th>Сума</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {otherApps.map((a) => (
                <tr key={a.application_id}>
                  <td
                    className="link"
                    onClick={() => navigate(`/manager/application/${a.application_id}`)}
                  >
                    {a.application_id}
                  </td>
                  <td>{a.status_name}</td>
                  <td>{a.scoring_score}</td>
                  <td>{Number(a.amount_requested).toLocaleString("uk-UA")} грн</td>
                  <td>{new Date(a.created_at).toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== КНОПКИ ===== */}
      <div className="btn-block">
        {isManager && fromPending && (
          <>
            <button
              className="btn success"
              onClick={() => handleDecision("approved")}
            >
              Схвалити
            </button>
            <button
              className="btn danger"
              onClick={() => handleDecision("rejected")}
            >
              Відхилити
            </button>
          </>
        )}
        <button className="btn primary" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>
    </div>
  );
}
