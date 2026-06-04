/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  Clock, Tag, RefreshCw, Eye, Printer, Calendar, Settings, CheckSquare, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { Invoice, Project, Client } from '../types';
import InvoicePDF from './InvoicePDF';

interface FinanceProps {
  token: string;
}

export default function FinanceModule({ token }: FinanceProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal actions
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [invoiceProj, setInvoiceProj] = useState<Project | null>(null);
  const [invoiceCli, setInvoiceCli] = useState<Client | null>(null);

  // New Invoice Parameters
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInv, resProj, resCli] = await Promise.all([
        fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resInv.ok && resProj.ok && resCli.ok) {
        setInvoices(await resInv.json());
        setProjects(await resProj.json());
        setClients(await resCli.json());
      }
    } catch (e) {
      console.error('Failed fetching core finance registries:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = (inv: Invoice) => {
    const proj = projects.find(p => p.id === inv.projectId) || null;
    const cli = proj ? clients.find(c => c.id === proj.clientId) : null;
    
    setInvoiceProj(proj);
    setInvoiceCli(cli as Client | null);
    setActiveInvoice(inv);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !amount || !dueDate) {
      setError('Please map a selective project contract and set raw amount properties.');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          date: new Date().toISOString().split('T')[0],
          dueDate,
          amount: Number(amount),
          details: details || 'Creative Milestones Phase Handover',
          status: 'Unpaid'
        })
      });

      if (res.ok) {
        setProjectId('');
        setAmount('');
        setDueDate('');
        setDetails('');
        setShowCreateModal(false);
        setError('');
        fetchData();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed generating invoice.');
      }
    } catch (e) {
      setError('Connection timeout.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Financial statistics calculations
  const totalInvoiced = invoices.reduce((acc, current) => acc + current.total, 0);
  const paidEarnings = invoices.filter(i => i.status === 'Paid').reduce((acc, current) => acc + current.total, 0);
  const outstandingReceivable = totalInvoiced - paidEarnings;
  const systemSurchargesCollected = invoices.filter(i => i.status === 'Paid').reduce((acc, current) => acc + current.tax, 0);

  // Map monthly records to feed visual charts
  const monthlyDataMap: { [month: string]: { Paid: number; Unpaid: number } } = {};
  
  invoices.forEach(inv => {
    // invoice dates formatted as YYYY-MM-DD
    const dateObj = new Date(inv.date);
    const monthStr = dateObj.toLocaleString('default', { month: 'short' });
    if (!monthlyDataMap[monthStr]) {
      monthlyDataMap[monthStr] = { Paid: 0, Unpaid: 0 };
    }
    if (inv.status === 'Paid') {
      monthlyDataMap[monthStr].Paid += inv.total;
    } else {
      monthlyDataMap[monthStr].Unpaid += inv.total;
    }
  });

  const chartData = Object.keys(monthlyDataMap).map(key => ({
    name: key,
    Paid: monthlyDataMap[key].Paid,
    Outstanding: monthlyDataMap[key].Unpaid
  }));

  // Dynamic fallback to actual zero values for recent months if empty, preventing dummy mock data
  const fallbackChartData = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = d.toLocaleString('default', { month: 'short' });
    fallbackChartData.push({ name: mName, Paid: 0, Outstanding: 0 });
  }

  const formattedChartData = chartData.length > 0 ? chartData : fallbackChartData;

  const pieChartData = [
    { name: 'Cleared Earnings', value: paidEarnings, color: '#3DDC97' },
    { name: 'Outstanding Balances', value: outstandingReceivable, color: '#FFB547' }
  ];

  return (
    <div className="space-y-6">
      {/* Platform Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242936] pb-6">
        <div>
          <span className="text-xs font-mono text-[#3DDC97] uppercase tracking-widest block mb-1 font-semibold font-mono">Ledgers Ledger Registry</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA]">Finance Hub</h1>
          <p className="text-sm text-[#A8B0BF] mt-1 font-mono uppercase">Inspect revenues, clear balances, and dispatch invoices</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-mono font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          DISPATCH INVOICE
        </button>
      </div>

      {/* Grid parameter micro-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Cleared Revenues', value: `$${paidEarnings.toLocaleString()}`, change: 'Cleared Earnings', icon: ShieldCheck, color: 'text-[#3DDC97]', bg: 'bg-[#3DDC97]/10' },
          { label: 'Outstanding Invoiced', value: `$${outstandingReceivable.toLocaleString()}`, change: 'Surcharges Pending', icon: Clock, color: 'text-[#FFB547]', bg: 'bg-[#FFB547]/10' },
          { label: 'Gross Projected', value: `$${totalInvoiced.toLocaleString()}`, change: 'Accumulative Invoiced', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'System Surcharges', value: `$${systemSurchargesCollected.toLocaleString()}`, change: 'Surcharges Collected (5%)', icon: DollarSign, color: 'text-[#3DDC97]', bg: 'bg-[#3DDC97]/10' }
        ].map((s, idx) => (
          <div key={idx} className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg relative group overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#A8B0BF] font-mono uppercase tracking-wider">{s.label}</span>
              <div className={`p-2 rounded-xl ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#F5F7FA] tracking-tight">{s.value}</p>
            <p className="text-[10px] text-[#A8B0BF] font-mono uppercase mt-1.5">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Financial Performance Chart */}
        <div className="lg:col-span-2 p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA] font-mono uppercase tracking-wider">Accounting Flow Performance</h3>
            <p className="text-xs text-[#A8B0BF] mt-0.5 font-mono uppercase">Month over Month billing breakdowns ($ USD)</p>
          </div>

          <div className="h-64 mt-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3DDC97" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB547" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FFB547" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242936" />
                <XAxis dataKey="name" stroke="#A8B0BF" />
                <YAxis stroke="#A8B0BF" />
                <Tooltip contentStyle={{ backgroundColor: '#171A21', borderColor: '#242936', color: '#F5F7FA' }} />
                <Legend />
                <Area type="monotone" dataKey="Paid" stroke="#3DDC97" strokeWidth={2} fillOpacity={1} fill="url(#colorPaid)" />
                <Area type="monotone" dataKey="Outstanding" stroke="#FFB547" strokeWidth={2} fillOpacity={1} fill="url(#colorOutstanding)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Billing Index Table */}
        <div className="lg:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4 max-h-[350px] overflow-y-auto pr-1">
          <h3 className="text-xs font-mono text-[#3DDC97] uppercase tracking-wider border-b border-[#242936] pb-2 font-bold select-none">
            Ledger status chart ratios
          </h3>
          <div className="space-y-4">
            {pieChartData.map((d, index) => {
              const pct = totalInvoiced > 0 ? ((d.value / totalInvoiced) * 100).toFixed(0) : '0';
              return (
                <div key={index} className="p-3.5 bg-[#0F1115] border border-[#242936] rounded-xl font-mono text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#A8B0BF]">{d.name}</span>
                    <span className="text-[#F5F7FA] font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#242936] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }}></div>
                  </div>
                  <p className="text-[10px] text-[#A8B0BF] mt-1.5 font-bold">${d.value.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main invoices tabular index */}
      <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg overflow-x-auto">
        <div className="flex items-center justify-between mb-4 border-b border-[#242936] pb-3 select-none">
          <h3 className="text-xs font-mono text-[#3DDC97] uppercase tracking-wider font-bold">Ledger Ledger Database</h3>
          <span className="text-[10px] text-[#A8B0BF] font-mono font-semibold">{invoices.length} Entries found</span>
        </div>

        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#242936] text-[#A8B0BF] uppercase tracking-wider text-[10px]">
              <th className="py-3">Invoice ID</th>
              <th className="py-3">Details Item</th>
              <th className="py-3">Billing Target</th>
              <th className="py-3">Issue Date</th>
              <th className="py-3 text-right">Gross Amount</th>
              <th className="py-3 text-right">Status</th>
              <th className="py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#A8B0BF]">LOADING INVOICE LEDGERS DATABASE...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#A8B0BF]">No transaction logs found of file.</td>
              </tr>
            ) : (
              invoices.map(inv => {
                const proj = projects.find(p => p.id === inv.projectId);
                return (
                  <tr key={inv.id} className="border-b border-[#242936]/40 hover:bg-[#242936]/10 transition-all font-mono">
                    <td className="py-3 text-[#3DDC97] font-bold">{inv.invoiceNumber}</td>
                    <td className="py-3 text-[#F5F7FA] font-sans font-semibold max-w-xs truncate">{inv.details}</td>
                    <td className="py-3 text-[#A8B0BF]">{proj ? proj.name : 'Unknown scope'}</td>
                    <td className="py-3 text-slate-300">{inv.date}</td>
                    <td className="py-3 text-right text-slate-300 font-extrabold">${inv.total.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block leading-none ${
                        inv.status === 'Paid' ? 'bg-[#3DDC97]/15 text-[#3DDC97]' : 'bg-[#FFB547]/15 text-[#FFB547]'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleOpenInvoice(inv)}
                        className="px-2 py-1 bg-[#3DDC97]/15 hover:bg-[#3DDC97]/25 text-[#3DDC97] rounded text-[10px] font-bold select-none cursor-pointer"
                      >
                        Ledger Sheet
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail PDF overlays model */}
      <AnimatePresence>
        {activeInvoice && invoiceProj && invoiceCli && (
          <div className="fixed inset-0 bg-[#0F1115]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#171A21] border border-[#242936] rounded-2xl p-6 relative">
              <button
                onClick={() => { setActiveInvoice(null); }}
                className="absolute top-4 right-4 text-xs font-mono text-[#A8B0BF] hover:text-[#FF5D73] border border-[#242936] bg-[#0F1115] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                CLOSE
              </button>
              
              <InvoicePDF
                invoice={activeInvoice}
                project={invoiceProj}
                client={invoiceCli}
                isAdmin={true}
                token={token}
                onStatusChanged={() => {
                  setActiveInvoice(null);
                  fetchData();
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide Modal: Create Invoice */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#171A21] border border-[#242936] rounded-2xl p-6 w-full max-w-md shadow-2xl relative font-mono text-xs"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#242936] pb-3 select-none">
                <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3DDC97]" />
                  CREATE OUTGOING TRANSACTION BILL
                </h3>
                <button 
                  onClick={() => { setShowCreateModal(false); setError(''); }}
                  className="text-[#A8B0BF] hover:text-[#F5F7FA] font-mono text-[10px] cursor-pointer px-2.5 py-1 bg-[#0F1115] border border-[#242936] rounded-lg"
                >
                  CLOSE
                </button>
              </div>

              {error && (
                <p className="p-3 bg-red-950/20 border border-red-500/10 text-red-500 font-mono text-[11px] rounded-xl mb-4 leading-normal">
                  {error}
                </p>
              )}

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Link Contract Folder *</label>
                  <select
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl font-sans text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                  >
                    <option value="">Select project alignment...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Base value ($ USD) *</label>
                    <input 
                      type="number" 
                      required
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Due Limit Date *</label>
                    <input 
                      type="date" 
                      required
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Scope of Deliverables & Items</label>
                  <textarea 
                    rows={3}
                    value={details} 
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide descriptions of completed targets, wireframes reviews, database structures."
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] resize-none"
                  />
                </div>

                <div className="p-3 bg-[#0F1115] border border-[#242936] rounded-xl font-mono text-[10px] text-zinc-400 select-none">
                  Note: Values are computed dynamically incorporating custom 5% operational tax surcharges.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] rounded-xl font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  DISPATCH ACCOUNT TRANSACTION
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
