import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProductsManager, deactivateCreditProduct } from "../../api/backend";
import "./ManagerProductListPage.css";

export default function ManagerProductListPage() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const load = () =>
    getAllProductsManager().then((data) =>
      setProducts(Array.isArray(data) ? data : [])
    );

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Деактивувати продукт "${name}"?`)) return;
    await deactivateCreditProduct(id);
    await load();
  };

  return (
    <div className="prod-list-wrapper">
      <div className="prod-list-header">
        <h2>Кредитні продукти</h2>
        <button
          className="new-product-btn"
          onClick={() => navigate("/manager/product/new")}
        >
          + Новий продукт
        </button>
      </div>

      <table className="prod-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Назва</th>
            <th>Ставка</th>
            <th>Сума (грн)</th>
            <th>Термін (міс)</th>
            <th>Внесок %</th>
            <th>Статус</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.product_id} className={!p.is_active ? "row-inactive" : ""}>
              <td>{p.product_id}</td>
              <td>
                <div className="prod-name">{p.product_name}</div>
                {p.target_group && <div className="prod-target">{p.target_group}</div>}
              </td>
              <td>{p.interest_rate}%</td>
              <td>
                {p.min_amount.toLocaleString("uk-UA")} – {p.max_amount.toLocaleString("uk-UA")}
              </td>
              <td>{p.min_term} – {p.max_term}</td>
              <td>{p.down_payment_pct > 0 ? `${p.down_payment_pct}%` : "—"}</td>
              <td>
                {p.is_active
                  ? <span className="badge-active">Активний</span>
                  : <span className="badge-inactive">Неактивний</span>}
              </td>
              <td className="prod-actions">
                <button
                  className="edit-btn"
                  onClick={() => navigate(`/manager/product/${p.product_id}`)}
                >
                  Редагувати
                </button>
                {p.is_active && (
                  <button
                    className="deactivate-btn"
                    onClick={() => handleDeactivate(p.product_id, p.product_name)}
                  >
                    Деактивувати
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
