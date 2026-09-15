import React from 'react';
import { NegotiationStatus, UserRole } from '../../types';

interface StatusBadgeProps {
  status: NegotiationStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles: Record<NegotiationStatus, { bg: string; text: string; label: string; dot: string }> = {
    open: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      dot: 'bg-blue-500',
      label: 'Open for Offers',
    },
    countered: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500 animate-pulse',
      label: 'Counteroffer Pending',
    },
    accepted: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-500',
      label: 'Terms Accepted',
    },
    agreement_reached: {
      bg: 'bg-teal-50 border-teal-300 text-teal-900',
      dot: 'bg-teal-600',
      label: 'Agreement Reached',
    },
    rejected: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      dot: 'bg-rose-500',
      label: 'Declined / Rejected',
    },
    closed: {
      bg: 'bg-slate-100 border-slate-300 text-slate-700',
      dot: 'bg-slate-400',
      label: 'Closed Archive',
    },
  };

  const item = styles[status] || styles.open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole; className?: string }> = ({ role, className = '' }) => {
  const configs: Record<UserRole, { label: string; classes: string }> = {
    owner: {
      label: 'Business Owner',
      classes: 'bg-slate-900 text-slate-100 border-slate-700',
    },
    negotiator: {
      label: 'Certified Negotiator',
      classes: 'bg-teal-800 text-teal-100 border-teal-700',
    },
    admin: {
      label: 'Platform Admin',
      classes: 'bg-purple-900 text-purple-100 border-purple-800',
    },
    observer: {
      label: 'Observer / Party',
      classes: 'bg-slate-200 text-slate-800 border-slate-300',
    },
  };

  const c = configs[role] || configs.owner;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${c.classes} ${className}`}
    >
      {c.label}
    </span>
  );
};

export type ModalType = 'error' | 'success' | 'warning' | 'info';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'Understood',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              type === 'error' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' :
              type === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
              type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
              'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
            }`}>
              <span className="font-bold text-lg leading-none">
                {type === 'error' ? '✕' : type === 'warning' ? '⚠' : type === 'success' ? '✓' : 'ℹ'}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          {message}
        </p>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors ${
              type === 'error' ? 'bg-rose-600 hover:bg-rose-700 text-white' :
              type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
              type === 'success' ? 'bg-teal-700 hover:bg-teal-800 text-white' :
              'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
