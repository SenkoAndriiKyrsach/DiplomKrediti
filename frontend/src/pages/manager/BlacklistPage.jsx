import { useEffect, useState } from "react";
import {
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  searchCustomersForBlacklist,
} from "../../api/backend";
import "./BlacklistPage.css";

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [reason, setReason] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => getBlacklist().then((d) => setBlacklist(d.blacklist || []));

  useEffect(() => { load(); }, []);

  const handleSearch = async (q) => {
    setSearchQ(q);
    setSelectedCustomer(null);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const data = await searchCustomersForBlacklist(q);
    setSearchResults(data.customers || []);
  };

  const handleAdd = async () => {
    if (!selectedCustomer) { alert("Оберіть клієнта"); return; }
    if (!reason.trim()) { alert("Вкажіть причину"); return; }

    setLoading(true);
    await addToBlacklist(selectedCustomer.customer_id, reason);
    setReason("");
    setSearchQ("");
    setSearchResults([]);
    setSelectedCustomer(null);
    await load();
    setLoading(false);
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Видалити зі списку?")) return;
    await removeFromBlacklist(id);
    await load();
  };

  return (
    <div className="blacklist-wrapper">
      <h2 className="blacklist-title">Чорний список</h2>

      {/* Додати в чорний список */}
      <div className="blacklist-add-card">
        <h3>Додати клієнта</h3>

        <div className="blacklist-search">
          <input
            type="text"
            placeholder="Пошук по ПІБ або логіну…"
            value={searchQ}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((c) => (
                <div
                  key={c.customer_id}
                  className={`search-item ${selectedCustomer?.customer_id === c.customer_id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setSearchQ(`${c.full_name} (${c.login})`);
                    setSearchResults([]);
                  }}
                >
                  <strong>{c.full_name}</strong>
                  <span> · {c.login} · ID: {c.customer_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="selected-customer">
            Обрано: <strong>{selectedCustomer.full_name}</strong> ({selectedCustomer.login})
          </div>
        )}

        <textarea
          className="reason-input"
          placeholder="Причина внесення до чорного списку…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />

        <button
          className="blacklist-btn add"
          onClick={handleAdd}
          disabled={loading || !selectedCustomer || !reason.trim()}
        >
          {loading ? "Збереження…" : "Додати до чорного списку"}
        </button>
      </div>

      {/* Таблиця */}
      <div className="blacklist-table-wrapper">
        <h3>Зараз у чорному списку ({blacklist.length})</h3>

        {blacklist.length === 0 && (
          <p className="empty-text">Чорний список порожній.</p>
        )}

        {blacklist.length > 0 && (
          <table className="bl-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ПІБ</th>
                <th>Логін</th>
                <th>Причина</th>
                <th>Додано</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              {blacklist.map((item) => (
                <tr key={item.blacklist_id}>
                  <td>{item.customer_id}</td>
                  <td>{item.full_name}</td>
                  <td>{item.login}</td>
                  <td className="reason-cell">{item.reason}</td>
                  <td>{new Date(item.added_at).toLocaleDateString("uk-UA")}</td>
                  <td>
                    <button
                      className="blacklist-btn remove"
                      onClick={() => handleRemove(item.blacklist_id)}
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
