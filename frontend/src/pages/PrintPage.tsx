import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { schedulesApi, teachersApi, subjectsApi, classesApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

function useLogo() {
  const [logo, setLogoState] = useState<string>(() => localStorage.getItem("school_logo") ?? "");
  const setLogo = (val: string) => { localStorage.setItem("school_logo", val); setLogoState(val); };
  const clearLogo = () => { localStorage.removeItem("school_logo"); setLogoState(""); };
  return { logo, setLogo, clearLogo };
}

export default function PrintPage() {
  const { schoolId } = useSchool();
  const [tab, setTab] = useState<"teacher" | "class">("teacher");
  const [selectedId, setSelectedId] = useState("");
  const { logo, setLogo, clearLogo } = useLogo();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: exported } = useQuery({
    queryKey: ["schedule_export", schoolId],
    queryFn: () => schedulesApi.export(schoolId!),
    enabled: !!schoolId,
  });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers", schoolId], queryFn: () => teachersApi.list(schoolId!), enabled: !!schoolId });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects", schoolId], queryFn: () => subjectsApi.list(schoolId!), enabled: !!schoolId });
  const { data: classes = [] } = useQuery({ queryKey: ["classes", schoolId], queryFn: () => classesApi.list(schoolId!), enabled: !!schoolId });

  const resolve = (list: any[], id: string) => list.find((x) => x.id === id)?.name ?? "?";

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;
  if (!exported) return <p className="text-gray-400">Önce program oluşturun.</p>;

  // Tüm entry'leri düz listeye çevir
  const allEntries: any[] = [];
  DAYS.forEach((day) => {
    const dayData = exported.timetable[day] ?? {};
    Object.entries(dayData).forEach(([period, entries]: any) => {
      (entries as any[]).forEach((e) => {
        allEntries.push({ ...e, day, period: Number(period) });
      });
    });
  });

  const list = tab === "teacher" ? teachers : classes;
  const selected = list.find((x: any) => x.id === selectedId);

  const filtered = selectedId
    ? allEntries.filter((e) => tab === "teacher" ? e.teacher_id === selectedId : e.class_id === selectedId)
    : [];

  const maxPeriod = filtered.length > 0
    ? Math.max(...filtered.map((e) => e.period))
    : 8;
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const cellEntries = (day: string, period: number) =>
    filtered.filter((e) => e.day === day && e.period === period);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-bold">Çıktı Al</h1>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          {logo ? (
            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="h-8 object-contain rounded" />
              <button onClick={clearLogo} className="text-xs text-red-500 hover:underline">Logoyu Kaldır</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              + Logo Yükle
            </button>
          )}
        </div>
      </div>

      {/* Sekme seçici */}
      <div className="no-print flex gap-2 border-b">
        {(["teacher", "class"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedId(""); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t === "teacher" ? "👩‍🏫 Öğretmen Programı" : "🏫 Sınıf Programı"}
          </button>
        ))}
      </div>

      {/* Seçici */}
      <div className="no-print flex items-center gap-4">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{tab === "teacher" ? "Öğretmen seçin…" : "Sınıf seçin…"}</option>
          {list.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>

        {selectedId && (
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            🖨️ Yazdır / PDF
          </button>
        )}
      </div>

      {/* Yazdırılabilir tablo */}
      {selected && (
        <div id="print-area">
          {/* Başlık - yazdırmada görünür */}
          <div className="print-header flex items-center justify-between mb-4">
            {logo && <img src={logo} alt="logo" className="h-16 object-contain" />}
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold">
                {tab === "teacher" ? "Öğretmen Ders Programı" : "Sınıf Ders Programı"}
              </h2>
              <p className="text-lg font-semibold text-gray-700">{selected.name}</p>
            </div>
            {logo && <div className="h-16 w-16" />}
          </div>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-center w-16">Saat</th>
                {DAYS.map((d) => (
                  <th key={d} className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p}>
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold bg-gray-50">{p}.</td>
                  {DAYS.map((day) => {
                    const entries = cellEntries(day, p);
                    return (
                      <td key={day} className="border border-gray-300 px-2 py-2 text-center min-w-[100px]">
                        {entries.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          entries.map((e, i) => (
                            <div key={i} className="text-xs leading-tight">
                              <div className="font-semibold">{resolve(subjects, e.subject_id)}</div>
                              {tab === "teacher"
                                ? <div className="text-gray-600">{resolve(classes, e.class_id)}</div>
                                : <div className="text-gray-600">{resolve(teachers, e.teacher_id)}</div>
                              }
                            </div>
                          ))
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!selectedId && (
        <p className="text-gray-400 text-sm">
          {tab === "teacher" ? "Bir öğretmen" : "Bir sınıf"} seçin, programı görüntüleyin ve yazdırın.
        </p>
      )}
    </div>
  );
}
