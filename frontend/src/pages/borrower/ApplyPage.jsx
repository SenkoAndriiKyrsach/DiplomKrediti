import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createApplication,
  getCreditProductById,
  getCreditProducts,
  getMaxLoanInfo,
} from "../../api/backend";
import "./ApplyPage.css";

export default function ApplyPage({ customerId }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(
    searchParams.get("productId") ? Number(searchParams.get("productId")) : null
  );
  const [product, setProduct] = useState(null);

  const [amount, setAmount] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [term, setTerm] = useState("");
  const [purpose, setPurpose] = useState("");

  const [monthlyPayment, setMonthlyPayment] = useState(null);
  const [maxLoanInfo, setMaxLoanInfo] = useState(null);

  const [error, setError] = useState("");
  const [errors, setErrors] = useState({ amount: false, term: false, purpose: false });
  const [loading, setLoading] = useState(false);

  // Завантажити список продуктів
  useEffect(() => {
    getCreditProducts().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      // Якщо продукт не обраний — обрати перший
      if (!selectedProductId && list.length > 0) {
        setSelectedProductId(list[0].product_id);
      }
    });
    if (customerId) {
      getMaxLoanInfo(customerId).then(setMaxLoanInfo);
    }
  }, []);

  // Завантажити деталі обраного продукту
  useEffect(() => {
    if (!selectedProductId) return;
    getCreditProductById(selectedProductId).then(setProduct);
  }, [selectedProductId]);

  // Розрахунок місячного платежу
  useEffect(() => {
    if (!product || !amount || !term) {
      setMonthlyPayment(null);
      return;
    }
    const P = Math.max(0, Number(amount) - Number(downPayment || 0));
    const n = Number(term);
    const r = Number(product.interest_rate) / 12 / 100;
    if (n <= 0) return;
    if (r === 0) {
      setMonthlyPayment((P / n).toFixed(2));
      return;
    }
    const M = P * (r / (1 - Math.pow(1 + r, -n)));
    setMonthlyPayment(M.toFixed(2));
  }, [amount, downPayment, term, product]);

  // Максимальна сума за заданим терміном
  const calcMaxAmount = () => {
    if (!maxLoanInfo || !term || !product) return null;
    const maxMonthly = maxLoanInfo.max_monthly_payment;
    const n = Number(term);
    const r = Number(product.interest_rate) / 12 / 100;
    if (n <= 0 || maxMonthly <= 0) return null;
    let maxP;
    if (r === 0) {
      maxP = maxMonthly * n;
    } else {
      maxP = maxMonthly * (1 - Math.pow(1 + r, -n)) / r;
    }
    return Math.min(Math.floor(maxP), product.max_amount);
  };

  const maxAmount = calcMaxAmount();

  const submit = async () => {
    let hasError = false;
    const newErrors = { amount: false, term: false, purpose: false };
    setError("");

    if (!product) return;

    const numAmount = Number(amount);
    const numDown = Number(downPayment || 0);
    const numTerm = Number(term);

    if (numAmount < product.min_amount || numAmount > product.max_amount) {
      newErrors.amount = true;
      hasError = true;
      setError(`Сума від ${product.min_amount.toLocaleString()} до ${product.max_amount.toLocaleString()} грн`);
    }

    if (numDown < 0 || numDown >= numAmount) {
      newErrors.amount = true;
      hasError = true;
      setError("Перший внесок не може перевищувати суму кредиту");
    }

    if (product.down_payment_pct > 0 && numDown < numAmount * product.down_payment_pct / 100) {
      newErrors.amount = true;
      hasError = true;
      setError(`Мінімальний перший внесок: ${product.down_payment_pct}% від суми`);
    }

    if (numTerm < product.min_term || numTerm > product.max_term) {
      newErrors.term = true;
      hasError = true;
      setError(`Термін від ${product.min_term} до ${product.max_term} місяців`);
    }

    if (!purpose.trim()) {
      newErrors.purpose = true;
      hasError = true;
      setError("Вкажіть ціль кредиту");
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    try {
      const res = await createApplication({
        customer_id: Number(customerId),
        product_id: selectedProductId,
        amount_requested: numAmount,
        term_months: numTerm,
        purpose,
        down_payment_amount: numDown,
      });

      if (res.status === "auto_rejected") {
        alert("Заявку автоматично відхилено системою.");
      } else {
        alert("Заявку подано! Очікуйте рішення менеджера.");
      }

      navigate("/borrower/history");
    } catch (e) {
      setError("Помилка при відправці заявки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-wrapper">
      <h2 className="apply-title">Подати заявку</h2>

      {/* Вибір продукту */}
      <h3 className="apply-subtitle">Кредитний продукт</h3>
      <div className="apply-product-select">
        {products.map((p) => (
          <button
            key={p.product_id}
            className={`product-tab ${selectedProductId === p.product_id ? "active" : ""}`}
            onClick={() => setSelectedProductId(p.product_id)}
          >
            {p.product_name}
          </button>
        ))}
      </div>

      {/* Інформація про продукт */}
      {product && (
        <div className="apply-product-info">
          <div className="apply-info-row"><span>Ставка:</span><strong>{product.interest_rate}% річних</strong></div>
          <div className="apply-info-row"><span>Сума:</span><strong>{product.min_amount.toLocaleString()} – {product.max_amount.toLocaleString()} грн</strong></div>
          <div className="apply-info-row"><span>Термін:</span><strong>{product.min_term} – {product.max_term} міс.</strong></div>
          {product.down_payment_pct > 0 && (
            <div className="apply-info-row"><span>Перший внесок:</span><strong>від {product.down_payment_pct}%</strong></div>
          )}
          {product.description && (
            <div className="apply-info-row"><span>Опис:</span><span>{product.description}</span></div>
          )}
        </div>
      )}

      {/* Максимальна сума */}
      {maxLoanInfo && (
        <div className="max-loan-box">
          <span>💡 Ваш максимальний щомісячний платіж:</span>
          <strong>{maxLoanInfo.max_monthly_payment.toLocaleString("uk-UA")} грн</strong>
          {maxAmount && term && (
            <span className="max-amount-hint">
              ≈ Макс. сума на {term} міс.: <strong>{maxAmount.toLocaleString("uk-UA")} грн</strong>
            </span>
          )}
        </div>
      )}

      <h3 className="apply-subtitle">Параметри кредиту</h3>

      <div className="apply-grid">
        <label>Сума (грн)</label>
        <input
          className={errors.amount ? "input-error" : ""}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          placeholder={product ? `${product.min_amount} – ${product.max_amount}` : ""}
        />

        <label>Перший внесок (грн)</label>
        <input
          value={downPayment}
          onChange={(e) => setDownPayment(e.target.value)}
          type="number"
          placeholder="0 (необов'язково)"
        />

        <label>Термін (місяців)</label>
        <input
          className={errors.term ? "input-error" : ""}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          type="number"
          placeholder={product ? `${product.min_term} – ${product.max_term}` : ""}
        />

        <label>Ціль кредиту</label>
        <input
          className={errors.purpose ? "input-error" : ""}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          type="text"
          placeholder="Наприклад: купівля авто"
        />
      </div>

      {/* Попередній розрахунок */}
      {monthlyPayment && (
        <div className="payment-preview-box">
          <div className="payment-preview-row">
            <span>Сума кредиту після внеску:</span>
            <strong>{(Number(amount) - Number(downPayment || 0)).toLocaleString("uk-UA")} грн</strong>
          </div>
          <div className="payment-preview-row highlight">
            <span>Щомісячний платіж:</span>
            <strong>{Number(monthlyPayment).toLocaleString("uk-UA")} грн</strong>
          </div>
          <div className="payment-preview-row">
            <span>Загальна сума виплат:</span>
            <strong>{(Number(monthlyPayment) * Number(term)).toLocaleString("uk-UA", { maximumFractionDigits: 2 })} грн</strong>
          </div>
          <div className="payment-preview-row">
            <span>Переплата:</span>
            <strong>
              {(Number(monthlyPayment) * Number(term) - (Number(amount) - Number(downPayment || 0))).toLocaleString("uk-UA", { maximumFractionDigits: 2 })} грн
            </strong>
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <div className="apply-btn-wrapper">
        <button className="apply-btn" onClick={submit} disabled={loading || !product}>
          {loading ? "Відправка…" : "Подати заявку"}
        </button>
      </div>
    </div>
  );
}
