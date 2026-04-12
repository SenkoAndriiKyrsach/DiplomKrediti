import "./CreditProductCard.css";

export default function CreditProductCard({
  product,
  setProduct,
  onSave,
  saving = false,
  readOnly = false,
  children,        // ← ДОДАЛИ
}) {
  if (!product) return <p>Завантаження…</p>;

  const update = (field, value) => {
    if (readOnly) return;
    setProduct({ ...product, [field]: value });
  };

  /* === READ ONLY MODE → CARD VIEW === */
  if (readOnly) {
    return (
      <div className="card">
        <div className="row">
          <span>Назва</span>
          <strong>{product.product_name}</strong>
        </div>

        <div className="row">
          <span>Опис</span>
          <strong>{product.description}</strong>
        </div>

        <div className="row">
          <span>Відсоткова ставка (%)</span>
          <strong>{product.interest_rate}</strong>
        </div>

        <div className="row">
          <span>Мін. термін (міс)</span>
          <strong>{product.min_term}</strong>
        </div>

        <div className="row">
          <span>Макс. термін (міс)</span>
          <strong>{product.max_term}</strong>
        </div>

        <div className="row">
          <span>Мін. сума</span>
          <strong>{product.min_amount}</strong>
        </div>

        <div className="row">
          <span>Макс. сума</span>
          <strong>{product.max_amount}</strong>
        </div>
      </div>
    );
  }

  /* === EDITABLE MODE → FORM === */
  return (
    <div className="product-card">

      <div className="form-group">
        <label>Назва</label>
        <input
          className="form-input"
          value={product.product_name}
          onChange={(e) => update("product_name", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Опис</label>
        <textarea
          className="form-textarea"
          value={product.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Відсоткова ставка (%)</label>
        <input
          className="form-input"
          type="number"
          value={product.interest_rate}
          onChange={(e) => update("interest_rate", e.target.value)}
        />
      </div>

      <div className="row-2">
        <div className="form-group">
          <label>Мін. термін (міс)</label>
          <input
            className="form-input"
            type="number"
            value={product.min_term}
            onChange={(e) => update("min_term", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Макс. термін (міс)</label>
          <input
            className="form-input"
            type="number"
            value={product.max_term}
            onChange={(e) => update("max_term", e.target.value)}
          />
        </div>
      </div>

      <div className="row-2">
        <div className="form-group">
          <label>Мін. сума</label>
          <input
            className="form-input"
            type="number"
            value={product.min_amount}
            onChange={(e) => update("min_amount", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Макс. сума</label>
          <input
            className="form-input"
            type="number"
            value={product.max_amount}
            onChange={(e) => update("max_amount", e.target.value)}
          />
        </div>
      </div>

      <div className="btn-block">
        {children}
        <button className="btn success" onClick={onSave} disabled={saving}>
          {saving ? "Оновлення…" : "Оновити"}
        </button>


      </div>

    </div>
  );
}
