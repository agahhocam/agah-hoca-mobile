import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { lessonsApi, classesApi, subjectsApi, teachersApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function LessonsPage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [form, setForm] = useState({ class_id: "", subject_id: "", teacher_id: "", weekly_hours: 2 });

  const { data: lessons = [] } = useQuery({ queryKey: ["lessons", schoolId], queryFn: () => lessonsApi.list(schoolId!), enabled: !!schoolId });
  const { data: classes = [] } = useQuery({ queryKey: ["classes", schoolId], queryFn: () => classesApi.list(schoolId!), enabled: !!schoolId });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects", schoolId], queryFn: () => subjectsApi.list(schoolId!), enabled: !!schoolId });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers", schoolId], queryFn: () => teachersApi.list(schoolId!), enabled: !!schoolId });

  const addMut = useMutation({
    mutationFn: () => lessonsApi.create(schoolId!, { ...form, weekly_hours: Number(form.weekly_hours) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", schoolId] });
      setForm({ class_id: "", subject_id: "", teacher_id: "", weekly_hours: 2 });
    },
  });

  const resolve = (list: any[], id: string) => list.find((x) => x.id === id)?.name ?? id.slice(0, 8);
  const isValid = form.class_id && form.subject_id && form.teacher_id && form.weekly_hours > 0;

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ders Atamaları</h1>

      <Card>
        <CardTitle>Yeni Ders Ataması</CardTitle>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
            <option value="">Sınıf seç…</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">Ders seç…</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">Öğretmen seç…</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input
            type="number" min={1} max={40}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Haftalık saat"
            value={form.weekly_hours}
            onChange={(e) => setForm({ ...form, weekly_hours: Number(e.target.value) })}
          />
        </div>
        <Button onClick={() => addMut.mutate()} loading={addMut.isPending} disabled={!isValid}>
          Atama Ekle
        </Button>
      </Card>

      <Card>
        <CardTitle>Atamalar ({lessons.length})</CardTitle>
        {lessons.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz atama yapılmadı.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left"><th className="pb-2">Sınıf</th><th className="pb-2">Ders</th><th className="pb-2">Öğretmen</th><th className="pb-2 text-center">Haftalık Saat</th></tr></thead>
            <tbody>
              {lessons.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2">{resolve(classes, l.class_id)}</td>
                  <td className="py-2">{resolve(subjects, l.subject_id)}</td>
                  <td className="py-2">{resolve(teachers, l.teacher_id)}</td>
                  <td className="py-2 text-center">{l.weekly_hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
