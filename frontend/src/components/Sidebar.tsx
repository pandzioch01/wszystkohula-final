import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/calendar', label: 'Kalendarz', icon: '/calendar.svg' },
  { to: '/notifications', label: 'Powiadomienia', icon: '/notifications.svg' },
  { to: '/team', label: 'Zespół', icon: '/team.svg' },
  { to: '/storage', label: 'Magazyn', icon: '/storage.svg' },
  { to: '/settings', label: 'Ustawienia', icon: '/settings.svg' },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* Hamburger toggle — visible only on small screens */}
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded p-2 shadow-sm"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop — only on mobile when sidebar is open */}
      {open && (
        <div
          onClick={close}
          className="md:hidden fixed inset-0 bg-black/40 z-30"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40
          h-screen w-64 shrink-0
          bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* User profile */}
        <div className="p-4 border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-300 shrink-0" />
            <span className="text-lg">Użytkownik</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-2 py-3 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={close}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-full transition-colors duration-200 ${
                      isActive
                        ? 'bg-orange-400 text-white'
                        : 'text-gray-900 hover:bg-orange-100'
                    }`
                  }
                >
                  <img src={item.icon} alt="" className="w-6 h-6 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout — non-functional placeholder until auth lands */}
        <div className="px-2 py-3 border-t border-gray-200">
          <button
            type="button"
            className="flex items-center gap-3 px-4 py-2 w-full rounded-full transition-colors duration-200 text-gray-900 hover:bg-gray-100"
          >
            <img src="/logout.svg" alt="" className="w-6 h-6 shrink-0" />
            <span>Wyloguj się</span>
          </button>
        </div>
      </aside>
    </>
  );
}
