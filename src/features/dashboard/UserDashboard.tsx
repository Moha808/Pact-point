import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { Tooltip } from '../../components/common/Modal';
import { CreateNegotiationModal } from '../negotiations/CreateNegotiationModal';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import {
  Briefcase,
  PlusCircle,
  Clock,
  ArrowRight,
  Building2,
  ChevronRight,
  ShieldCheck,
  Scale,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { negotiations } = useNegotiation();
  const { currentUser } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'agreements' | 'closed'>('all');

  const isOwner = currentUser?.role === 'owner';
  const isNegotiator = currentUser?.role === 'negotiator';
  const isAdmin = currentUser?.role === 'admin';

  const myNegotiations = negotiations.filter((n) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return n.initiatorId === currentUser.uid || n.counterpartyId === currentUser.uid;
  });

  const pendingActions = myNegotiations.filter((n) => {
    if (n.status !== 'countered' && n.status !== 'open') return false;
    return n.lastOfferBy && n.lastOfferBy !== currentUser?.uid;
  });

  const activeDeals = myNegotiations.filter(
    (n) => n.status === 'open' || n.status === 'countered'
  );

  const completedDeals = myNegotiations.filter(
    (n) => n.status === 'agreement_reached' || n.status === 'accepted'
  );

  const totalPipelineValue = myNegotiations.reduce((acc, curr) => acc + curr.currentAmount, 0);

  const filteredList = myNegotiations.filter((n) => {
    if (filterStatus === 'active') return n.status === 'open' || n.status === 'countered';
    if (filterStatus === 'agreements') return n.status === 'agreement_reached' || n.status === 'accepted';
    if (filterStatus === 'closed') return n.status === 'closed' || n.status === 'rejected';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isOwner ? 'Commercial Portfolio' : isNegotiator ? 'Tactical Bargaining Desk' : 'Dealroom Overview'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Initiate New Dealroom
          </button>
        </div>
      </div>

      {/* Role-Specific Layouts (Breaking the 4-card pattern) */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hero Metric - Asymmetric Strip */}
          <div className="lg:col-span-8 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between border border-slate-800 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 pointer-events-none" />
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-400" />
                   Principal Authority • {currentUser?.businessName}
                </div>
                <div className="text-sm text-slate-300 max-w-md">
                   You hold unilateral signing authority. Authorized contracts become binding upon execution.
                </div>
             </div>
             
             <div className="mt-8 relative z-10">
                <div className="text-slate-400 text-sm font-medium mb-1">Total Contracted Capital Exposure (₦)</div>
                <div className="text-4xl sm:text-5xl font-light tracking-tight">
                   {formatCurrency(totalPipelineValue, 'NGN').replace('₦', '')}
                </div>
             </div>

             <div className="mt-8 pt-5 border-t border-slate-700/50 flex flex-wrap gap-8 text-sm relative z-10">
                <div>
                   <span className="text-slate-400">Active Deals: </span>
                   <span className="font-bold text-white">{activeDeals.length}</span>
                </div>
                <div>
                   <span className="text-slate-400">Executed: </span>
                   <span className="font-bold text-emerald-400">{completedDeals.length}</span>
                </div>
             </div>
          </div>

          {/* Secondary Metrics Strip */}
          <div className="lg:col-span-4 flex flex-col gap-4">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-center transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex justify-between items-start">
                   <div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pending Approvals</div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingActions.length}</div>
                   </div>
                   <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                   </div>
                </div>
                {pendingActions.length > 0 && (
                   <div className="mt-4 text-xs font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Requires your signature
                   </div>
                )}
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                   <div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Agreements Reached</div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">{completedDeals.length}</div>
                   </div>
                   <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {isNegotiator && (
        <div className="flex flex-col gap-6">
           {/* Dominant Element: Action Required */}
           <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-6 sm:p-8 rounded-r-2xl shadow-sm relative overflow-hidden">
              <Scale className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10 dark:text-amber-500/5 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="text-xs font-bold text-amber-800/70 dark:text-amber-500/70 uppercase tracking-wider mb-2">
                   Tactical Advisor • {currentUser?.businessName}
                </div>
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                   {pendingActions.length > 0 ? (
                      <><AlertCircle className="w-6 h-6" /> Action Required ({pendingActions.length})</>
                   ) : (
                      <><CheckCircle2 className="w-6 h-6" /> Desk Clear</>
                   )}
                </h2>
                <p className="text-amber-800 dark:text-amber-400/80 mt-2 text-sm max-w-xl">
                   {pendingActions.length > 0 
                      ? "Counterparties have submitted updated terms. Review the delta and submit your counter or recommend formal acceptance."
                      : "There are no deals currently awaiting your response. You can initiate a new dealroom or wait for counterparty replies."}
                </p>
                
                <div className="mt-6 flex flex-wrap gap-3">
                   {pendingActions.map(p => (
                      <Link key={p.id} to={`/rooms/${p.id}`} className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium text-xs shadow-sm transition-colors">
                        Review Room #{p.id.slice(-4)}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                   ))}
                   {pendingActions.length === 0 && (
                      <span className="text-amber-700 dark:text-amber-500/70 italic text-sm font-medium">
                         Waiting on counterparties.
                      </span>
                   )}
                </div>
              </div>
           </div>

           {/* Secondary strip */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Active Tables</div>
                   <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeDeals.length}</div>
               </div>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pipeline Volume</div>
                   <div className="text-2xl font-bold text-slate-900 dark:text-white">₦ {formatCurrency(totalPipelineValue, 'NGN').replace('₦', '')}</div>
               </div>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Agreements Reached</div>
                   <div className="text-2xl font-bold text-slate-900 dark:text-white">{completedDeals.length}</div>
               </div>
           </div>
        </div>
      )}

      {isAdmin && (
         <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300 text-sm">Global platform oversight active. Please manage users and metrics from the Admin console sidebar link.</p>
         </div>
      )}

      {/* Negotiations Directory */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isOwner ? 'Commercial Mandates Directory' : isNegotiator ? 'Assigned Dealrooms & Pipeline' : 'Commercial Dealrooms'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing active negotiation records bound to {currentUser?.businessName}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({myNegotiations.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterStatus === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({activeDeals.length})
            </button>
            <button
              onClick={() => setFilterStatus('agreements')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterStatus === 'agreements'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Agreed ({completedDeals.length})
            </button>
          </div>
        </div>

        {/* List of Negotiation Rooms */}
        {filteredList.length === 0 ? (
          <div className="p-16 text-center bg-slate-50 dark:bg-slate-900/50">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm">
              {isOwner ? <ShieldCheck className="w-8 h-8" /> : <Scale className="w-8 h-8" />}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
               {isOwner ? 'No Commercial Mandates Found' : 'No Assigned Bargaining Tables'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              {isOwner
                ? 'Your organization has no active dealrooms matching this filter. Define your scope and invite a counterparty to begin a defensible paper trail.'
                : 'You have not been assigned to any dealrooms matching this filter. Coordinate with your Business Owner or wait for a counterparty response.'}
            </p>
            {isOwner && (
               <button
                 onClick={() => setCreateModalOpen(true)}
                 className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold shadow-sm transition-all"
               >
                 <PlusCircle className="w-4 h-4" />
                 Initiate Dealroom
               </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((neg) => {
              const isPendingMyTurn =
                (neg.status === 'open' || neg.status === 'countered') &&
                neg.lastOfferBy &&
                neg.lastOfferBy !== currentUser?.uid;

              return (
                <div
                  key={neg.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase">
                        #{neg.id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                        {neg.category}
                      </span>
                      <StatusBadge status={neg.status} />
                      {isPendingMyTurn && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                          Action Required
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/rooms/${neg.id}`}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors block truncate"
                    >
                      {neg.subject}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{neg.initiatorBusiness}</span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{neg.counterpartyBusiness}</span>
                      </span>
                      <span>•</span>
                      <span>{neg.totalRounds} {neg.totalRounds === 1 ? 'Round' : 'Rounds'}</span>
                      <span>•</span>
                      <span>Updated {formatRelativeTime(neg.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Right side Amount & Action CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Current Position</div>
                      <div className="text-lg font-bold text-slate-950 dark:text-white font-display tracking-tight">
                        {formatCurrency(neg.currentAmount, 'NGN')}
                      </div>
                    </div>

                    <Tooltip content="Enter this private dealroom to view offers, chat, and documents">
                      <Link
                        to={`/rooms/${neg.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors border border-slate-800 dark:border-slate-700"
                      >
                        Enter Room
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                      </Link>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateNegotiationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};
