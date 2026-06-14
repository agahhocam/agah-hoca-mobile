import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { constraintsApi, teachersApi, classesApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const CONSTRAINT_LABELS: Record<string, string> = {
  teacher_unavailable: "Öğretmen Müsait Değil (Hard)",
  class_unavailable: "Sınıf Müsait Değil (Hard)",
  no_afternoon: "Öğleden Sonra Boş (Soft)",
  no_first_period: "İlk Saat Boş (Soft)",
  consecutive_preferred: "Ardışık Ders Tercihi (Soft)",
  day_preference: "Gün Tercihi (Soft)",
};

export default function ConstraintBuilderPage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [type, setType] = useState("no_afternoon");
  const [targetId, setTargetId] = useState("");
  const [weight, setWeight] = useState(5);

  const { data: constraints = [] } = useQuery({
    queryKey: ["constraints", schoolId],
    queryFn: () => constraintsApi.list(schoolId!),
    enabled: !!schoolId,
  });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers", schoolId], queryFn: () => teachersApi.list(schoolId!), enabled: !!schoolId });
  const { data: classes = [] } = useQuery({ queryKey: ["classes", schoolId], queryFn: () => classesApi.list(schoolId!), enabled: !!schoolId });

  const addMut = useMutation({
    mutationFn: () =>
      constraintsApi.create(schoolId!, {
        type,
        target_id: targetId || undefined,
        parameters: {},
        weight,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["constraints", schoolId] });
      setTargetId("");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => constraintsApi.delete(schoolId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["constraints", schoolId] }),
  });

  const isHard = type.includes("unavailable");
  const needsTarget = type.includes("teacher") || type.includes("class");

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;

  const targetOptions = type.includes("teacher") ? teachers : classes;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kısıt Oluşturucu</h1>

      <Card>
        <CardTitle>Yeni Kısıt</CardTitle>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Kısıt Türü</label>
            <select className="border rounded-lg px-3 py-2 text-sm w-full" value={type} onChange={(e) => { setType(e.target.value); setTargetId(""); }}>
              {Object.entries(CONSTRAINT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {needsTarget && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {type.includes("teacher") ? "Öğretmen" : "Sınıf"}
              </label>
              <select className="border rounded-lg px-3 py-2 text-sm w-full" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">Tümü (varsa)</option>
                {targetOptions.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
          )}

          {!isHard && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ağırlık (1–10)</label>
              <input type="range" min={1} max={10} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full" />
              <span className="text-xs text-gray-500">{weight}</span>
            </div>
          )}
        </div>

        <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>
          Kısıt Ekle
        </Button>
      </Card>

      <Card>
        <CardTitle>Aktif Kısıtlar ({constraints.length})</CardTitle>
        {constraints.length === 0 ? (
          <p className="text-sm text-gray-400">Kısıt tanımlanmamış.</p>
        ) : (
          <div className="space-y-2">
            {constraints.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between border rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <Badge label={c.weight === 0 ? "HARD" : `SOFT w=${c.weight}`} color={c.weight === 0 ? "red" : "blue"} />
                  <span className="text-sm font-medium">{CONSTRAINT_LABELS[c.type] ?? c.type}</span>
                </div>
                <Button variant="ghost" onClick={() => deleteMut.mutate(c.id)}>Kaldır</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
