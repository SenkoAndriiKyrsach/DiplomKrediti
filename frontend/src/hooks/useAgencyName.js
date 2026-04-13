import { useEffect, useState } from "react";
import { getSettings } from "../api/backend";

/**
 * Підтягує назву агенції з system_settings.
 * Використовується на сторінках входу та реєстрації.
 */
export function useAgencyName(fallback = "КредитБюро") {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    getSettings("general")
      .then((d) => {
        const row = (d.general || []).find((r) => r.key === "agency.name");
        if (row?.value?.trim()) setName(row.value.trim());
      })
      .catch(() => {}); // мовчки — показуємо fallback
  }, []);

  return name;
}
