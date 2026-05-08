import { useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import AppRoutes from './routes/AppRoutes';

const AUTH_PATHS = ['/login', '/register'];

function App() {
  const { pathname } = useLocation();
  const showSidebar = !AUTH_PATHS.includes(pathname);

  if (!showSidebar) {
    return <AppRoutes />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;