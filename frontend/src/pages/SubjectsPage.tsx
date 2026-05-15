import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { subjectsApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function SubjectsPage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", schoolId],
    queryFn: () => subjectsApi.list(schoolId!),
    enabled: !!schoolId,
  });

  const addMut = useMutation({
    mutationFn: () => subjectsApi.create(schoolId!, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects", schoolId] });
      setName("");
    },
  });

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dersler</h1>
      <Card>
        <CardTitle>Yeni Ders Ekle</CardTitle>
        <div className="flex gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Ders adı (örn: Matematik)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && addMut.mutate()}
          />
          <Button onClick={() => addMut.mutate()} loading={addMut.isPending} disabled={!name.trim()}>
            Ekle
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Dersler ({subjects.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s: any) => (
            <span key={s.id} className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
              {s.name}
            </span>
          ))}
          {subjects.length === 0 && <p className="text-sm text-gray-400">Henüz ders eklenmedi.</p>}
        </div>
      </Card>
    </div>
  );
}
