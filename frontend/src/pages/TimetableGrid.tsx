import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { schedulesApi, teachersApi, subjectsApi, classesApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

export default function TimetableGrid() {
  const { schoolId } = useSchool();

  const { data: exported, isLoading, error } = useQuery({
    queryKey: ["schedule_export", schoolId],
    queryFn: () => schedulesApi.export(schoolId!),
    enabled: !!schoolId,
  });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers", schoolId], queryFn: () => teachersApi.list(schoolId!), enabled: !!schoolId });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects", schoolId], queryFn: () => subjectsApi.list(schoolId!), enabled: !!schoolId });
  const { data: classes = [] } = useQuery({ queryKey: ["classes", schoolId], queryFn: () => classesApi.list(schoolId!), enabled: !!schoolId });

  const teacherMap = useMemo(() => new Map<string, string>(teachers.map((t: any) => [t.id, t.name])), [teachers]);
  const subjectMap = useMemo(() => new Map<string, string>(subjects.map((s: any) => [s.id, s.name])), [subjects]);
  const classMap = useMemo(() => new Map<string, string>(classes.map((c: any) => [c.id, c.name])), [classes]);

  const resolve = (map: Map<string, string>, id: string, fallback = "?") =>
    map.get(id) ?? fallback;

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;
  if (isLoading) return <p className="text-gray-400">Program yükleniyor…</p>;
  if (error || !exported) return <p className="text-red-500">Program bulunamadı. Önce program oluşturun.</p>;

  const maxPeriod = Math.max(
    ...DAYS.flatMap((d) => Object.keys(exported.timetable[d] ?? {}).map(Number))
  );
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const BG_COLORS = [
    "bg-blue-50 border-blue-200 text-blue-900",
    "bg-green-50 border-green-200 text-green-900",
    "bg-yellow-50 border-yellow-200 text-yellow-900",
    "bg-purple-50 border-purple-200 text-purple-900",
    "bg-pink-50 border-pink-200 text-pink-900",
  ];

  const subjectColorMap: Record<string, string> = {};
  subjects.forEach((s: any, i: number) => {
    subjectColorMap[s.id] = BG_COLORS[i % BG_COLORS.length];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Görsel Ders Programı</h1>
        <div className="text-sm text-gray-500">
          v{exported.version} · Kalite: <strong>{exported.quality_score?.toFixed(1)}</strong>/100
        </div>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 w-16">Saat</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-500 bg-gray-50">
                  {p}.
                </td>
                {DAYS.map((day) => {
                  const entries: any[] = exported.timetable[day]?.[p] ?? [];
                  return (
                    <td key={day} className="border border-gray-200 px-2 py-1 align-top min-w-[120px]">
                      {entries.length === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <div className="space-y-1">
                          {entries.map((e: any, idx: number) => (
                            <div
                              key={idx}
                              className={`border rounded px-2 py-1 text-xs ${subjectColorMap[e.subject_id] ?? "bg-gray-50 border-gray-200"}`}
                            >
                              <div className="font-semibold">{resolve(subjectMap, e.subject_id)}</div>
                              <div className="opacity-75">{resolve(classMap, e.class_id)}</div>
                              <div className="opacity-60">{resolve(teacherMap, e.teacher_id)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Renk Açıklaması</CardTitle>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s: any) => (
            <span key={s.id} className={`border rounded-full px-3 py-1 text-xs ${subjectColorMap[s.id] ?? "bg-gray-50"}`}>
              {s.name}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
