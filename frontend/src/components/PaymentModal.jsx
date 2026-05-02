import { useState } from "react";
import "./PaymentModal.css";

function fmtCard(v) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function fmtExpiry(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}

export default function PaymentModal({ amount, label = "Сплатити", onConfirm, onClose }) {
  const [card,    setCard]    = useState("");
  const [expiry,  setExpiry]  = useState("");
  const [cvv,     setCvv]     = useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const valid =
    card.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length === 3 &&
    name.trim().length >= 3;

  const handlePay = async () => {
    if (!valid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // імітація запиту
    try {
      await onConfirm();
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && !done && onClose()}>
      <div className="pm-modal">

        {done ? (
          /* ── успіх ── */
          <div className="pm-success">
            <div className="pm-success-icon">✓</div>
            <div className="pm-success-title">Оплата успішна!</div>
            <div className="pm-success-amount">{Number(amount).toLocaleString("uk-UA")} грн</div>
            <button className="pm-btn-primary" onClick={onClose}>Закрити</button>
          </div>
        ) : (
          <>
            {/* шапка */}
            <div className="pm-header">
              <div>
                <div className="pm-title">{label}</div>
                <div className="pm-amount">{Number(amount).toLocaleString("uk-UA")} грн</div>
              </div>
              <button className="pm-close" onClick={onClose}>✕</button>
            </div>

            {/* бутафорська картка-превʼю */}
            <div className="pm-card-preview">
              <div className="pm-card-chip" />
              <div className="pm-card-number">
                {card || "•••• •••• •••• ••••"}
              </div>
              <div className="pm-card-bottom">
                <div>
                  <div className="pm-card-label">Власник</div>
                  <div className="pm-card-val">{name || "ВАШЕ ІМ'Я"}</div>
                </div>
                <div>
                  <div className="pm-card-label">Дійсна до</div>
                  <div className="pm-card-val">{expiry || "MM/YY"}</div>
                </div>
              </div>
            </div>

            {/* форма */}
            <div className="pm-form">
              <div className="pm-field">
                <label>Номер картки</label>
                <input
                  placeholder="0000 0000 0000 0000"
                  value={card}
                  onChange={(e) => setCard(fmtCard(e.target.value))}
                  maxLength={19}
                  inputMode="numeric"
                />
              </div>
              <div className="pm-field">
                <label>Ім'я власника</label>
                <input
                  placeholder="IVAN KOVAL"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                />
              </div>
              <div className="pm-row2">
                <div className="pm-field">
                  <label>Дійсна до</label>
                  <input
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                    maxLength={5}
                    inputMode="numeric"
                  />
                </div>
                <div className="pm-field">
                  <label>CVV</label>
                  <input
                    placeholder="000"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    maxLength={3}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
              </div>
              <button
                className="pm-btn-primary"
                onClick={handlePay}
                disabled={!valid || loading}
              >
                {loading ? "Обробка…" : `Сплатити ${Number(amount).toLocaleString("uk-UA")} грн`}
              </button>
              <p className="pm-secure">🔒 Захищена оплата · Тестовий режим</p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
