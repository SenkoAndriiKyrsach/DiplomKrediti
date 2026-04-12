import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCreditProductById, createCreditProduct, updateCreditProduct } from "../../api/backend";
import "../manager/ManagerProductPage.css";

const EMPTY = {
  product_name: "", description: "", interest_rate: "",
  min_term: "", max_term: "", min_amount: "", max_amount: "",
  down_payment_pct: 0, target_group: "", is_active: true,
};

export default function AdminProductPage() {
  const { productId } = useParams();
  const isNew = !productId || productId === "new";
  const navigate = useNavigate();

  const [product, setProduct] = useState(isNew ? { ...EMPTY } : null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) getCreditProductById(Number(productId)).then((d) => d && setProduct(d));
  }, [productId]);

  const set = (field) => (e) => setProduct({ ...product, [field]: e.target.value });
  const setCheck = (field) => (e) => setProduct({ ...product, [field]: e.target.checked });

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const res = await createCreditProduct(product);
        alert("Продукт створено!");
        navigate(`/admin/product/${res.product_id}`);
      } else {
        await updateCreditProduct(product.product_id, product);
        alert("Продукт оновлено!");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!product) return <p>Завантаження…</p>;

  return (
    <div className="product-wrapper">
      <h1>{isNew ? "Новий кредитний продукт" : "Редагувати продукт"}</h1>

      <div className="product-card">
        <div className="form-group">
          <label>Назва *</label>
          <input className="form-input" value={product.product_name} onChange={set("product_name")} />
        </div>
        <div className="form-group">
          <label>Цільова група / тип</label>
          <input className="form-input" placeholder="Молодіжний, Бізнес, Авто…" value={product.target_group || ""} onChange={set("target_group")} />
        </div>
        <div className="form-group">
          <label>Опис</label>
          <textarea className="form-textarea" value={product.description} onChange={set("description")} />
        </div>
        <div className="form-group">
          <label>Відсоткова ставка (% річних) *</label>
          <input className="form-input" type="number" step="0.01" value={product.interest_rate} onChange={set("interest_rate")} />
        </div>
        <div className="row-2">
          <div className="form-group">
            <label>Мін. термін (міс) *</label>
            <input className="form-input" type="number" value={product.min_term} onChange={set("min_term")} />
          </div>
          <div className="form-group">
            <label>Макс. термін (міс) *</label>
            <input className="form-input" type="number" value={product.max_term} onChange={set("max_term")} />
          </div>
        </div>
        <div className="row-2">
          <div className="form-group">
            <label>Мін. сума (грн) *</label>
            <input className="form-input" type="number" value={product.min_amount} onChange={set("min_amount")} />
          </div>
          <div className="form-group">
            <label>Макс. сума (грн) *</label>
            <input className="form-input" type="number" value={product.max_amount} onChange={set("max_amount")} />
          </div>
        </div>
        <div className="form-group">
          <label>Мінімальний перший внесок (%)</label>
          <input className="form-input" type="number" min="0" max="100" step="0.1" placeholder="0 — без внеску" value={product.down_payment_pct} onChange={set("down_payment_pct")} />
        </div>
        {!isNew && (
          <div className="form-group form-check">
            <label>
              <input type="checkbox" checked={product.is_active} onChange={setCheck("is_active")} />
              &nbsp; Продукт активний
            </label>
          </div>
        )}
        <div className="btn-block">
          <button className="btn-back" onClick={() => navigate("/admin/products")}>Назад</button>
          <button className="btn success" onClick={save} disabled={saving}>
            {saving ? "Збереження…" : isNew ? "Створити" : "Оновити"}
          </button>
        </div>
      </div>
    </div>
  );
}
