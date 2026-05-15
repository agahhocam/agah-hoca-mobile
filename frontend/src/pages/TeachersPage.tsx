import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { teachersApi, subjectsApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function TeachersPage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers", schoolId],
    queryFn: () => teachersApi.list(schoolId!),
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", schoolId],
    queryFn: () => subjectsApi.list(schoolId!),
    enabled: !!schoolId,
  });

  const addMut = useMutation({
    mutationFn: () => teachersApi.create(schoolId!, name, selectedSubjects),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers", schoolId] });
      setName("");
      setSelectedSubjects([]);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => teachersApi.delete(schoolId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers", schoolId] }),
  });

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;

  const subjectName = (id: string) => subjects.find((s: any) => s.id === id)?.name ?? id.slice(0, 8);

  const toggleSubject = (id: string) =>
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Öğretmenler</h1>

      <Card>
        <CardTitle>Yeni Öğretmen Ekle</CardTitle>
        <div className="flex gap-3 mb-4">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={() => addMut.mutate()} loading={addMut.isPending} disabled={!name.trim()}>
            Ekle
          </Button>
        </div>
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s: any) => (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  selectedSubjects.includes(s.id)
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-600 hover:border-primary"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Öğretmen Listesi ({teachers.length})</CardTitle>
        {teachers.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz öğretmen eklenmedi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Ad</th>
                <th className="pb-2">Branşlar</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t: any) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="py-2 text-gray-500">
                    {t.subject_ids.map((id: string) => subjectName(id)).join(", ") || "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Button variant="danger" onClick={() => deleteMut.mutate(t.id)}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
