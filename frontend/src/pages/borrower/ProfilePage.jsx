import { useEffect, useState } from "react";
import {
  getCustomerProfile,
  updateCustomerProfile,
  getCitizenships,
  getEmploymentTypes
} from "../../api/backend";
import "./ProfilePage.css"; // стилі тут

export default function ProfilePage({ customerId }) {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [citizenships, setCitizenships] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await getCustomerProfile(customerId);
    const c = await getCitizenships();
    const e = await getEmploymentTypes();

    setProfile(p);
    setOriginalProfile(p);
    setCitizenships(c);
    setEmploymentTypes(e);
  };

  const hasChanges = () => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  };

  const save = async () => {
    await updateCustomerProfile(customerId, profile);
    alert("Збережено");
    setOriginalProfile(profile);
  };

  if (!profile) return <p>Завантаження...</p>;

  return (
    <div className="profile-wrapper">

      <h2 className="profile-title">Профіль</h2>

      <div className="profile-grid">

        <label>Login</label>
        <input value={profile.login} disabled className="disabled-input" />

        <label>Повне імʼя</label>
        <input
          value={profile.full_name || ""}
          onChange={(e) =>
            setProfile({ ...profile, full_name: e.target.value })
          }
        />

        <label>Дата народження</label>
        <input
          type="date"
          value={profile.birth_date || ""}
          onChange={(e) =>
            setProfile({ ...profile, birth_date: e.target.value })
          }
        />

        <label>Громадянство</label>
        <select
          value={profile.citizenship || ""}
          onChange={(e) =>
            setProfile({ ...profile, citizenship: e.target.value })
          }
        >
          <option value="">Оберіть</option>
          {citizenships.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Місячний дохід</label>
        <input
          value={profile.monthly_income || ""}
          onChange={(e) =>
            setProfile({ ...profile, monthly_income: e.target.value })
          }
        />

        <label>Тип зайнятості</label>
        <select
          value={profile.employment_type_id || ""}
          onChange={(e) =>
            setProfile({ ...profile, employment_type_id: e.target.value })
          }
        >
          <option value="">Оберіть</option>
          {employmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <label>Стаж роботи</label>
        <input
          value={profile.employment_term_months || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              employment_term_months: e.target.value
            })
          }
        />
      </div>

      {/* Кнопка справа */}
      <div className="save-btn-wrapper">
        <button
          onClick={save}
          disabled={!hasChanges()}
          className={`save-btn ${hasChanges() ? "active" : "inactive"}`}
        >
          Зберегти
        </button>
      </div>
    </div>
  );
}
