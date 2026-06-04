/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Clock, Trash2, Search, X, ShieldAlert, Compass } from 'lucide-react';
import { EmailLog } from '../types';

interface EmailViewerProps {
  token: string;
  onClose: () => void;
}

export default function EmailViewer({ token, onClose }: EmailViewerProps) {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/emails/sent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
        if (data.length > 0) {
          setSelectedEmail(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed retrieving simulated email accounts logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [token]);

  const filtered = emails.filter(e => 
    e.to.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#0F1115]/95 backdrop-blur-md z-50 flex items-stretch justify-end">
      <div className="w-full max-w-4xl bg-[#171A21] border-l border-[#242936] flex flex-col h-full shadow-2xl">
        
        {/* Drawer header panel */}
        <div className="p-6 border-b border-[#242936] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#3DDC97]" />
            <div>
              <h2 className="text-base font-semibold text-[#F5F7FA]">Dispatch Center (SMTP Simulator)</h2>
              <p className="text-xs text-[#A8B0BF] font-mono">System-wide outgoing notifications ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-[#242936] hover:border-[#FF5D73]/30 hover:text-[#FF5D73] bg-[#0F1115] text-[#A8B0BF] rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter block */}
        <div className="p-4 bg-[#0F1115]/40 border-b border-[#242936] relative">
          <Search className="absolute left-7 top-6.5 w-4 h-4 text-[#A8B0BF]" />
          <input 
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1115] border border-[#242936] pl-9 pr-4 py-2.5 rounded-xl font-mono text-xs text-[#F5F7FA] focus:outline-none focus:border-[#3DDC97]"
          />
        </div>

        {/* Content canvas split screen */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column Log Feed list */}
          <div className="w-1/3 border-r border-[#242936] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-[#A8B0BF] font-mono p-6 text-center">LOADING SMTP LOGS...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] font-mono p-6 text-center">No emails has been dispatched.</p>
            ) : (
              filtered.map(e => {
                const active = selectedEmail?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEmail(e)}
                    className={`p-4 border-b border-[#242936] cursor-pointer transition-all ${
                      active ? 'bg-[#242936]/40' : 'hover:bg-[#0F1115]/30'
                    }`}
                  >
                    <p className="text-[9px] font-mono text-[#3DDC97] uppercase truncate">TO: {e.to}</p>
                    <h4 className={`text-xs font-bold leading-relaxed truncate mt-1 ${active ? 'text-[#3DDC97]' : 'text-[#F5F7FA]'}`}>
                      {e.subject}
                    </h4>
                    <p className="text-[10px] font-mono text-[#A8B0BF] flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Full email display card visual canvas */}
          <div className="w-2/3 bg-[#0F1115]/25 p-6 overflow-y-auto">
            {selectedEmail ? (
              <div className="space-y-4">
                {/* Simulated SMTP headers */}
                <div className="p-4 bg-[#0F1115] border border-[#242936] rounded-xl font-mono text-xs text-[#A8B0BF] space-y-1">
                  <p><span className="text-[#3DDC97]">FROM:</span> noreply@mintflow.system (Google Workspace Redirect)</p>
                  <p><span className="text-[#3DDC97]">TO:</span> {selectedEmail.to}</p>
                  <p><span className="text-[#3DDC97]">DATE:</span> {new Date(selectedEmail.timestamp).toLocaleString()}</p>
                  <p><span className="text-[#3DDC97]">SUBJECT:</span> {selectedEmail.subject}</p>
                </div>

                {/* Simulated email paper render canvas */}
                <div className="bg-white text-zinc-800 p-8 rounded-xl shadow-inner border border-zinc-200">
                  {/* Email Visual Brand Container */}
                  <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#0F1115] flex items-center justify-center text-xs font-bold text-[#3DDC97]">M</div>
                    <span className="font-sans font-extrabold text-[#0F1115] tracking-tight">MintFlow Team</span>
                  </div>

                  {/* Body text wrapper preserving breaks */}
                  <div className="prose text-xs text-zinc-700 font-sans leading-relaxed whitespace-pre-wrap">
                    {selectedEmail.body}
                  </div>

                  {/* Mail signature block */}
                  <div className="border-t border-zinc-100 mt-8 pt-4 text-[10px] text-zinc-400 font-mono">
                    <p>This is a simulated outgoing message dispatch. To customize scopes or trigger native SMTP mail servers, edit the .env.example parameter bindings.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#A8B0BF] font-mono text-xs">
                SELECT A OUTGOING MAIL ITEM TO VIEW DIGITAL BODY CONTENTS
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
