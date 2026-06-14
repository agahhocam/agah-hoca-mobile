import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { schedulesApi } from "../api/client";
import { useSchool } from "../hooks/useSchool";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function SchedulePage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [timeLimit, setTimeLimit] = useState(60);
  const [lastResult, setLastResult] = useState<any>(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules", schoolId],
    queryFn: () => schedulesApi.list(schoolId!),
    enabled: !!schoolId,
  });

  const generateMut = useMutation({
    mutationFn: () => schedulesApi.generate(schoolId!, timeLimit),
    onSuccess: (data) => {
      setLastResult(data);
      qc.invalidateQueries({ queryKey: ["schedules", schoolId] });
    },
  });

  if (!schoolId) return <p className="text-gray-500">Önce bir okul seçin.</p>;

  const statusColor = (s: string) =>
    s === "OPTIMAL" ? "green" : s === "FEASIBLE" ? "blue" : "red";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Program Üret</h1>

      <Card>
        <CardTitle>Yeni Program Oluştur</CardTitle>
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Zaman Limiti (sn)</label>
            <input
              type="number" min={10} max={300}
              className="border rounded-lg px-3 py-2 text-sm w-32"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={() => generateMut.mutate()} loading={generateMut.isPending}>
          {generateMut.isPending ? "Optimize Ediliyor…" : "Program Üret (CP-SAT)"}
        </Button>

        {lastResult && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
            <div className="flex items-center gap-3 mb-2">
              <Badge label={lastResult.status} color={statusColor(lastResult.status)} />
              <span className="text-sm font-medium">
                Kalite Skoru: <strong>{lastResult.quality_score?.toFixed(1)}</strong>/100
              </span>
            </div>
            {lastResult.conflict_explanation && (
              <p className="text-sm text-red-600">{lastResult.conflict_explanation}</p>
            )}
            {lastResult.schedule_id && (
              <Button className="mt-3" variant="ghost" onClick={() => navigate("/timetable")}>
                Programı Görüntüle →
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Program Geçmişi</CardTitle>
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz program oluşturulmadı.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left"><th className="pb-2">Versiyon</th><th className="pb-2">Kalite</th><th className="pb-2">Tarih</th></tr></thead>
            <tbody>
              {schedules.map((s: any) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2">v{s.version}</td>
                  <td className="py-2">{s.quality_score?.toFixed(1)}/100</td>
                  <td className="py-2 text-gray-400">{new Date(s.created_at).toLocaleString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
