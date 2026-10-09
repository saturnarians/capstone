import { useCallback, useEffect, useState } from 'react';
import HomePage from './homepage.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Dashboard from './dashboard.jsx';
import About from './about.jsx';
import { clearSession, getSession, setSession } from './api.js';

const validRoutes = new Set(['/', '/login', '/register', '/dashboard', '/about']);
const currentPath = () => validRoutes.has(window.location.pathname) ? window.location.pathname : '/';

export default function App() {
  const [path, setPath] = useState(currentPath);
  const [session, setCurrentSession] = useState(getSession());
  const navigate = useCallback((to) => { window.history.pushState({}, '', to); setPath(to); window.scrollTo(0, 0); }, []);
  const authenticate = useCallback((data, persistent) => { setSession(data, persistent); setCurrentSession(getSession()); navigate('/dashboard'); }, [navigate]);
  const logout = useCallback(() => { clearSession(); setCurrentSession(null); navigate('/'); }, [navigate]);
  useEffect(() => { const pop = () => setPath(currentPath()); const expired = () => { clearSession(); setCurrentSession(null); navigate('/login'); }; window.addEventListener('popstate', pop); window.addEventListener('auth:expired', expired); return () => { window.removeEventListener('popstate', pop); window.removeEventListener('auth:expired', expired); }; }, [navigate]);
  if (path === '/dashboard' && !session?.accessToken) return <Login onLogin={authenticate} onNavigate={navigate} />;
  if (path === '/login') return <Login onLogin={authenticate} onNavigate={navigate} />;
  if (path === '/register') return <Register onRegister={authenticate} onNavigate={navigate} />;
  if (path === '/about') return <About onNavigateToHome={() => navigate('/')} onNavigateToDashboard={() => navigate('/dashboard')} />;
  if (path === '/dashboard') return <Dashboard user={session.user} onLogout={logout} onNavigateToHome={() => navigate('/')} />;
  return <HomePage onNavigateToDashboard={() => navigate('/dashboard')} onNavigateToAbout={() => navigate('/about')} onNavigate={navigate} />;
}
