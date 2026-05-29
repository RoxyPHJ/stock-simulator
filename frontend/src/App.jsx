import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Market       from './pages/Market';
import Transactions from './pages/Transactions';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"        element={<Login />} />
        <Route path="/"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/market"       element={<PrivateRoute><Market /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
