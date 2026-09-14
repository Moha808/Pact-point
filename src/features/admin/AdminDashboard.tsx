import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNegotiation } from '../../context/NegotiationContext';
import { StatusBadge } from '../../components/common/Badge';
import { UserProfile, UserRole, NegotiationStatus } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Users,
  Layers,
  FileCheck,
  TrendingUp,
  Search,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { registeredUsers } = useAuth();
  const { negotiations } = useNegotiation();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Determine active tab from URL path
  const activeTab = location.pathname.includes('/users')
    ? 'users'
    : location.pathname.includes('/analytics')
    ? 'analytics'
    : 'overview';

  // Metrics
  const totalUsers = registeredUsers.length;
  const totalNegotiations = negotiations.length;
  const activeNegotiations = negotiations.filter(
    (n) => n.status === 'open' || n.status === 'countered'
  );
  const completedNegotiations = negotiations.filter(
    (n) => n.status === 'agreement_reached' || n.status === 'accepted'
  );
  const flaggedNegotiations = negotiations.filter((n) => n.isFlagged);
  const totalDealValue = negotiations.reduce((sum, n) => sum + (n.currentAmount || 0), 0);

  const agreementRate = totalNegotiations > 0
    ? Math.round((completedNegotiations.length / totalNegotiations) * 100)
    : 0;

  // Analytics datasets for Recharts
  const monthlyVolumeData = [
    { month: 'Apr', negotiations: 4, agreements: 2 },
    { month: 'May', negotiations: 6, agreements: 4 },
    { month: 'Jun', negotiations: 8, agreements: 5 },
    { month: 'Jul', negotiations: 11, agreements: 8 },
    { month: 'Aug', negotiations: 14, agreements: 10 },
    { month: 'Sep', negotiations: Math.max(totalNegotiations, 18), agreements: Math.max(completedNegotiations.length, 13) },
  ];

  const conversionTrendData = [
    { month: 'Apr', rate: 50 },
    { month: 'May', rate: 67 },
    { month: 'Jun', rate: 63 },
    { month: 'Jul', rate: 73 },
    { month: 'Aug', rate: 71 },
    { month: 'Sep', rate: agreementRate || 72 },
  ];

  const userRoleData = [
    { name: 'Business Owners', value: registeredUsers.filter(u => u.role === 'owner').length, color: '#1e40af' },
    { name: 'Negotiators', value: registeredUsers.filter(u => u.role === 'negotiator').length, color: '#0d9488' },
    { name: 'Admins', value: registeredUsers.filter(u => u.role === 'admin').length, color: '#7c3aed' },
    { name: 'Observers', value: registeredUsers.filter(u => u.role === 'observer').length, color: '#64748b' },
  ].filter(d => d.value > 0);

  const statusDistribution = [
    { name: 'Active / Open', value: activeNegotiations.length, color: '#0d9488' },
    { name: 'Agreed', value: completedNegotiations.length, color: '#059669' },
    { name: 'Closed / Inactive', value: totalNegotiations - activeNegotiations.length - completedNegotiations.length, color: '#64748b' },
  ];

  const filteredUsers = registeredUsers.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), { role: newRole });
    } catch (e) {
      console.error('Failed to update role', e);
    }
  };

  const handleStatusToggle = async (targetUser: UserProfile) => {
    if (!db) return;
    try {
      const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
      await updateDoc(doc(db, 'users', targetUser.uid), { status: newStatus });
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global governance, risk monitoring, user management, and macro deal telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Daemons Operational</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        {[
          { label: 'Overview', path: '/admin', key: 'overview', icon: <Layers className="w-3.5 h-3.5" /> },
          { label: 'User Registry', path: '/admin/users', key: 'users', icon: <Users className="w-3.5 h-3.5" /> },
          { label: 'Platform Analytics', path: '/admin/analytics', key: 'analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <Link key={tab.key} to={tab.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && <>

      {/* Asymmetric Metric Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Metric - Agreement Conversion */}
        <div className="lg:col-span-8 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between border border-slate-800 relative overflow-hidden">
           <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
           
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-400" />
                 Platform Health Indicator
              </div>
           </div>
           
           <div className="mt-8 relative z-10 flex items-end gap-6">
              <div>
                 <div className="text-slate-400 text-sm font-medium mb-1">Global Agreement Conversion Rate</div>
                 <div className="text-5xl sm:text-6xl font-light tracking-tight text-white">
                    {agreementRate}%
                 </div>
              </div>
              <div className="pb-2 text-emerald-400 text-sm font-bold flex items-center gap-1">
                 <TrendingUp className="w-4 h-4" /> +12% MoM
              </div>
           </div>

           <div className="mt-10 pt-5 border-t border-slate-700/50 flex flex-wrap gap-12 text-sm relative z-10">
              <div>
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Dealrooms</div>
                 <span className="font-bold text-white text-xl">{totalNegotiations}</span>
              </div>
              <div>
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Actively Bargaining</div>
                 <span className="font-bold text-teal-400 text-xl">{activeNegotiations.length}</span>
              </div>
              <div>
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Successfully Closed</div>
                 <span className="font-bold text-emerald-400 text-xl">{completedNegotiations.length}</span>
              </div>
           </div>
        </div>

        {/* Secondary Metrics Strip */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start">
                 <div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Registered Users</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsers}</div>
                 </div>
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
              <div className="flex justify-between items-start">
                 <div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Risk Flagged Dealrooms</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{flaggedNegotiations.length}</div>
                 </div>
                 <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Global Negotiation Oversight Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform-Wide Deal Oversight</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Audit log of all active and finalized negotiations across all tenants
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {negotiations.length} Records Total
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {negotiations.map((neg) => (
            <div
              key={neg.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{neg.id.slice(-8)}</span>
                  <StatusBadge status={neg.status} />
                  {neg.isFlagged && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      Risk Flagged
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{neg.subject}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{neg.initiatorBusiness}</span>
                  <span className="text-slate-400">↔</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{neg.counterpartyBusiness}</span>
                  <span>•</span>
                  <span>{neg.totalRounds} Rounds</span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Value</div>
                  <div className="text-lg font-bold text-slate-950 dark:text-white font-display">
                    {formatCurrency(neg.currentAmount, neg.currency)}
                  </div>
                </div>
                <Link
                  to={`/rooms/${neg.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors border border-slate-800 dark:border-slate-700"
                >
                  Audit Room
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          ))}
          {negotiations.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              No dealrooms have been created on the platform yet.
            </div>
          )}
        </div>
      </div>
      </>}

      {/* ── PLATFORM ANALYTICS TAB ── */}
      {activeTab === 'analytics' && <div className="space-y-6">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Deal Volume', value: formatCurrency(totalDealValue, 'NGN'), icon: <Activity className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Agreement Rate', value: `${agreementRate}%`, icon: <FileCheck className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Avg. Rounds / Deal', value: totalNegotiations > 0 ? (negotiations.reduce((s,n) => s + n.totalRounds, 0) / totalNegotiations).toFixed(1) : '0', icon: <TrendingUp className="w-5 h-5 text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
            { label: 'Risk Flagged', value: String(flaggedNegotiations.length), icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50 dark:bg-rose-900/20' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-3`}>{kpi.icon}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

      {/* Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Volume Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Negotiation Pipeline Volume & Closures
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Monthly count of newly initiated dealrooms vs. signed agreements
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-md">
              +28% MoM Growth
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: 'transparent'}}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Bar dataKey="negotiations" fill="#1e293b" radius={[4, 4, 0, 0]} name="Dealrooms Opened" barSize={32} />
                <Bar dataKey="agreements" fill="#0d9488" radius={[4, 4, 0, 0]} name="Agreements Executed" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Room Status Distribution</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-6">Active vs executed agreements</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.length ? statusDistribution : [{ name: 'No Data', value: 1, color: '#e2e8f0' }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {(statusDistribution.length ? statusDistribution : [{ name: 'No Data', value: 1, color: '#e2e8f0' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts Row 2: Conversion Trend & Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversion Rate Trend */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Agreement Conversion Rate Trend</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6">Monthly % of opened dealrooms that reached full agreement</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => [`${v}%`, 'Conversion Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Role Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">User Role Breakdown</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6">Distribution of {totalUsers} registered accounts by role</p>
          <div className="space-y-3">
            {userRoleData.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No users registered yet.</p>}
            {userRoleData.map(item => (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: totalUsers > 0 ? `${(item.value / totalUsers) * 100}%` : '0%', backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>}

      {/* ── USER REGISTRY TAB ── */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">User & Organization Registry</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage platform participant roles, access permissions, and account status
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400"
                />
              </div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="owner">Business Owners</option>
                <option value="negotiator">Negotiators</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User & Organization</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{user.fullName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{user.businessName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                        className="text-xs rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1.5 bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                      >
                        <option value="owner">Business Owner</option>
                        <option value="negotiator">Negotiator</option>
                        <option value="admin">Administrator</option>
                        <option value="observer">Observer</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      <div>{user.email}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{user.phone || 'No phone provided'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          user.status === 'active'
                            ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                        }`}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
