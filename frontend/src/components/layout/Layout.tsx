import { Outlet, NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/teachers", label: "Öğretmenler", icon: "👩‍🏫" },
  { to: "/classes", label: "Sınıflar", icon: "🏫" },
  { to: "/subjects", label: "Dersler", icon: "📚" },
  { to: "/lessons", label: "Ders Atamaları", icon: "📋" },
  { to: "/constraints", label: "Kısıt Oluşturucu", icon: "⚙️" },
  { to: "/schedule", label: "Program Üret", icon: "🧩" },
  { to: "/timetable", label: "Görsel Program", icon: "📅" },
  { to: "/print", label: "Çıktı Al", icon: "🖨️" },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-primary text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-blue-700">
          {localStorage.getItem("school_logo") && (
            <img src={localStorage.getItem("school_logo")!} alt="logo" className="h-10 object-contain mb-2 rounded" />
          )}
          <h1 className="text-lg font-bold leading-tight">ADPYS</h1>
          <p className="text-xs text-blue-200 mt-0.5">Akıllı Ders Programı</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-blue-700 font-semibold" : "hover:bg-blue-600"
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-blue-300 border-t border-blue-700">
          v1.0.0 · SaaS Edition
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
