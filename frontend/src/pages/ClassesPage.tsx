import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { classesApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function ClassesPage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: () => classesApi.list(schoolId!),
    enabled: !!schoolId,
  });

  const addMut = useMutation({
    mutationFn: () => classesApi.create(schoolId!, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", schoolId] });
      setName("");
    },
  });

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sınıflar</h1>
      <Card>
        <CardTitle>Yeni Sınıf Ekle</CardTitle>
        <div className="flex gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Sınıf adı (örn: 9-A)"
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
        <CardTitle>Sınıf Listesi ({classes.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          {classes.map((c: any) => (
            <span key={c.id} className="bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
              {c.name}
            </span>
          ))}
          {classes.length === 0 && <p className="text-sm text-gray-400">Henüz sınıf eklenmedi.</p>}
        </div>
      </Card>
    </div>
  );
}
