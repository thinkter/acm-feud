import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AdminDashboard } from "./components/AdminDashboard";
import { GameBoard } from "./components/GameBoard";

const shellBaseClassName =
  "relative mx-auto min-h-screen w-full max-w-[1240px] px-4 pb-8 pt-3 text-[#fff5fb] sm:px-6 lg:px-8";
const shellByRoute = {
  board: `${shellBaseClassName} flex flex-col overflow-hidden`,
  admin: shellBaseClassName,
};

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full border px-4 py-3 text-sm font-semibold tracking-[0.08em] transition",
    isActive
      ? "border-pink-300/60 bg-pink-500/30 text-white shadow-[0_0_30px_rgba(255,78,164,0.22)]"
      : "border-white/10 bg-white/5 text-pink-100 hover:-translate-y-0.5 hover:border-pink-300/40 hover:bg-pink-500/15",
  ].join(" ");

export default function App() {
  const location = useLocation();
  const isBoardRoute = location.pathname === "/";
  const shellClassName = isBoardRoute ? shellByRoute.board : shellByRoute.admin;
  const headerClassName = isBoardRoute
    ? "mb-2 flex flex-wrap items-center justify-between gap-3"
    : "mb-3 flex flex-wrap items-center justify-between gap-4 md:mb-6";
  const titleClassName = isBoardRoute
    ? "text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
    : "text-3xl font-extrabold tracking-tight text-white sm:text-4xl";
  const navClassName = isBoardRoute ? "flex gap-2" : "flex gap-3";

  return (
    <div className={shellClassName}>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,62,151,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,145,203,0.12),transparent_22%)]" />
      <header className={headerClassName}>
        <div>
          <p className="mb-1 text-[0.68rem] uppercase tracking-[0.28em] text-pink-200/70">
            ACM Women's Day Edition
          </p>
          <h1 className={titleClassName}>Pink Feud Keyboard Edition</h1>
        </div>
        <nav className={navClassName} aria-label="Views">
          <NavLink className={navLinkClassName} to="/">
            Game Board
          </NavLink>
          <NavLink className={navLinkClassName} to="/admin">
            Admin
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<GameBoard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}
