import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Banknote,
  BookOpen,
  School,
  LogOut,
  Menu,
  X,
  Calendar,
  ClipboardList,
  FileText,
  BookMarked,
  WifiOff,
  CheckCircle,
} from 'lucide-react';
import { getPendingCount } from '../../services/offlineDB';

const NAV_BY_ROLE = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/superadmin' },
    { label: 'Schools',   icon: School,          to: '/superadmin/schools' },
  ],
  school_admin: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/admin' },
    { label: 'Students',   icon: GraduationCap,   to: '/admin/students' },
    { label: 'Staff',      icon: Users,            to: '/admin/staff' },
    { label: 'Classes',    icon: School,           to: '/admin/classes' },
    { label: 'Subjects',   icon: BookMarked,       to: '/admin/subjects' },
    { label: 'Attendance', icon: ClipboardList,    to: '/admin/attendance' },
    { label: 'Timetable',  icon: Calendar,         to: '/admin/timetable' },
    { label: 'Reports',    icon: FileText,          to: '/admin/reports' },
    { label: 'Alumni',     icon: GraduationCap,    to: '/admin/alumni' },
    { label: 'Finance',    icon: Banknote,         to: '/admin/finance' },
    { label: 'Library',    icon: BookOpen,         to: '/admin/library' },
  ],
  teacher: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/teacher' },
    { label: 'Gradebook',  icon: FileText,         to: '/teacher/gradebook' },
    { label: 'Attendance', icon: ClipboardList,    to: '/teacher/attendance' },
    { label: 'My Classes', icon: Users,            to: '/teacher/classes' },
    { label: 'Timetable',  icon: Calendar,         to: '/teacher/timetable' },
  ],
  student: [
    { label: 'Dashboard',  icon: LayoutDashboard,  to: '/student' },
    { label: 'Timetable',  icon: Calendar,         to: '/student/timetable' },
    { label: 'Grades',     icon: FileText,          to: '/student/academic-records' },
    { label: 'Attendance', icon: ClipboardList,    to: '/student/attendance' },
    { label: 'Assignments', icon: BookOpen,        to: '/student/assignments' },
  ],
};

const ROLE_LABEL = {
  super_admin:  'Super Admin',
  school_admin: 'School Admin',
  teacher:      'Teacher',
  student:      'Student Portal',
};

export default function AdminLayout({ children, role }) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline,    setIsOnline]    = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[role] || [];

  useEffect(() => {
    const on  = () => { setIsOnline(true); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    // Poll pending count every 5s
    const interval = setInterval(() => {
      getPendingCount().then(setPendingCount).catch(() => {});
    }, 5000);
    getPendingCount().then(setPendingCount).catch(() => {});
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(interval);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-transparent text-[var(--text-strong)]">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 m-3 w-[278px] rounded-[28px] border border-[rgba(108,85,61,0.12)] bg-[rgba(255,255,255,0.82)] shadow-[0_18px_45px_rgba(48,33,20,0.10)] backdrop-blur-xl flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="border-b border-[rgba(108,85,61,0.12)] px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#0f766e,#d97706)] shadow-[0_14px_28px_rgba(15,118,110,0.18)]">
              <School className="h-6 w-6 text-white" strokeWidth={2.3}/>
            </div>
            <div>
              <p className="text-[1.3rem] font-extrabold leading-none tracking-[-0.05em] text-[var(--text-strong)]">Skoolstak</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">{ROLE_LABEL[role] || role}</p>
            </div>
          </div>
          <div className="rounded-[20px] border border-[rgba(108,85,61,0.10)] bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(217,119,6,0.10))] px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-soft)]">Workspace</p>
            <p className="mt-2 text-sm font-medium text-[var(--text-body)]">A more grounded, institutional interface for daily school operations.</p>
          </div>
          {/* Close button mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-5 top-5 ml-auto rounded-full p-1 text-[var(--text-soft)] transition-colors hover:bg-[rgba(108,85,61,0.08)] hover:text-[var(--text-strong)] lg:hidden"
          >
            <X className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length === 2}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,#1f2937,#111827)] text-white shadow-[0_12px_26px_rgba(17,24,39,0.18)]'
                    : 'text-[var(--text-body)] hover:bg-[rgba(108,85,61,0.08)] hover:text-[var(--text-strong)]'
                }`
              }
            >
              <div className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.08)] transition-colors group-hover:bg-[rgba(255,255,255,0.18)]">
                <Icon className="w-4 h-4" strokeWidth={2.3} size={18} />
              </div>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="mx-4 mb-4 mt-auto rounded-[22px] border border-[rgba(108,85,61,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-4">
          <div className="flex items-center gap-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#0f766e,#115e59)] shadow-[0_12px_24px_rgba(15,118,110,0.18)]">
              <span className="text-sm font-bold text-white uppercase">
                {profile?.first_name?.[0] || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading…'}
              </p>
              <p className="mt-1 truncate text-[11px] text-[var(--text-soft)]">{profile?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(108,85,61,0.14)] px-3 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:bg-[rgba(108,85,61,0.08)] active:scale-95"
          >
            <LogOut size={16} strokeWidth={2.5}/>
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-charcoal-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 mx-3 mt-3 flex items-center gap-3 rounded-[24px] border border-[rgba(108,85,61,0.10)] bg-[rgba(255,255,255,0.68)] px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full p-2 text-[var(--text-body)] transition-colors hover:bg-[rgba(108,85,61,0.08)] hover:text-[var(--text-strong)] lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">Live workspace</p>
            <p className="truncate text-sm text-[var(--text-body)]">Operational dashboard, records, reporting and offline sync</p>
          </div>

          {/* Offline / sync indicator */}
          {!isOnline ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <WifiOff size={13}/> Offline{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
            </div>
          ) : pendingCount > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <CheckCircle size={13}/> Syncing {pendingCount} items…
            </div>
          ) : null}

          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(217,119,6,0.18))]">
            <span className="text-sm font-semibold text-[var(--text-strong)]">
              {profile?.first_name?.[0] || '?'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
