import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNegotiation } from '../../context/NegotiationContext';
import { RoleBadge } from '../common/Badge';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationBell } from '../common/NotificationBell';
import { ConfirmationModal, Tooltip } from '../common/Modal';
import { formatCurrency } from '../../lib/utils';
import {
  Briefcase,
  Layers,
  FileText,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
  Shield,
  Menu,
  X,
  ExternalLink,
  FileCheck,
  Clock,
  Building2,
  TrendingUp,
  PlusCircle,
  FolderLock,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { currentUser, userRole, logout } = useAuth();
  const { negotiations } = useNegotiation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Close mobile nav when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  // Filter negotiations visible to current user (or all if admin)
  const userNegotiations = negotiations.filter(
    (n) =>
      userRole === 'admin' ||
      n.initiatorId === currentUser?.uid ||
      n.counterpartyId === currentUser?.uid
  );

  const activeRooms = userNegotiations.filter((n) => n.status !== 'closed');
  const completedRooms = userNegotiations.filter(
    (n) => n.status === 'agreement_reached' || n.status === 'accepted'
  );
  const totalPipelineValue = userNegotiations.reduce((acc, curr) => acc + curr.currentAmount, 0);

  const isAdmin = userRole === 'admin';

  const closeMobileNav = () => setMobileNavOpen(false);

  // Sidebar content — shared between desktop and mobile overlay
  const SidebarContent = () => (
    <div className="p-5 flex-1 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" onClick={closeMobileNav} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight block leading-tight">
              PactPoint
            </span>
            <span className="text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400 tracking-wider">
              Commercial Dealroom
            </span>
          </div>
        </Link>
        {/* Close button visible on mobile only */}
        <button
          onClick={closeMobileNav}
          className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Status Card */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-inner">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Organization
          </span>
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        </div>
        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{currentUser?.fullName}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{currentUser?.businessName}</div>
        {currentUser && <RoleBadge role={currentUser.role} />}
      </div>

      {/* Main Workspace Navigation */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          Workspace &amp; Projects
        </div>
        <nav className="space-y-1">
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            onClick={closeMobileNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              location.pathname === '/dashboard' || location.pathname === '/admin'
                ? 'bg-teal-600 dark:bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            {isAdmin ? 'Admin Operations' : 'Dealrooms & Pipeline'}
          </Link>

          <Link
            to="/dashboard"
            onClick={closeMobileNav}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-3">
              <FileCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Executed Contracts
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold">
              {completedRooms.length}
            </span>
          </Link>

          <Link
            to="/dashboard"
            onClick={closeMobileNav}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Audit Trail &amp; History
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/admin/users"
                onClick={closeMobileNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/admin/users'
                    ? 'bg-teal-600 dark:bg-teal-700 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                User &amp; Role Registry
              </Link>
              <Link
                to="/admin/analytics"
                onClick={closeMobileNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/admin/analytics'
                    ? 'bg-teal-600 dark:bg-teal-700 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Platform Deal Metrics
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Project Exposure Telemetry Widget */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Financial Telemetry</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">NGN (₦)</span>
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-white font-display">
          {formatCurrency(totalPipelineValue, 'NGN')}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
          <span>Active Deals: <strong className="text-slate-700 dark:text-slate-200">{activeRooms.length}</strong></span>
          <span>Signed: <strong className="text-teal-600 dark:text-teal-400">{completedRooms.length}</strong></span>
        </div>
      </div>

      {/* Active Dealrooms Direct Links */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          <span>Live Dealrooms</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
            {activeRooms.length}
          </span>
        </div>
        {activeRooms.length === 0 ? (
          <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
            No active bargaining rooms yet.
          </div>
        ) : (
          <div className="space-y-1">
            {activeRooms.slice(0, 4).map((neg) => (
              <Link
                key={neg.id}
                to={`/rooms/${neg.id}`}
                onClick={closeMobileNav}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  location.pathname === `/rooms/${neg.id}`
                    ? 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-300 border-l-2 border-teal-500 font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="truncate pr-2">{neg.subject}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick External Link */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Public Landing Page
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row">

      {/* ── MOBILE OVERLAY BACKDROP ────────────────────────────────────────── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      {/* Desktop: fixed sidebar column. Mobile: slide-in panel over content. */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300
          flex flex-col justify-between border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex md:flex-shrink-0
        `}
        aria-label="Sidebar navigation"
      >
        <SidebarContent />

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Shield className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400 flex-shrink-0" />
            <span className="truncate">Enterprise Security Protocol</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            Cryptographic Audit Records • 256-bit
          </div>
        </div>
      </aside>

      {/* ── MAIN APP CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 md:ml-0">
        {/* Dashboard Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger — shown only on mobile, min 44×44px touch target */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Workspace
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
                {currentUser?.businessName || 'Dealroom Desk'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Theme Toggle in Dashboard Navbar */}
            <Tooltip content="Switch between dark and light themes">
              <ThemeToggle />
            </Tooltip>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Sign Out Button */}
            <Tooltip content="Sign out of current workspace session">
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-rose-200 dark:hover:border-rose-800 transition-colors shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </Tooltip>
          </div>
        </header>

        <div className="flex-1">
          <Outlet />
        </div>
      </main>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          await logout();
          navigate('/');
        }}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your PactPoint session? Any unsaved counteroffer drafts in your current editor will need to be re-entered."
        confirmLabel="Sign Out"
        cancelLabel="Stay in Workspace"
        variant="danger"
      />
    </div>
  );
};
