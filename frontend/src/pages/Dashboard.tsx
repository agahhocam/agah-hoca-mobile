import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { schoolsApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function Dashboard() {
  const { schoolId, selectSchool } = useSchool();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["schools"],
    queryFn: schoolsApi.list,
  });

  const createMut = useMutation({
    mutationFn: () => schoolsApi.create(newName),
    onSuccess: (school) => {
      qc.invalidateQueries({ queryKey: ["schools"] });
      selectSchool(school.id);
      setNewName("");
    },
  });

  const selected = schools.find((s: any) => s.id === schoolId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <Card>
        <CardTitle>Okul Seç veya Oluştur</CardTitle>
        <div className="flex gap-3 mb-6">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Yeni okul adı…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!newName.trim()}>
            Okul Oluştur
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Yükleniyor…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schools.map((s: any) => (
              <button
                key={s.id}
                onClick={() => selectSchool(s.id)}
                className={`text-left border rounded-xl p-4 transition-all ${
                  s.id === schoolId
                    ? "border-primary bg-blue-50 ring-2 ring-primary"
                    : "border-gray-200 hover:border-primary hover:bg-gray-50"
                }`}
              >
                <p className="font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400 mt-1">{s.id.slice(0, 8)}…</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected && (
        <Card>
          <CardTitle>Aktif Okul: {selected.name}</CardTitle>
          <p className="text-sm text-gray-500">
            Sol menüden öğretmen, sınıf ve ders atamalarını yapın, ardından kısıtları
            tanımlayıp program oluşturun.
          </p>
        </Card>
      )}
    </div>
  );
}
