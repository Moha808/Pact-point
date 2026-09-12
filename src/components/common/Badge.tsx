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
