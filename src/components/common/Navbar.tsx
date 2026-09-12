import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './Badge';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmationModal } from './Modal';
import {
  Briefcase,
  ChevronDown,
  User,
  LogOut,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboardView =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/rooms') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/agreement');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-teal-700 flex items-center justify-center text-teal-400 shadow-subtle group-hover:bg-teal-700 group-hover:text-white transition-all">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none group-hover:text-teal-800 dark:group-hover:text-teal-400 transition-colors">
                PactPoint
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-tight">
                Enterprise Dealrooms
              </span>
            </div>
          </Link>

          {/* Marketing Navigation Links (shown if not in dashboard) */}
          {!isDashboardView && (
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Legal & Security
              </a>
            </nav>
          )}

          {/* Right Action / Profile area */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-teal-700 text-teal-400 flex items-center justify-center font-bold text-[10px]">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white hidden sm:inline">
                    {currentUser.fullName}
                  </span>
                  <RoleBadge role={currentUser.role} className="scale-90" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{currentUser.fullName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.businessName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
                        className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Go to Workspace
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-1 mt-1 px-2">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowSignOutConfirm(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* If logged in and not in dashboard view, show direct workspace CTA */}
            {currentUser && !isDashboardView && (
              <Link
                to={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Workspace
                <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && !isDashboardView && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
          >
            How It Works
          </a>
          <a
            href="#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
          >
            Legal & Security
          </a>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your PactPoint session? Any unsaved changes in active negotiations may need to be reloaded."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        variant="danger"
      />
    </header>
  );
};
