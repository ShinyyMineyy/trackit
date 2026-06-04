/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Plus, Users, Calendar, DollarSign, Clock, FileText, 
  Trash2, Archive, ListChecks, RefreshCw, ChevronRight, BarChart2,
  BookOpen, Mail, Link2, FileUp, Sparkles, AlertTriangle, ExternalLink, CheckSquare
} from 'lucide-react';
import { Project, Client, Task, ProjectUpdate, Invoice, FileModel, DocumentModel, CalendarEventModel, Payment } from '../types';
import KanbanBoard from './KanbanBoard';
import WikiEditor from './WikiEditor';
import InvoicePDF from './InvoicePDF';
import { createGoogleDocument, createGoogleCalendarEvent, getCachedToken } from '../lib/google';

interface ProjectsProps {
  token: string; // JWT token
  activeProjectId?: string; // Optional deep-linked ID
  onNavigate: (module: string, entityId?: string) => void;
}

type TabId = 'tasks' | 'updates' | 'finance' | 'files' | 'docs' | 'events' | 'wiki';

export default function Projects({ token, activeProjectId, onNavigate }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected project details
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [clientProfile, setClientProfile] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [files, setFiles] = useState<FileModel[]>([]);
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [events, setEvents] = useState<CalendarEventModel[]>([]);
  const [paymentTrack, setPaymentTrack] = useState<Payment | null>(null);

  // Tab control
  const [activeTab, setActiveTab] = useState<TabId>('tasks');

  // Create Project Form Parameters
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creationStatus, setCreationStatus] = useState<Project['status']>('Pending');

  // Sub-modules actions loaders
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceDetails, setNewInvoiceDetails] = useState('');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');

  // File action attributes
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('');
  const [newFileType, setNewFileType] = useState('application/pdf');

  // Google Integration states
  const [googleStatus, setGoogleStatus] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');

  // Calendar inline helper states
  const [newCalendarTitle, setNewCalendarTitle] = useState('');
  const [newCalendarDate, setNewCalendarDate] = useState('');
  const [newCalendarTime, setNewCalendarTime] = useState('');
  const [newCalendarCategory, setNewCalendarCategory] = useState<'Meeting' | 'Milestone'>('Meeting');

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [resProj, resCli] = await Promise.all([
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resProj.ok && resCli.ok) {
        const pr = await resProj.json();
        const cl = await resCli.json();
        setProjects(pr);
        setClients(cl);

        if (pr.length > 0) {
          // Check if there is active deep link, or default selection
          const targetId = activeProjectId || pr[0].id;
          const targetProj = pr.find((p: Project) => p.id === targetId) || pr[0];
          handleSelectProject(targetProj);
        }
      }
    } catch (e) {
      setError('Connection failure loading master base data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const details = await res.json();
        setClientProfile(details.client || null);
        setTasks(details.tasks || []);
        setUpdates(details.updates || []);
        setInvoices(details.invoices || []);
        setFiles(details.files || []);
        setDocuments(details.documents || []);
        setEvents(details.events || []);
        setPaymentTrack(details.payment || null);
      }
    } catch (err) {
      console.error('Failed fetching project context layers:', err);
    }
  };

  const reloadActiveProjectDetails = () => {
    if (selectedProject) {
      handleSelectProject(selectedProject);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !budget || !deadline) {
      setError('Please provide all necessary properties to form a valid project contract.');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          clientId,
          budget: Number(budget),
          deadline,
          status: creationStatus
        })
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setClientId('');
        setBudget('');
        setDeadline('');
        setCreationStatus('Pending');
        setShowCreateModal(false);
        setError('');
        fetchBaseData();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed project formation.');
      }
    } catch (e) {
      setError('Connection lost.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const confirmDelete = window.confirm('Are you absolutely sure you want to permanently delete this project contract alignment, all subproject tasks, uploads history, and linked Google references? This action is irreversible.');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedProject(null);
        fetchBaseData();
      }
    } catch (e) {
      console.error('Project erase transaction failure:', e);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateTitle || !newUpdateContent || !selectedProject) return;

    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: newUpdateTitle,
          content: newUpdateContent
        })
      });
      if (res.ok) {
        setNewUpdateTitle('');
        setNewUpdateContent('');
        reloadActiveProjectDetails();
      }
    } catch (e) {
      console.error('Update post failed:', e);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceAmount || !newInvoiceDueDate || !selectedProject) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          date: new Date().toISOString().split('T')[0],
          dueDate: newInvoiceDueDate,
          amount: Number(newInvoiceAmount),
          details: newInvoiceDetails || 'Design/Development Phase Deliverables',
          status: 'Unpaid'
        })
      });
      if (res.ok) {
        setNewInvoiceAmount('');
        setNewInvoiceDetails('');
        setNewInvoiceDueDate('');
        reloadActiveProjectDetails();
      }
    } catch (e) {
      console.error('Billing creation failure:', e);
    }
  };

  const handleLinkFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !newFileUrl || !selectedProject) return;

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          name: newFileName,
          size: Number(newFileSize) || 1200000,
          type: newFileType,
          url: newFileUrl
        })
      });

      if (res.ok) {
        setNewFileName('');
        setNewFileUrl('');
        setNewFileSize('');
        reloadActiveProjectDetails();
      }
    } catch (e) {
      console.error('File registration failed:', e);
    }
  };

  const handleDeleteFile = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this file from the project vault? This action cannot be undone.');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        reloadActiveProjectDetails();
      }
    } catch (e) {
      console.error('Failed file erasure:', e);
    }
  };

  // Google Documents Actions Integration
  const handleCreateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !selectedProject) return;

    const googleToken = getCachedToken();
    if (!googleToken) {
      setGoogleStatus('Authenticate using Google Workspace Sign In first inside App Settings.');
      return;
    }

    try {
      setGoogleStatus('CREATING GOOGLE DOC...');
      const googleDoc = await createGoogleDocument(googleToken, newDocTitle);
      
      // Save link to local DB
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: googleDoc.title,
          googleDocId: googleDoc.documentId,
          webViewUrl: `https://docs.google.com/document/d/${googleDoc.documentId}/edit`
        })
      });

      if (res.ok) {
        setNewDocTitle('');
        setGoogleStatus('GOOGLE DOCUMENT ATTACHED SUCCESSFULLY!');
        reloadActiveProjectDetails();
        setTimeout(() => setGoogleStatus(''), 4000);
      }
    } catch (err: any) {
      setGoogleStatus(`GOOGLE ERROR: ${err.message || 'Workspace service unreachable.'}`);
    }
  };

  // Google Calendar Integration
  const handleSyncGoogleCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarTitle || !newCalendarDate || !selectedProject) return;

    const googleToken = getCachedToken();
    if (!googleToken) {
      setGoogleStatus('Authenticate using Google Workspace Sign In first inside App Settings.');
      return;
    }

    try {
      setGoogleStatus('SYNCING WITH GOOGLE CALENDAR...');
      const syncedEvent = await createGoogleCalendarEvent(
        googleToken,
        `[MintFlow] ${newCalendarTitle}`,
        `Project Alignment: ${selectedProject.name}`,
        newCalendarDate,
        newCalendarTime || undefined
      );

      // Save event locally as reference
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: newCalendarTitle,
          description: `Synced with primary account. Google ID: ${syncedEvent.id}`,
          date: newCalendarDate,
          time: newCalendarTime || undefined,
          type: newCalendarCategory,
          googleEventId: syncedEvent.id
        })
      });

      if (res.ok) {
        setNewCalendarTitle('');
        setNewCalendarDate('');
        setNewCalendarTime('');
        setGoogleStatus('EVENT SYNCED SECURELY METADATA UPDATED!');
        reloadActiveProjectDetails();
        setTimeout(() => setGoogleStatus(''), 4000);
      }
    } catch (err: any) {
      setGoogleStatus(`SYNC FAULT: ${err.message || 'Google engine refused connection.'}`);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, [token, activeProjectId]);

  return (
    <div className="space-y-6">
      {/* Page Title Panels */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242936] pb-6">
        <div>
          <span className="text-xs font-mono text-[#3DDC97] uppercase tracking-widest block mb-1 font-semibold">Active Contract Portfolios</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA]">Projects Manager</h1>
          <p className="text-sm text-[#A8B0BF] mt-1 font-mono uppercase">Sync wikis, Google references, subtasks and project timelines</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-mono font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          ALLOCATE CONTRACT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left column: Projects selector sidebar */}
        <div className="lg:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4">
          <span className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider block font-bold border-b border-[#242936] pb-2">Contract Directory</span>
          
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] font-mono py-8 text-center text-[11px]">No projects allocated yet.</p>
            ) : (
              projects.map(p => {
                const active = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      active ? 'bg-[#242936]/50 border-[#3DDC97] shadow-inner' : 'bg-[#0F1115]/50 border-[#242936] hover:bg-[#171A21]'
                    }`}
                  >
                    <p className={`text-xs font-bold truncate ${active ? 'text-[#3DDC97]' : 'text-[#F5F7FA]'}`}>{p.name}</p>
                    <p className="text-[9px] font-mono text-[#A8B0BF] uppercase mt-2">${p.budget.toLocaleString()} • {p.status}</p>
                    
                    <div className="w-full h-1 bg-[#242936] rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-[#3DDC97]" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Tab view dashboard */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Project Header summary cover board */}
                <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#3DDC97]/5 to-transparent rounded-full filter blur-3xl"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#F5F7FA]">{selectedProject.name}</h2>
                      <p className="text-xs text-[#A8B0BF] mt-1.5 leading-relaxed max-w-xl">{selectedProject.description}</p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteProject(selectedProject.id)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-red-500/20 text-[10px] font-mono text-[#FF5D73] hover:bg-[#FF5D73]/10 rounded-lg transition-all self-start md:self-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ERASE FILE
                    </button>
                  </div>

                  {/* Summary parameters list */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-[#242936]/60 pt-5 text-xs font-mono">
                    <div>
                      <span className="text-[#A8B0BF] block text-[9px] uppercase">COOPERATOR</span>
                      <span className="text-slate-300 font-sans font-semibold truncate block mt-0.5">{clientProfile?.name || 'Private Cooperator'}</span>
                    </div>
                    <div>
                      <span className="text-[#A8B0BF] block text-[9px] uppercase">CONTRACT BUDGET</span>
                      <span className="text-[#3DDC97] font-bold block mt-0.5">${selectedProject.budget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[#A8B0BF] block text-[9px] uppercase">PROJECT DEADLINE</span>
                      <span className="text-slate-300 block mt-0.5">{selectedProject.deadline}</span>
                    </div>
                    <div>
                      <span className="text-[#A8B0BF] block text-[9px] uppercase">COMPLETION STATE</span>
                      <span className="text-slate-300 block mt-0.5 font-sans font-bold">{selectedProject.progress}% Done</span>
                    </div>
                  </div>
                </div>

                {/* Subsections navigation tabs */}
                <div className="flex flex-wrap border-b border-[#242936] gap-2 pb-1 bg-[#171A21] border border-[#242936] p-1 rounded-xl text-xs font-mono">
                  {[
                    { id: 'tasks', label: 'WORK TASKS', sub: tasks.length },
                    { id: 'updates', label: 'STATUS UPDATES', sub: updates.length },
                    { id: 'finance', label: 'BILLING STATUS', sub: invoices.length },
                    { id: 'files', label: 'VAULT FILES', sub: files.length },
                    { id: 'docs', label: 'GOOGLE DOCS', sub: documents.length },
                    { id: 'events', label: 'GOOGLE CALENDAR', sub: events.length },
                    { id: 'wiki', label: 'DOCS WIKI' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabId)}
                      className={`px-3 py-1.5 select-none rounded-lg cursor-pointer transition-all flex items-center gap-1.5 font-semibold text-[10px] sm:text-xs ${
                        activeTab === tab.id 
                          ? 'bg-[#3DDC97] text-[#0F1115] font-extrabold shadow' 
                          : 'text-[#A8B0BF] hover:text-[#F5F7FA] hover:bg-[#242936]/40'
                      }`}
                    >
                      {tab.label}
                      {tab.sub !== undefined && <span className="bg-[#0F1115]/20 px-1.5 py-0.5 rounded text-[9px] leading-none">{tab.sub}</span>}
                    </button>
                  ))}
                </div>

                {/* Active tab content area */}
                <div className="space-y-6">
                  {activeTab === 'tasks' && (
                    <KanbanBoard 
                      projectId={selectedProject.id} 
                      tasks={tasks} 
                      token={token} 
                      onRefresh={reloadActiveProjectDetails} 
                    />
                  )}

                  {activeTab === 'updates' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left side checklist parameters */}
                      <div className="md:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4 font-mono text-xs">
                        <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide">Post Status Update</h3>
                        <form onSubmit={handlePostUpdate} className="space-y-4">
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Update Title *</label>
                            <input 
                              type="text" 
                              required
                              value={newUpdateTitle} 
                              onChange={(e) => setNewUpdateTitle(e.target.value)}
                              placeholder="e.g. Completed initial design sprints"
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Description Content *</label>
                            <textarea 
                              rows={4}
                              required
                              value={newUpdateContent} 
                              onChange={(e) => setNewUpdateContent(e.target.value)}
                              placeholder="Details of implemented logic, blockers, or delivery checklists."
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] resize-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            POST UPDATE
                          </button>
                        </form>
                      </div>

                      {/* Right list showing update logs */}
                      <div className="md:col-span-2 space-y-4">
                        {updates.length === 0 ? (
                          <p className="text-xs text-[#A8B0BF] font-mono bg-[#171A21] border border-[#242936] p-6 rounded-2xl text-center py-12">No status updates logged yet.</p>
                        ) : (
                          updates.map(up => (
                            <div key={up.id} className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow">
                              <div className="flex items-center justify-between pb-2 border-b border-[#242936] mb-3">
                                <h4 className="text-xs font-bold text-[#F5F7FA]">{up.title}</h4>
                                <span className="text-[9px] font-mono text-[#3DDC97]">{new Date(up.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-300 font-sans leading-relaxed">{up.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'finance' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left: Financial summaries & Create Invoice option */}
                      <div className="md:col-span-1 space-y-5 font-mono text-xs">
                        
                        <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4">
                          <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide">Contract Ledger Balance</h3>
                          {paymentTrack ? (
                            <div className="space-y-3 font-mono">
                              <div className="flex justify-between">
                                <span className="text-[#A8B0BF]">Project budget:</span>
                                <span className="text-slate-300 font-bold">${paymentTrack.totalPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#A8B0BF]">Paid to date:</span>
                                <span className="text-[#3DDC97] font-bold">${paymentTrack.paidAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-t border-[#242936] pt-1.5">
                                <span className="text-[#A8B0BF]">Unallocated balance:</span>
                                <span className="text-[#FF5D73] font-bold">${paymentTrack.remainingAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-[#A8B0BF]">Payment Status:</span>
                                <span className={`px-2 py-0.5 rounded leading-none text-[9px] font-bold ${
                                  paymentTrack.status === 'Paid' ? 'bg-[#3DDC97]/15 text-[#3DDC97]' : 'bg-[#FFB547]/15 text-[#FFB547]'
                                }`}>
                                  {paymentTrack.status}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-red-500">Finance tracking missing.</p>
                          )}
                        </div>

                        {/* Invoice creation form */}
                        <div className="p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4">
                          <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide">Generate invoice billing</h3>
                          <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Base Amount ($ USD) *</label>
                              <input 
                                type="number" 
                                required
                                value={newInvoiceAmount} 
                                onChange={(e) => setNewInvoiceAmount(e.target.value)}
                                placeholder="e.g. 5000"
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                              />
                            </div>
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Due Offset Date *</label>
                              <input 
                                type="date" 
                                required
                                value={newInvoiceDueDate} 
                                onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                              />
                            </div>
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Line Items Description</label>
                              <textarea 
                                rows={2}
                                value={newInvoiceDetails} 
                                onChange={(e) => setNewInvoiceDetails(e.target.value)}
                                placeholder="Wireframes milestone drafting / interactive charts..."
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] resize-none"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              DISPATCH BILLING
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right: Invoice entries with clickable detail viewing modals */}
                      <div className="md:col-span-2 space-y-4">
                        {invoices.length === 0 ? (
                          <p className="text-xs text-[#A8B0BF] font-mono bg-[#171A21] border border-[#242936] p-6 rounded-2xl text-center py-12">No invoices created for contract alignment.</p>
                        ) : (
                          invoices.map(inv => (
                            <div 
                              key={inv.id} 
                              onClick={() => { setActiveInvoice(inv); }}
                              className="p-4 bg-[#171A21] hover:bg-[#242936]/30 border border-[#242936] hover:border-[#3DDC97]/40 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[10px] font-mono text-[#3DDC97] font-bold leading-none">{inv.invoiceNumber}</span>
                                <h4 className="text-xs font-semibold text-[#F5F7FA] mt-1.5 truncate max-w-sm">{inv.details}</h4>
                                <p className="text-[10px] text-[#A8B0BF] font-mono mt-1">Issues date: {inv.date} • Due: {inv.dueDate}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-extrabold text-[#F5F7FA]">${inv.total.toLocaleString()}</p>
                                <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded leading-none block mt-1.5 ${
                                  inv.status === 'Paid' ? 'bg-[#3DDC97]/15 text-[#3DDC97]' : 'bg-[#FFB547]/15 text-[#FFB547]'
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'files' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left upload vault files inputs */}
                      <div className="md:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4 font-mono text-xs">
                        <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide">Register Vault Document</h3>
                        <form onSubmit={handleLinkFile} className="space-y-4">
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">File Name *</label>
                            <input 
                              type="text" 
                              required
                              value={newFileName} 
                              onChange={(e) => setNewFileName(e.target.value)}
                              placeholder="e.g. Apex_Diagnostics_Specification.pdf"
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Full Vault Access URL *</label>
                            <input 
                              type="text" 
                              required
                              value={newFileUrl} 
                              onChange={(e) => setNewFileUrl(e.target.value)}
                              placeholder="Paste cloud attachment, Drive webViewUrl, or binary CDN links."
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">File Size (Bytes)</label>
                              <input 
                                type="number" 
                                value={newFileSize} 
                                onChange={(e) => setNewFileSize(e.target.value)}
                                placeholder="e.g. 4851200"
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                              />
                            </div>
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">File Group Type</label>
                              <select 
                                value={newFileType} 
                                onChange={(e) => setNewFileType(e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                              >
                                <option value="application/pdf">Specification Sheet (.pdf)</option>
                                <option value="image/png">Visual Asset (.png)</option>
                                <option value="application/zip">Source Blueprint (.zip)</option>
                                <option value="text/markdown">Wiki Notebook (.md)</option>
                              </select>
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            LINK FILE RESOURCE
                          </button>
                        </form>
                      </div>

                      {/* Right uploaded list */}
                      <div className="md:col-span-2 space-y-4 text-xs">
                        {files.length === 0 ? (
                          <p className="text-xs text-[#A8B0BF] font-mono bg-[#171A21] border border-[#242936] p-6 rounded-2xl text-center py-12">No vault files associated with contract alignment.</p>
                        ) : (
                          files.map(f => (
                            <div key={f.id} className="p-4 bg-[#171A21] border border-[#242936] rounded-2xl shadow flex items-center justify-between gap-4 font-mono">
                              <div className="max-w-[70%]">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-[#3DDC97] shrink-0" />
                                  <h4 className="font-bold text-[#F5F7FA] truncate leading-none mt-0.5">{f.name}</h4>
                                </div>
                                <p className="text-[10px] text-[#A8B0BF] mt-2 block">
                                  Size: {(f.size / (1024 * 1024)).toFixed(2)} MB • Ver: {f.version} • Created: {new Date(f.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={f.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 bg-[#3DDC97]/10 hover:bg-[#3DDC97]/20 text-[#3DDC97] text-[10px] font-mono font-bold rounded-lg transition-all"
                                >
                                  DOWNLOAD
                                </a>
                                <button
                                  onClick={() => handleDeleteFile(f.id)}
                                  className="p-1 px-2 border border-red-500/20 hover:bg-[#FF5D73]/10 text-[#FF5D73] rounded-lg transition-all"
                                >
                                  DISCARD
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'docs' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                      {/* Create Google document panel */}
                      <div className="md:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4">
                        <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#3DDC97]" />
                          Create Google Doc
                        </h3>
                        {googleStatus && (
                          <p className="p-3 bg-[#0F1115] border border-[#242936] text-[10px] text-[#FFB547] rounded-xl uppercase leading-relaxed animate-pulse">
                            {googleStatus}
                          </p>
                        )}
                        <form onSubmit={handleCreateGoogleDoc} className="space-y-4">
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Document Title *</label>
                            <input 
                              type="text" 
                              required
                              value={newDocTitle} 
                              onChange={(e) => setNewDocTitle(e.target.value)}
                              placeholder="e.g. Apex Technical Specs"
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] rounded-xl font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Link2 className="w-4 h-4" />
                            PROVISION & LINK DOC
                          </button>
                        </form>
                      </div>

                      {/* Right documents index list */}
                      <div className="md:col-span-2 space-y-4">
                        {documents.length === 0 ? (
                          <p className="text-xs text-[#A8B0BF] font-mono bg-[#171A21] border border-[#242936] p-6 rounded-2xl text-center py-12">No Workspace Google Docs references linked.</p>
                        ) : (
                          documents.map(doc => (
                            <div key={doc.id} className="p-4 bg-[#171A21] border border-[#242936] rounded-2xl shadow flex items-center justify-between gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-[#F5F7FA]">{doc.title}</h4>
                                <p className="text-[9px] text-[#A8B0BF] mt-1.5">Mime: Google Doc File Spec • Linked: {new Date(doc.createdAt).toLocaleDateString()}</p>
                              </div>
                              <a
                                href={doc.webViewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
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

                  {activeTab === 'events' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                      {/* Left: Schedule events parameters */}
                      <div className="md:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow space-y-4">
                        <h3 className="text-xs font-bold text-[#F5F7FA] border-b border-[#242936] pb-2 uppercase tracking-wide flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#3DDC97]" />
                          Schedule Event
                        </h3>
                        {googleStatus && (
                          <p className="p-3 bg-[#0F1115] border border-[#242936] text-[10px] text-[#FFB547] rounded-xl uppercase leading-relaxed">
                            {googleStatus}
                          </p>
                        )}
                        <form onSubmit={handleSyncGoogleCalendarEvent} className="space-y-4">
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Meeting summary *</label>
                            <input 
                              type="text" 
                              required
                              value={newCalendarTitle} 
                              onChange={(e) => setNewCalendarTitle(e.target.value)}
                              placeholder="e.g. Weekly Demo Sync"
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Cutoff Date *</label>
                              <input 
                                type="date" 
                                required
                                value={newCalendarDate} 
                                onChange={(e) => setNewCalendarDate(e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                              />
                            </div>
                            <div>
                              <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Time (UTC)</label>
                              <input 
                                type="time" 
                                value={newCalendarTime} 
                                onChange={(e) => setNewCalendarTime(e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[#A8B0BF] mb-1 text-[10px] uppercase">Event Classification</label>
                            <select 
                              value={newCalendarCategory} 
                              onChange={(e) => setNewCalendarCategory(e.target.value as any)}
                              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                            >
                              <option value="Meeting">Cooperator Sync (Meeting)</option>
                              <option value="Milestone">Platform Target (Milestone)</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#3DDC97] text-[#0F1115] hover:bg-[#59F0B5] rounded-xl font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Calendar className="w-4 h-4" />
                            SYNC & POST EVENT
                          </button>
                        </form>
                      </div>

                      {/* Event registries associated with current project selection */}
                      <div className="md:col-span-2 space-y-4">
                        {events.length === 0 ? (
                          <p className="text-xs text-[#A8B0BF] font-mono bg-[#171A21] border border-[#242936] p-6 rounded-2xl text-center py-12">No scheduled milestones or meetings linked.</p>
                        ) : (
                          events.map(ev => (
                            <div key={ev.id} className="p-4 bg-[#171A21] border border-[#242936] rounded-2xl shadow flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-[#F5F7FA]">{ev.title}</h4>
                                <p className="text-[10px] text-[#A8B0BF] leading-normal">{ev.description}</p>
                                <p className="text-[9px] text-[#3DDC97] pt-1">Schedule: {ev.date} {ev.time ? `• ${ev.time} UTC` : ''}</p>
                              </div>
                              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded leading-none ${
                                ev.type === 'Deadline' ? 'bg-[#FF5D73]/15 text-[#FF5D73]' :
                                ev.type === 'Meeting' ? 'bg-[#FFB547]/15 text-[#FFB547]' : 'bg-[#3DDC97]/15 text-[#3DDC97]'
                              }`}>
                                {ev.type}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'wiki' && (
                    <WikiEditor 
                      projectId={selectedProject.id} 
                      initialContent={selectedProject.wikiContent || ''} 
                      token={token} 
                      onSaved={reloadActiveProjectDetails}
                    />
                  )}
                </div>

              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-[#171A21] border border-[#242936] rounded-2xl min-h-[350px] text-center text-[#A8B0BF] gap-4">
                <Briefcase className="w-12 h-12 text-[#242936]" />
                <p className="font-mono text-sm max-w-sm leading-relaxed uppercase">No project alignments initialized. Create a select contract folder to begin mapping operations.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Invoice Viewer overlay modal modal */}
      <AnimatePresence>
        {activeInvoice && selectedProject && clientProfile && (
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
                project={selectedProject}
                client={clientProfile}
                isAdmin={true}
                token={token}
                onStatusChanged={() => {
                  setActiveInvoice(null);
                  reloadActiveProjectDetails();
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide Modal: Create Project */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#171A21] border border-[#242936] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#242936] pb-3">
                <h3 className="text-base font-semibold text-[#F5F7FA] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#3DDC97]" />
                  ALLOCATE PROJECT CONTRACT UNIT
                </h3>
                <button 
                  onClick={() => { setShowCreateModal(false); setError(''); }}
                  className="text-[#A8B0BF] hover:text-[#F5F7FA] font-mono text-xs cursor-pointer px-2 py-1 bg-[#0F1115] border border-[#242936] rounded-lg"
                >
                  CLOSE
                </button>
              </div>

              {error && (
                <p className="p-3 bg-red-950/20 border border-red-500/10 text-red-500 font-mono text-xs rounded-xl mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Project Contract Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. diagnostics dashboard mobile app"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Link Cooperator Portal *</label>
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    >
                      <option value="">Select client alignment...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.company || 'Private'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase font-semibold">Service Description Statement</label>
                  <textarea 
                    rows={2}
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter interactive metrics, deliverable definitions, and milestones targets rules."
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Contract budget ($) *</label>
                    <input 
                      type="number" 
                      required 
                      value={budget} 
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Hard Deadline *</label>
                    <input 
                      type="date" 
                      required 
                      value={deadline} 
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Status Pillar</label>
                    <select
                      value={creationStatus}
                      onChange={(e) => setCreationStatus(e.target.value as Project['status'])}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all font-mono"
                    >
                      <option value="Pending">Pending Contract</option>
                      <option value="In Progress">In Progress development</option>
                      <option value="Review">Staging Review level</option>
                      <option value="Completed">Completed Transfer</option>
                      <option value="Cancelled">Cancelled Contract</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  INITIALIZE COOPERATOR FILES
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
