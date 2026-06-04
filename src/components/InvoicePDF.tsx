/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Printer, Download, CheckSquare, Clock, FileText, Compass, DollarSign, ShieldAlert } from 'lucide-react';
import { Invoice, Project, Client } from '../types';

interface InvoicePDFProps {
  invoice: Invoice;
  project: Project;
  client: Client;
  isAdmin?: boolean;
  token?: string; // Admin JWT token
  onStatusChanged?: () => void;
}

export default function InvoicePDF({ invoice, project, client, isAdmin = false, token, onStatusChanged }: InvoicePDFProps) {
  
  const handleToggleStatus = async () => {
    if (!isAdmin || !token) return;
    const nextStatus = invoice.status === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok && onStatusChanged) {
        onStatusChanged();
      }
    } catch (e) {
      console.error('Invoice toggle status failed:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Utilities header */}
      <div className="flex items-center justify-between gap-4 border-b border-[#242936] pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#3DDC97]" />
          <div>
            <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider block font-bold">{invoice.invoiceNumber}</span>
            <span className="text-xs text-[#A8B0BF] font-mono">Invoice Ledger Ledger Entry</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleToggleStatus}
              className={`px-3.5 py-1.5 border text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 ${
                invoice.status === 'Paid'
                  ? 'bg-[#3DDC97]/10 border-[#3DDC97]/30 text-[#3DDC97] hover:bg-[#3DDC97]/20'
                  : 'bg-[#FFB547]/10 border-[#FFB547]/30 text-[#FFB547] hover:bg-[#FFB547]/20'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {invoice.status === 'Paid' ? 'MARK UNPAID' : 'MARK PAID'}
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            PRINT PDF / DOWNLOAD
          </button>
        </div>
      </div>

      {/* Invoice paper sheet */}
      <div id={`invoice-sheet-${invoice.id}`} className="bg-[#171A21] border border-[#242936] rounded-2xl p-8 max-w-3xl mx-auto shadow-xl relative text-slate-300 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Printable styled header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-[#242936] pb-8 print:border-zinc-300">
          <div>
            {/* Logo area */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#3DDC97] flex items-center justify-center font-bold text-[#0F1115]">M</div>
              <span className="text-xl font-bold tracking-tight text-[#F5F7FA] print:text-black">MintFlow</span>
            </div>
            <p className="text-xs text-[#A8B0BF] font-mono print:text-zinc-500">MINTFLOW ADMINISTRATIVE PLATFORM REPRESENTATIVE</p>
            <p className="text-xs text-[#A8B0BF] font-mono mt-0.5 print:text-zinc-500">admin@mintflow.local</p>
          </div>

          <div className="text-right md:text-right print:text-right">
            <h2 className="text-2xl font-extrabold text-[#F5F7FA] tracking-tight print:text-black leading-none uppercase">Invoice</h2>
            <p className="text-xs font-mono text-[#3DDC97] mt-1 font-bold">{invoice.invoiceNumber}</p>
            <div className="mt-4 space-y-1 text-xs font-mono text-[#A8B0BF] print:text-zinc-600">
              <p><span className="text-[#F5F7FA] print:text-black font-semibold">ISSUE DATE:</span> {invoice.date}</p>
              <p><span className="text-[#F5F7FA] print:text-black font-semibold">DUE DATE:</span> {invoice.dueDate}</p>
              <p className="flex items-center justify-end gap-1.5 mt-2">
                <span className="text-[#F5F7FA] print:text-black font-semibold">STATUS:</span>
                <span className={`px-2 py-0.5 rounded leading-none text-[10px] font-bold ${
                  invoice.status === 'Paid' ? 'bg-[#3DDC97]/15 text-[#3DDC97] print:text-green-800' : 'bg-[#FFB547]/15 text-[#FFB547] print:text-amber-800'
                }`}>
                  {invoice.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Client bill-to parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-[#242936] print:border-zinc-300">
          <div>
            <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider block font-bold mb-2">Billed To</span>
            <p className="text-sm font-bold text-[#F5F7FA] print:text-black">{client.name}</p>
            <p className="text-xs text-slate-300 mt-1 print:text-zinc-700">{client.company || 'Private Recipient'}</p>
            <p className="text-xs font-mono text-[#A8B0BF] mt-2 print:text-zinc-600">{client.email}</p>
            <p className="text-xs font-mono text-[#A8B0BF] mt-0.5 print:text-zinc-600">{client.phone}</p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider block font-bold mb-2">Project Folder Alignment</span>
            <p className="text-sm font-semibold text-[#F5F7FA] print:text-black">{project.name}</p>
            <p className="text-xs text-[#A8B0BF] mt-1 print:text-zinc-600 max-w-sm font-sans truncate leading-relaxed">{project.description}</p>
          </div>
        </div>

        {/* Invoice Item List Table */}
        <div className="py-8">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[#242936] pb-2 text-[#A8B0BF] uppercase tracking-wider font-mono text-[10px] print:border-zinc-300 print:text-zinc-500">
                <th className="py-2.5 font-bold">Scope of Implementations / Milestone Releases</th>
                <th className="py-2.5 text-right font-bold w-32">Allocated Budget</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#242936]/40 print:border-zinc-200">
                <td className="py-4">
                  <p className="font-semibold text-[#F5F7FA] print:text-black mb-1">{invoice.details || 'Professional Web/Mobile Development Project Deliverables'}</p>
                  <p className="text-[10px] text-[#A8B0BF] font-mono leading-relaxed print:text-zinc-500">Includes core architecture design layouts alongside standard system seed scripts.</p>
                </td>
                <td className="py-4 text-right font-mono font-bold text-[#F5F7FA] print:text-black">
                  ${invoice.amount.toLocaleString()}
                </td>
              </tr>

              {/* Balances summary */}
              <tr>
                <td className="py-3 text-right text-[#A8B0BF] font-mono uppercase font-semibold">Sub-Total Value:</td>
                <td className="py-3 text-right font-mono text-slate-300 print:text-black">${invoice.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-1 text-right text-[#A8B0BF] font-mono uppercase font-semibold">Service Surcharges (5% System Tax):</td>
                <td className="py-1 text-right font-mono text-[#FF5D73] print:text-zinc-800">+${invoice.tax.toLocaleString()}</td>
              </tr>
              <tr className="border-t border-[#242936] pt-2 print:border-zinc-300">
                <td className="py-4 text-right text-[#F5F7FA] print:text-black font-mono uppercase font-extrabold text-sm">Grand Total Ledger Balance:</td>
                <td className="py-4 text-right font-mono text-xl font-extrabold text-[#3DDC97] print:text-black">
                  ${invoice.total.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Billing memo information footer */}
        <div className="border-t border-[#242936] pt-6 text-[10px] text-center font-mono text-[#A8B0BF] print:border-zinc-300 print:text-zinc-500">
          <p className="font-bold text-[#3DDC97] uppercase mb-1.5 print:text-zinc-700">Thank you for your collaborative business.</p>
          <p>Please address all transaction clearing issues directly with: admin@mintflow.local</p>
          <p className="mt-1">MintFlow Engine - Relational Blockchain & Cloud Ledgers Framework © 2026</p>
        </div>
      </div>
    </div>
  );
}
