import { useState, useEffect } from "react";

const STORAGE_KEY = "adpys_school_id";

export function useSchool() {
  const [schoolId, setSchoolId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const selectSchool = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setSchoolId(id);
  };

  const clearSchool = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSchoolId(null);
  };

  return { schoolId, selectSchool, clearSchool };
}
