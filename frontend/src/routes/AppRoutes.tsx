import { Navigate, Route, Routes } from 'react-router-dom';
import Calendar from '../pages/Calendar';
import Login from '../pages/Login';
import Notifications from '../pages/Notifications';
import Register from '../pages/Register';
import Settings from '../pages/Settings';
import Storage from '../pages/Storage';
import Team from '../pages/Team';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/login" element={<Login />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/register" element={<Register />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/storage" element={<Storage />} />
      <Route path="/team" element={<Team />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
