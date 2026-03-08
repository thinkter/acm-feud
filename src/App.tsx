import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AdminDashboard } from "./components/AdminDashboard";
import { GameBoard } from "./components/GameBoard";

export default function App() {
  const location = useLocation();
  const shellClassName = location.pathname === "/" ? "shell board-shell" : "shell";

  return (
    <div className={shellClassName}>
      <header className="topbar">
        <div>
          <p className="eyebrow">ACM Women's Day Edition</p>
          <h1>Pink Feud Keyboard Edition</h1>
        </div>
        <nav className="tabs" aria-label="Views">
          <NavLink className={({ isActive }) => (isActive ? "tab active" : "tab")} to="/">
            Game Board
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "tab active" : "tab")} to="/admin">
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
