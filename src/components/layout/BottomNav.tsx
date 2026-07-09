import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const icons = {
  home: (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <path d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  quotes: (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" strokeLinecap="round" />
    </svg>
  ),
  signed: (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <path d="M8 12.5 11 15.5 16 9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
};

export function BottomNav() {
  const { isAdmin } = useAuth();

  const items = [
    { to: '/', label: 'Home', icon: icons.home, end: true },
    { to: '/dashboard', label: 'Quotes', icon: icons.quotes },
    { to: '/signed-customers', label: 'Signed', icon: icons.signed },
    ...(isAdmin ? [{ to: '/admin', label: 'Settings', icon: icons.settings }] : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-base-800/70 glass px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 sm:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-accent-400' : 'text-base-400',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function SideNav() {
  const { isAdmin, appUser, signOut } = useAuth();

  const items = [
    { to: '/', label: 'Home', icon: icons.home, end: true },
    { to: '/dashboard', label: 'Quotes', icon: icons.quotes },
    { to: '/signed-customers', label: 'Signed Customers', icon: icons.signed },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Settings', icon: icons.settings }] : []),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-base-800/70 bg-base-900/50 px-4 py-6 sm:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-300 text-lg font-bold text-white">
          K
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-base-50">Kode31</p>
          <p className="text-[11px] text-base-400">Quote Studio</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-accent-500/15 text-accent-300' : 'text-base-300 hover:bg-base-800/70 hover:text-base-100',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-base-700 bg-base-850 px-3 py-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-base-700 text-xs font-semibold text-base-100">
          {appUser?.name?.slice(0, 1).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-base-100">{appUser?.name}</p>
          <p className="truncate text-[11px] capitalize text-base-400">{appUser?.role}</p>
        </div>
        <button
          onClick={() => void signOut()}
          aria-label="Sign out"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-base-400 transition-colors hover:bg-base-700 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
