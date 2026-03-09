import { Route, Routes, useLocation } from "react-router-dom";
import { AdminDashboard } from "./components/AdminDashboard";
import { GameBoard } from "./components/GameBoard";

const shellBaseClassName =
  "relative mx-auto min-h-screen w-full max-w-[1240px] px-4 pb-8 pt-3 text-[#1a1a1a] sm:px-6 lg:px-8";
const shellByRoute = {
  board: `${shellBaseClassName} flex flex-col overflow-hidden`,
  admin: shellBaseClassName,
};

export default function App() {
  const location = useLocation();
  const isBoardRoute = location.pathname === "/";
  const shellClassName = isBoardRoute ? shellByRoute.board : shellByRoute.admin;

  return (
    <div className={shellClassName}>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.18),transparent_28%)]" />
      <Routes>
        <Route path="/" element={<GameBoard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}
