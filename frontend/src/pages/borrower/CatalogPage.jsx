import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCreditProducts } from "../../api/backend";
import "./CatalogPage.css";

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCreditProducts().then((data) => {
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Завантаження…</p>;

  return (
    <div className="catalog-wrapper">
      <h2 className="catalog-title">Кредитні продукти</h2>

      {products.length === 0 && (
        <p className="catalog-empty">Наразі немає доступних кредитних продуктів.</p>
      )}

      <div className="catalog-grid">
        {products.map((p) => (
          <div key={p.product_id} className="product-card-item">
            <div className="product-card-header">
              <h3>{p.product_name}</h3>
              {p.target_group && (
                <span className="product-badge">{p.target_group}</span>
              )}
            </div>

            <p className="product-description">{p.description}</p>

            <div className="product-info-grid">
              <div className="product-info-row">
                <span>Відсоткова ставка</span>
                <strong>{p.interest_rate}% річних</strong>
              </div>
              <div className="product-info-row">
                <span>Сума</span>
                <strong>{p.min_amount.toLocaleString("uk-UA")} – {p.max_amount.toLocaleString("uk-UA")} грн</strong>
              </div>
              <div className="product-info-row">
                <span>Термін</span>
                <strong>{p.min_term} – {p.max_term} міс.</strong>
              </div>
              {p.down_payment_pct > 0 && (
                <div className="product-info-row">
                  <span>Перший внесок</span>
                  <strong>від {p.down_payment_pct}%</strong>
                </div>
              )}
            </div>

            <button
              className="product-apply-btn"
              onClick={() => navigate(`/borrower/apply?productId=${p.product_id}`)}
            >
              Подати заявку
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
