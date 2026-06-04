/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Briefcase, FileText, CheckSquare, Clock, Globe, HelpCircle,
  ExternalLink, FileUp, ShieldCheck, Check, DollarSign, Calendar, MessageSquare, LogOut, Link2 
} from 'lucide-react';
import { Client, Project, Invoice, Task, FileModel, DocumentModel, CalendarEventModel, Payment } from '../types';
import InvoicePDF from './InvoicePDF';

interface ClientPortalProps {
  portalToken: string;
}

export default function ClientPortal({ portalToken }: ClientPortalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dynamic parameters
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'finance' | 'files' | 'docs'>('overview');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payingState, setPayingState] = useState(false);

  // Messages simulator
  const [comments, setComments] = useState<{ author: string; text: string; time: string }[]>([
    { author: ' freelancer', text: 'Onboarded core routing features! Ready for evaluation.', time: 'Yesterday' }
  ]);
  const [myComment, setMyComment] = useState('');

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/${portalToken}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        if (payload.projects && payload.projects.length > 0) {
          setSelectedProject(payload.projects[0]);
        }
      } else {
        setError('The Single-Click Entry Token presented is revoked, mismatched, or expired. Please request a fresh coordinate link from your advisor.');
      }
    } catch (e) {
      setError('Connection timeout searching directory vaults.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setPayingState(true);
      const res = await fetch(`/api/portal/${portalToken}/invoice/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setViewInvoice(null);
        fetchPortalData();
      }
    } catch (err) {
      console.error('Invoice clearing simulator hit an exception:', err);
    } finally {
      setPayingState(false);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myComment.trim()) return;
    setComments([...comments, { author: 'Cooperator (You)', text: myComment, time: 'Just now' }]);
    setMyComment('');
  };

  useEffect(() => {
    if (portalToken) {
      fetchPortalData();
    }
  }, [portalToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA] flex items-center justify-center font-mono text-xs">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-4 border-[#3DDC97] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="tracking-widest uppercase animate-pulse">DECRYPTING COOPERATOR WORKSPACE KEY...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA] flex items-center justify-center p-4">
        <div className="p-8 bg-[#171A21] border border-[#242936] rounded-2xl max-w-md text-center space-y-4">
          <Globe className="w-12 h-12 text-[#FF5D73] mx-auto animate-bounce" />
          <h2 className="text-lg font-bold">Secure Verification Failed</h2>
          <p className="text-xs text-[#A8B0BF] font-mono leading-relaxed">{error}</p>
          <p className="text-[10px] text-zinc-500 font-mono italic">Client portals generate custom randomized cryptographic token codes for security boundary protection.</p>
        </div>
      </div>
    );
  }

  const client: Client = data.client;
  const projects: Project[] = data.projects || [];
  const inScopeTasks: Task[] = selectedProject ? (data.tasks[selectedProject.id] || []) : [];
  const inScopeUpdates: any[] = selectedProject ? (data.updates[selectedProject.id] || []) : [];
  const inScopeInvoices: Invoice[] = selectedProject ? (data.invoices[selectedProject.id] || []) : [];
  const inScopeFiles: FileModel[] = selectedProject ? (data.files[selectedProject.id] || []) : [];
  const inScopeDocs: DocumentModel[] = selectedProject ? (data.documents[selectedProject.id] || []) : [];
  const inScopeEvents: CalendarEventModel[] = selectedProject ? (data.events[selectedProject.id] || []) : [];
  const inScopePayment: Payment | null = selectedProject ? (data.payments[selectedProject.id] || null) : null;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA] pb-12 font-sans select-none">
      
      {/* Top Banner Cover */}
      <header className="bg-[#171A21] border-b border-[#242936] py-5 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3DDC97] flex items-center justify-center font-bold text-[#0F1115]">T</div>
            <div>
              <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-widest block font-bold">COOPERATOR PORTAL GATEWAY</span>
              <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">{client.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97] animate-ping" />
            <span className="text-xs font-mono text-[#A8B0BF]">Secure Single-Click Work Session</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left selector rails: Contracts alignment */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4">
            <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider block font-bold border-b border-[#242936] pb-2">Your Contracts</span>
            {projects.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] font-mono text-center py-6">No active contracts linked.</p>
            ) : (
              projects.map(p => {
                const active = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(p); }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      active ? 'bg-[#242936]/50 border-[#3DDC97]' : 'bg-[#0F1115]/50 border-[#242936] hover:bg-[#171A21]'
                    }`}
                  >
                    <p className={`text-xs font-bold truncate ${active ? 'text-[#3DDC97]' : 'text-[#F5F7FA]'}`}>{p.name}</p>
                    <p className="text-[9px] font-mono text-[#A8B0BF] mt-1.5 uppercase">Completion: {p.progress}% Done</p>
                    <div className="w-full h-1 bg-[#242936] rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full bg-[#3DDC97]" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sinks feedback box comments */}
          {selectedProject && (
            <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4">
              <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider block font-bold border-b border-[#242936] pb-2">Freelancer Sync Channel</span>
              
              <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                {comments.map((c, i) => (
                  <div key={i} className="p-2.5 bg-[#0F1115]/50 border border-[#242936] rounded-xl text-[10px] font-mono leading-normal">
                    <p className="text-[#3DDC97] font-bold uppercase">{c.author} • {c.time}</p>
                    <p className="text-slate-300 font-sans mt-1">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ping freelancer..."
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  className="flex-1 bg-[#0F1115] border border-[#242936] rounded-xl px-3 py-2 text-[10px] text-[#F5F7FA] font-mono focus:outline-none focus:border-[#3DDC97]"
                />
                <button
                  type="submit"
                  className="px-3 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-mono text-[10px] font-bold rounded-xl transition-all"
                >
                  SEND
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right dashboard: Tab layouts */}
        <div className="lg:col-span-3 space-y-6">
          {selectedProject ? (
            <div className="space-y-6">
              
              {/* Cover card board */}
              <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#3DDC97]/5 to-transparent rounded-full filter blur-3xl"></div>
                
                <h2 className="text-xl font-bold text-[#F5F7FA]">{selectedProject.name}</h2>
                <p className="text-xs text-[#A8B0BF] mt-1.5 leading-relaxed font-sans">{selectedProject.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#242936] mt-6 pt-5 text-xs font-mono">
                  <div>
                    <span className="text-[#A8B0BF] block text-[9px] uppercase">Client enterprise</span>
                    <span className="text-slate-300 font-sans font-semibold truncate block mt-0.5">{client.company || 'Private Recipient'}</span>
                  </div>
                  <div>
                    <span className="text-[#A8B0BF] block text-[9px] uppercase">contract budget</span>
                    <span className="text-[#3DDC97] font-bold block mt-0.5">${selectedProject.budget.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#A8B0BF] block text-[9px] uppercase">target deadline</span>
                    <span className="text-slate-300 block mt-0.5">{selectedProject.deadline}</span>
                  </div>
                  <div>
                    <span className="text-[#A8B0BF] block text-[9px] uppercase">pipeline status</span>
                    <span className="text-slate-300 block mt-0.5 font-bold uppercase">{selectedProject.status}</span>
                  </div>
                </div>
              </div>

              {/* Secure client tabs selectors */}
              <div className="flex bg-[#171A21] border border-[#242936] p-1 rounded-xl text-xs font-mono gap-1.5 leading-none">
                {[
                  { id: 'overview', label: 'WORK OVERVIEW' },
                  { id: 'tasks', label: 'TASKS PIPELINE' },
                  { id: 'finance', label: 'OUTSTANDING BILLING' },
                  { id: 'files', label: 'VAULT FILES' },
                  { id: 'docs', label: 'GOOGLE ATTACHMENTS' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-2 rounded-lg cursor-pointer font-bold uppercase text-[10px] sm:text-xs tracking-wide transition-all ${
                      activeTab === tab.id 
                        ? 'bg-[#3DDC97] text-[#0F1115]' 
                        : 'text-[#A8B0BF] hover:text-[#F5F7FA] hover:bg-[#242936]/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Active Tab canvas */}
              <div className="space-y-6">
                
                {/* 1. Overview workspace panels */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                    
                    {/* Left stats summary */}
                    <div className="md:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4">
                      <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide">Milestone clearing status</h3>
                      {inScopePayment ? (
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#A8B0BF]">Project Contract:</span>
                            <span className="text-slate-300 font-bold">${inScopePayment.totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#A8B0BF]">Cleared Payments:</span>
                            <span className="text-[#3DDC97] font-bold">${inScopePayment.paidAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-[#242936] pt-1.5">
                            <span className="text-[#A8B0BF]">Outstanding Balance:</span>
                            <span className="text-[#FF5D73] font-bold">${inScopePayment.remainingAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-red-400">Loading ledger ratios...</p>
                      )}
                    </div>

                    {/* Right update pipelines feed */}
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-xs font-bold text-[#F5F7FA] font-mono uppercase tracking-wider pb-1.5 border-b border-[#242936]">Work Log Entries</h3>
                      {inScopeUpdates.length === 0 ? (
                        <p className="text-xs text-[#A8B0BF] font-mono bg-[#171A21] border border-[#242936] p-6 rounded-2xl text-center py-8">Documentation pipelines currently silent.</p>
                      ) : (
                        inScopeUpdates.map(up => (
                          <div key={up.id} className="p-4 bg-[#171A21] border border-[#242936] rounded-2xl shadow">
                            <div className="flex items-center justify-between border-b border-[#242936] pb-2 mb-2">
                              <h4 className="text-xs font-semibold text-[#F5F7FA]">{up.title}</h4>
                              <span className="text-[9px] text-[#3DDC97]">{new Date(up.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans leading-relaxed">{up.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Deadline highlights */}
                    {inScopeEvents.length > 0 && (
                      <div className="col-span-1 md:col-span-3 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-3">
                        <h4 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide">Calendar Schedule Targets</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {inScopeEvents.map(ev => (
                            <div key={ev.id} className="p-3 bg-[#0F1115] border border-[#242936] rounded-xl font-mono text-[11px] leading-relaxed">
                              <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 align-middle ${
                                ev.type === 'Deadline' ? 'bg-[#FF5D73]' :
                                ev.type === 'Meeting' ? 'bg-[#FFB547]' : 'bg-[#3DDC97]'
                              }`} />
                              <strong className="text-slate-300 align-middle">{ev.title}</strong>
                              <p className="text-[10px] text-[#A8B0BF] mt-1 pr-1 truncate">{ev.description}</p>
                              <span className="text-[#3DDC97] text-[9px] mt-1.5 block">Schedule date: {ev.date} {ev.time ? `• ${ev.time} UTC` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 2. Project Task boards */}
                {activeTab === 'tasks' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[#242936] mb-2 select-none">
                      <div>
                        <h3 className="text-sm font-bold text-[#F5F7FA] font-mono uppercase tracking-wider">Sub Tasks Pipeline</h3>
                        <p className="text-xs text-[#A8B0BF] mt-0.5">Assigned features and active deliverables checklists.</p>
                      </div>
                      <span className="text-xs font-mono text-[#3DDC97]">{inScopeTasks.length} Milestones</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                      {['Todo', 'In Progress', 'Review', 'Done'].map(colId => {
                        const colTasks = inScopeTasks.filter(t => t.status === colId);
                        return (
                          <div key={colId} className="p-4 bg-[#171A21] border border-[#242936] rounded-2xl flex flex-col min-h-[180px]">
                            <span className="text-[10px] text-slate-300 font-extrabold uppercase border-b border-[#242936] pb-2 mb-3 tracking-widest">{colId}</span>
                            <div className="space-y-2 flex-1">
                              {colTasks.length === 0 ? (
                                <p className="text-[9px] text-slate-500 italic text-center py-6">Pipeline empty</p>
                              ) : (
                                colTasks.map(t => (
                                  <div key={t.id} className="p-3 bg-[#0F1115] border border-[#242936] rounded-xl">
                                    <h5 className="font-bold text-slate-300 tracking-tight leading-relaxed">{t.title}</h5>
                                    {t.description && <p className="text-[10px] text-[#A8B0BF] font-sans mt-1 leading-normal line-clamp-2">{t.description}</p>}
                                    <span className="text-[#3DDC97] text-[9px] mt-2 block">DUE LIMIT: {t.dueDate}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Finance & Invoices */}
                {activeTab === 'finance' && (
                  <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4 text-xs">
                    <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide font-mono">Ledger invoices files</h3>
                    
                    <div className="space-y-3.5">
                      {inScopeInvoices.length === 0 ? (
                        <p className="text-xs text-[#A8B0BF] font-mono text-center py-8">Outstanding billing database empty of transaction ledgers.</p>
                      ) : (
                        inScopeInvoices.map(inv => (
                          <div 
                            key={inv.id} 
                            className="p-4 bg-[#0F1115]/60 hover:bg-[#242936]/20 border border-[#242936] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono select-none"
                          >
                            <div>
                              <span className="text-[10px] text-[#3DDC97] font-bold block">{inv.invoiceNumber}</span>
                              <h4 className="text-xs font-bold text-slate-300 mt-1 truncate max-w-sm">{inv.details}</h4>
                              <p className="text-[10px] text-[#A8B0BF] mt-1 font-mono">Issued: {inv.date} (Due date: {inv.dueDate})</p>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <p className="text-xs font-bold text-slate-300">${inv.total.toLocaleString()}</p>
                                <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded leading-none block mt-1.5 ${
                                  inv.status === 'Paid' ? 'bg-[#3DDC97]/15 text-[#3DDC97]' : 'bg-[#FFB547]/15 text-[#FFB547]'
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                              <button
                                onClick={() => { setViewInvoice(inv); }}
                                className="px-3 py-1.5 bg-[#3DDC97]/10 hover:bg-[#3DDC97]/20 text-[#3DDC97] rounded-xl font-bold transition-all text-[11px]"
                              >
                                LEDGER SHEET
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Vault Files downloads */}
                {activeTab === 'files' && (
                  <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4 text-xs">
                    <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide font-mono">Your shared file vault</h3>
                    
                    <div className="space-y-3 font-mono">
                      {inScopeFiles.length === 0 ? (
                        <p className="text-xs text-[#A8B0BF] font-mono text-center py-8 font-semibold">Shared documentation vault is empty of files.</p>
                      ) : (
                        inScopeFiles.map(f => (
                          <div key={f.id} className="p-4 bg-[#0F1115]/50 border border-[#242936] rounded-2xl flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-300">{f.name}</h4>
                              <p className="text-[10px] text-[#A8B0BF] mt-1">Size: {(f.size / (1024 * 1024)).toFixed(2)} MB • Ver: {f.version}</p>
                            </div>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-[#3DDC97]/10 hover:bg-[#3DDC97]/20 text-[#3DDC97] font-bold rounded-xl transition-all"
                            >
                              DOWNLOAD
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Connected Google Docs references */}
                {activeTab === 'docs' && (
                  <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4 text-xs font-mono">
                    <h2 className="text-xs font-bold text-slate-300 border-b border-[#242936] pb-2 uppercase tracking-wide flex items-center gap-1.5 select-none">
                      <Globe className="text-[#3DDC97] w-4 h-4 shrink-0" />
                      Google Workspace Attachments
                    </h2>
                    
                    <div className="space-y-3 font-mono">
                      {inScopeDocs.length === 0 ? (
                        <p className="text-xs text-[#A8B0BF] text-center py-8 font-semibold uppercase leading-normal">Admins has not linked any Google document assets under contract file directory.</p>
                      ) : (
                        inScopeDocs.map(doc => (
                          <div key={doc.id} className="p-4 bg-[#0F1115]/50 border border-[#242936] rounded-2xl flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-300 font-sans">{doc.title}</h4>
                              <p className="text-[9px] text-[#A8B0BF] mt-1">Google Docs Cloud Repository • Active permission locks</p>
                            </div>
                            <a
                              href={doc.webViewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              OPEN DOC
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="h-44 text-[#A8B0BF] font-mono text-xs flex items-center justify-center border border-[#242936] rounded-2xl bg-[#171A21]/30">
              Contract indexing logs currently unavailable.
            </div>
          )}
        </div>

      </main>

      {/* Invoice Details Viewing Overlays with paying trigger */}
      <AnimatePresence>
        {viewInvoice && selectedProject && (
          <div className="fixed inset-0 bg-[#0F1115]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#171A21] border border-[#242936] rounded-2xl p-6 relative">
              <button
                onClick={() => { setViewInvoice(null); }}
                className="absolute top-4 right-4 text-xs font-mono text-[#A8B0BF] hover:text-[#FF5D73] border border-[#242936] bg-[#0F1115] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                CLOSE
              </button>

              <div className="mb-4 pt-10 print:hidden text-center">
                {viewInvoice.status === 'Unpaid' ? (
                  <button
                    onClick={() => handlePayInvoice(viewInvoice.id)}
                    disabled={payingState}
                    className="px-6 py-3 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] disabled:bg-zinc-800 font-mono text-xs font-extrabold rounded-xl transition-all shadow active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    {payingState ? 'CLEARING PAYMENT...' : 'SIMULATE REAL PAYMENT (CLEAR DEBT NOW)'}
                  </button>
                ) : (
                  <div className="py-2.5 px-4 bg-[#3DDC97]/10 border border-[#3DDC97]/30 text-[#3DDC97] text-xs font-mono rounded-xl max-w-xs mx-auto flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    LEDGER FULLY CLEARED & PAID
                  </div>
                )}
              </div>
              
              <InvoicePDF
                invoice={viewInvoice}
                project={selectedProject}
                client={client}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
