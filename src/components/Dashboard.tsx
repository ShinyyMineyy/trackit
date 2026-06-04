/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Briefcase, DollarSign, Calendar, TrendingUp, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, ArrowUpRight, ShieldCheck, Mail
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

interface DashboardProps {
  token: string;
  onNavigate: (module: string, entityId?: string) => void;
  openEmailLogs: () => void;
}

export default function Dashboard({ token, onNavigate, openEmailLogs }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Authorization credentials failed to retrieve statistics.');
      const stats = await res.json();
      setData(stats);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed loading dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-[#3DDC97] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#A8B0BF] text-sm tracking-wide animate-pulse font-medium">Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/20 text-center max-w-lg mx-auto my-12 font-sans">
        <AlertCircle className="w-12 h-12 text-[#FF5D73] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#F5F7FA] mb-2">Could Not Load Workspace Data</h3>
        <p className="text-sm text-red-300 font-mono mb-4">{error}</p>
        <button 
          onClick={fetchStats}
          className="px-5 py-2.5 text-xs font-semibold text-[#0F1115] bg-[#3DDC97] rounded-lg hover:bg-[#59F0B5] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const counters = data?.counters || {
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    monthlyRevenue: 0,
    projectCompletionRate: 0
  };

  const recentPayments = data?.recentPayments || [];
  const recentInvoices = data?.recentInvoices || [];
  const upcomingDeadlines = data?.upcomingDeadlines || [];

  // Dynamic revenue trend from stats API response
  const areaChartData = data?.revenueTrend || [
    { month: 'Jan', Revenue: 0 },
    { month: 'Feb', Revenue: 0 },
    { month: 'Mar', Revenue: 0 },
    { month: 'Apr', Revenue: 0 },
    { month: 'May', Revenue: 0 },
    { month: 'Jun', Revenue: 0 }
  ];

  const pieData = [
    { name: 'Active', value: counters.activeProjects, color: '#3DDC97' },
    { name: 'Completed', value: counters.completedProjects, color: '#59F0B5' },
    { name: 'Pending', value: counters.pendingProjects, color: '#FFB547' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242936] pb-8">
        <div>
          <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-widest block mb-1 font-bold">Operations Hub</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Project Overview</h1>
          <p className="text-[#A8B0BF] text-sm font-sans mt-0.5">Manage Clients. Track Projects. Get Paid.</p>
        </div>
        <div className="flex sm:items-center gap-6 max-sm:flex-col sm:text-right">
          <div>
            <p className="text-[#A8B0BF] text-[10px] uppercase font-bold tracking-widest mb-1">Total Revenue</p>
            <p className="text-3xl font-extrabold text-[#3DDC97]">${counters.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 pt-1 font-mono">
            <button 
              onClick={openEmailLogs}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#242936] text-xs text-[#A8B0BF] hover:text-[#F5F7FA] rounded-lg transition-colors bg-[#171A21] hover:bg-[#11141A]"
            >
              <Mail className="w-3.5 h-3.5 text-[#3DDC97]" />
              EMAIL LOGS
            </button>
            <button 
              onClick={fetchStats}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#171A21] border border-[#242936] text-xs text-[#A8B0BF] hover:text-[#3DDC97] rounded-lg transition-colors hover:bg-[#11141A]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              REFRESH
            </button>
          </div>
        </div>
      </div>

      {/* Grid Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Gross Revenue', value: `$${counters.totalRevenue.toLocaleString()}`, change: 'Total Paid', icon: DollarSign, badge: 'Paid', badgeColor: 'text-[#3DDC97] bg-[#3DDC97]/10 border-[#3DDC97]/20 border' },
          { label: 'Monthly Earnings', value: `$${counters.monthlyRevenue.toLocaleString()}`, change: 'Current Month', icon: TrendingUp, badge: 'Optimal', badgeColor: 'text-[#59F0B5] bg-[#59F0B5]/10 border-[#59F0B5]/20 border' },
          { label: 'Outstanding Bills', value: `$${counters.pendingRevenue.toLocaleString()}`, change: 'Awaiting Transact', icon: Clock, badge: 'Due', badgeColor: 'text-[#FFB547] bg-[#FFB547]/10 border-[#FFB547]/20 border' },
          { label: 'Completion Target', value: `${counters.projectCompletionRate}%`, change: 'Projects Done', icon: CheckCircle2, badge: 'Success', badgeColor: 'text-[#FF5D73] bg-[#FF5D73]/10 border-[#FF5D73]/20 border' }
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#171A21] border border-[#242936] rounded-2xl p-5 shadow-lg flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3DDC97]/5 to-transparent rounded-full filter blur-xl opacity-30 transition-all duration-500 group-hover:scale-150"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#3DDC97]/10 text-[#3DDC97] rounded-lg">
                <c.icon className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${c.badgeColor}`}>{c.badge}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5F7FA] tracking-tight">{c.value}</p>
              <p className="text-sm text-[#A8B0BF] font-medium">{c.label}</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">{c.change}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sub Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#171A21] border border-[#242936] rounded-2xl p-5 shadow-inner">
        {[
          { label: 'Clients Database', val: counters.totalClients, icon: Users },
          { label: 'Active Projects', val: counters.activeProjects, icon: Briefcase, color: 'text-[#3DDC97]' },
          { label: 'Pending Pipelines', val: counters.pendingProjects, icon: Clock, color: 'text-[#FFB547]' },
          { label: 'Completed Deliveries', val: counters.completedProjects, icon: CheckCircle2, color: 'text-[#59F0B5]' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-4 py-2 border-r last:border-0 border-[#242936] max-sm:border-b max-sm:border-r-0">
            <item.icon className={`w-5 h-5 ${item.color || 'text-[#A8B0BF]'}`} />
            <div>
              <p className="text-xs text-[#A8B0BF] font-sans font-medium leading-none">{item.label}</p>
              <p className="text-lg font-bold text-[#F5F7FA] mt-1 pr-1 leading-none">{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Analytics Charts Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Area Income Chart */}
        <div className="lg:col-span-2 p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-[#F5F7FA]">Revenue Overview</h3>
              <p className="text-xs text-[#A8B0BF] mt-0.5">Income trend tracker</p>
            </div>
            <span className="text-[10px] bg-[#0F1115] border border-[#242936] px-2.5 py-1 text-[#3DDC97] rounded-md font-medium">Revenue Trend</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3DDC97" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#A8B0BF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A8B0BF" fontSize={11} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171A21', borderColor: '#242936', borderRadius: '12px' }}
                  labelStyle={{ color: '#F5F7FA', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#3DDC97' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Settled Revenue']}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#3DDC97" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#F5F7FA]">Project Status Weight</h3>
            <p className="text-xs text-[#A8B0BF] font-mono uppercase mt-0.5">Distribution Ratio</p>
          </div>
          
          <div className="h-44 relative flex items-center justify-center my-4">
            {counters.activeProjects === 0 && counters.completedProjects === 0 && counters.pendingProjects === 0 ? (
              <p className="text-xs font-mono text-[#A8B0BF]">NO PROJECTS SEEDED</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171A21', borderColor: '#242936', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#F5F7FA' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-[#F5F7FA]">{counters.activeProjects + counters.completedProjects + counters.pendingProjects}</span>
              <span className="text-[10px] uppercase font-mono text-[#A8B0BF] tracking-widest">Total</span>
            </div>
          </div>

          <div className="space-y-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-[#A8B0BF]">{d.name}</span>
                </div>
                <span className="text-[#F5F7FA] font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Bottom: Deadlines, Payments & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approaching Work Deadlines */}
        <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg">
          <h3 className="text-base font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFB547]" />
            Upcoming Deliveries
          </h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] py-6 text-center font-medium">All quiet. No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((dead: any) => (
                <div 
                  key={dead.projectId} 
                  onClick={() => onNavigate('projects', dead.projectId)}
                  className="p-3 bg-[#0F1115] hover:bg-[#242936]/30 border border-[#242936] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="max-w-[70%]">
                    <p className="text-xs font-medium text-[#F5F7FA] truncate">{dead.projectName}</p>
                    <p className="text-[10px] text-[#A8B0BF] font-mono mt-0.5">{dead.deadline}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    dead.remainingDays <= 3 ? 'bg-[#FF5D73]/10 text-[#FF5D73]' :
                    dead.remainingDays <= 7 ? 'bg-[#FFB547]/10 text-[#FFB547]' : 'bg-[#3DDC97]/10 text-[#3DDC97]'
                  }`}>
                    {dead.remainingDays <= 0 ? 'OVERDUE' : `${dead.remainingDays}d left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Billing Sent Ledger */}
        <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg">
          <h3 className="text-base font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3DDC97]" />
            Recent Invoices
          </h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] py-6 text-center font-medium">No invoices created yet.</p>
            ) : (
              recentInvoices.map((inv: any) => (
                <div 
                  key={inv.id}
                  onClick={() => onNavigate('invoices')}
                  className="p-3 bg-[#0F1115] hover:bg-[#242936]/30 border border-[#242936] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#3DDC97] uppercase leading-none font-bold">{inv.invoiceNumber}</span>
                    </div>
                    <p className="text-xs text-[#A8B0BF] truncate max-w-[150px] mt-1 leading-none">{inv.projectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#F5F7FA]">${inv.amount.toLocaleString()}</p>
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md ${
                      inv.status === 'Paid' ? 'bg-[#3DDC97]/10 text-[#3DDC97]' : 'bg-[#FFB547]/10 text-[#FFB547]'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments Settled Ledger */}
        <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg">
          <h3 className="text-base font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#59F0B5]" />
            Recent Payments
          </h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] py-6 text-center font-medium">No payments received yet.</p>
            ) : (
              recentPayments.map((pay: any) => (
                <div 
                  key={pay.id}
                  onClick={() => onNavigate('payments')}
                  className="p-3 bg-[#0F1115] hover:bg-[#242936]/30 border border-[#242936] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="max-w-[65%]">
                    <p className="text-xs font-semibold text-[#F5F7FA] truncate">{pay.projectName}</p>
                    <p className="text-[10px] text-[#A8B0BF] font-mono mt-0.5">{new Date(pay.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#3DDC97]">+${pay.amount.toLocaleString()}</p>
                    <span className="text-[8px] font-mono text-[#A8B0BF] block">Cleared Bank</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
