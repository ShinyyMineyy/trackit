/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Phone, Mail, Building, Plus, Search, 
  Trash2, Archive, Link2, Copy, Check, FileText, Briefcase, 
  ChevronRight, Calendar, ExternalLink, HelpCircle 
} from 'lucide-react';
import { Client, Project } from '../types';

interface ClientsProps {
  token: string;
  onNavigate: (module: string, entityId?: string) => void;
}

export default function Clients({ token, onNavigate }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  // Selected client details
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPortalToken, setSelectedPortalToken] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (data.length > 0 && !selectedClient) {
          handleSelectClient(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed fetching client records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProjects(data.projects || []);
        setSelectedPortalToken(data.portalToken || null);
      }
    } catch (e) {
      console.error('Failed fetching individual client projects:', e);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please provide at least a client name and contact email.');
      return;
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone, company, notes })
      });

      if (res.ok) {
        const data = await res.json();
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setNotes('');
        setShowCreateModal(false);
        setError('');
        fetchClients();
        if (data.client) {
          handleSelectClient(data.client);
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Failed registration.');
      }
    } catch (e) {
      setError('Connection failure during client seeding.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const confirmDelete = window.confirm('Are you absolutely sure you want to permanently delete this client profile and all associated tokens? This action is irreversible.');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedClient(null);
        fetchClients();
      }
    } catch (e) {
      console.error('Failed deleting client record:', e);
    }
  };

  const handleCopyLink = () => {
    if (!selectedPortalToken) return;
    const portalUrl = `${window.location.origin}/portal/${selectedPortalToken}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242936] pb-6">
        <div>
          <span className="text-xs font-mono text-[#3DDC97] uppercase tracking-widest block mb-1 font-semibold">CUSTOMER BASE RELATIONS</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA]">Clients File</h1>
          <p className="text-sm text-[#A8B0BF] mt-1 font-mono uppercase">Control access boundaries and client workspaces</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-mono font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          ADD OUTLET
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Clients List */}
        <div className="lg:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A8B0BF]" />
            <input 
              type="text" 
              placeholder="Filter clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#242936] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#3DDC97] transition-all"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {loading ? (
              <div className="flex justify-center p-8 font-mono text-xs text-[#A8B0BF]">LOADING CUSTOMER INDEX...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-10 text-xs font-mono text-[#A8B0BF] border border-[#242936] border-dashed rounded-xl">
                No active client connections.
              </div>
            ) : (
              filteredClients.map(c => {
                const active = selectedClient?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      active ? 'bg-[#242936]/50 border-[#3DDC97] shadow-inner' : 'bg-[#0F1115]/50 border-[#242936] hover:bg-[#171A21]'
                    }`}
                  >
                    <div className="max-w-[85%]">
                      <p className={`text-sm font-semibold truncate ${active ? 'text-[#3DDC97]' : 'text-[#F5F7FA]'}`}>{c.name}</p>
                      <p className="text-xs text-[#A8B0BF] font-mono truncate mt-0.5">{c.company || 'Private Independent'}</p>
                      <p className="text-[10px] text-[#A8B0BF] font-mono truncate mt-1">{c.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A8B0BF]" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Client details, dynamic workspace links, secure portal details */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {selectedClient ? (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Profile Cover Card */}
                <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#3DDC97]/5 to-transparent rounded-full filter blur-2xl"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#F5F7FA] flex items-center gap-2">
                        {selectedClient.name}
                      </h2>
                      <p className="text-sm text-[#3DDC97] font-mono mt-0.5">{selectedClient.company || 'Independent Private Consultant'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteClient(selectedClient.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 text-[10px] font-mono text-[#FF5D73] hover:bg-[#FF5D73]/10 rounded-lg transition-all self-start md:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      DELETE CLIENT
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#242936] mt-6 pt-5">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#A8B0BF]">
                        <Mail className="w-3.5 h-3.5 text-[#3DDC97]" />
                        <span>{selectedClient.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#A8B0BF]">
                        <Phone className="w-3.5 h-3.5 text-[#3DDC97]" />
                        <span>{selectedClient.phone || 'No phone recorded'}</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#A8B0BF]">
                        <Calendar className="w-3.5 h-3.5 text-[#3DDC97]" />
                        <span>Onboarded: {new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#A8B0BF]">
                        <Building className="w-3.5 h-3.5 text-[#3DDC97]" />
                        <span>{selectedClient.company || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedClient.notes && (
                    <div className="mt-5 p-3.5 bg-[#0F1115] border border-[#242936] rounded-xl text-xs font-sans text-[#A8B0BF]">
                      <p className="font-mono text-[#3DDC97] uppercase tracking-wider text-[9px] mb-1 font-bold">CLIENT MEMORANDUM</p>
                      {selectedClient.notes}
                    </div>
                  )}
                </div>

                {/* Secure Client Portal Token Section */}
                <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F7FA] font-mono uppercase tracking-wider">SECURE CLIENT ENTRY GATEWAY</h3>
                      <p className="text-xs text-[#A8B0BF] mt-1">Unique single-click URL. They do not require an active password profile or credential signup.</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3DDC97]/10 text-[#3DDC97] leading-none uppercase">AUTHENTICATED BY TOKEN</span>
                  </div>

                  {selectedPortalToken ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-[#0F1115] border border-[#242936] rounded-xl px-4 py-2.5 font-mono text-xs text-[#3DDC97] truncate select-all">
                        {`${window.location.origin}/portal/${selectedPortalToken}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyLink}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#242936] text-[#A8B0BF] hover:text-[#F5F7FA] bg-[#0F1115] rounded-xl text-xs font-mono transition-all hover:border-[#3DDC97]"
                        >
                          {copiedToken ? (
                            <>
                              <Check className="w-4 h-4 text-[#3DDC97]" />
                              COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              COPY LINK
                            </>
                          )}
                        </button>
                        <a
                          href={`/portal/${selectedPortalToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#3DDC97]/10 text-[#3DDC97] hover:bg-[#3DDC97]/20 rounded-xl text-xs font-mono transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          LAUNCH
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#FF5D73] font-mono leading-relaxed bg-red-950/20 border border-red-500/10 p-3 rounded-lg">
                      Could not retrieve connection details. Please contact administrator.
                    </p>
                  )}
                </div>

                {/* Client's Projects Hub */}
                <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#242936]">
                    <h3 className="text-sm font-semibold text-[#F5F7FA]">Active Contract Folders</h3>
                    <span className="text-xs font-mono text-[#A8B0BF]">{selectedProjects.length} Projects linked</span>
                  </div>

                  <div className="space-y-4">
                    {selectedProjects.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-[#A8B0BF] font-mono">No projects allocated to client.</p>
                        <button
                          onClick={() => onNavigate('projects')}
                          className="mt-3 px-3 py-1.5 bg-[#3DDC97]/15 text-[#3DDC97] hover:bg-[#3DDC97]/30 text-[10px] font-mono rounded-lg transition-all"
                        >
                          CREATE CONTRACT FILE
                        </button>
                      </div>
                    ) : (
                      selectedProjects.map(proj => (
                        <div 
                          key={proj.id}
                          onClick={() => onNavigate('projects', proj.id)}
                          className="p-4 bg-[#0F1115] hover:bg-[#242936]/20 border border-[#242936] hover:border-[#3DDC97]/40 rounded-xl cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="max-w-[75%]">
                            <h4 className="text-xs font-bold text-[#F5F7FA]">{proj.name}</h4>
                            <p className="text-[11px] text-[#A8B0BF] truncate mt-1 font-sans">{proj.description}</p>
                            <p className="text-[10px] text-[#A8B0BF] font-mono mt-2 flex items-center gap-1.5">
                              <span className="text-[#3DDC97]">Deadline:</span> {proj.deadline}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <p className="text-xs font-bold text-[#F5F7FA]">${proj.budget.toLocaleString()}</p>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase leading-none block mt-1.5 ${
                                proj.status === 'Completed' ? 'bg-[#3DDC97]/10 text-[#3DDC97]' :
                                proj.status === 'In Progress' ? 'bg-[#59F0B5]/10 text-[#59F0B5]' : 'bg-[#FFB547]/10 text-[#FFB547]'
                              }`}>
                                {proj.status}
                              </span>
                            </div>
                            <div className="w-12 h-1.5 bg-[#242936] rounded-full overflow-hidden self-center max-md:hidden">
                              <div className="h-full bg-[#3DDC97]" style={{ width: `${proj.progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-[#171A21] border border-[#242936] rounded-2xl min-h-[350px] text-center text-[#A8B0BF] gap-4">
                <Users className="w-12 h-12 text-[#242936]" />
                <p className="font-mono text-sm max-w-sm leading-relaxed">SELECT AN INSTRUMENTED OUTLET PORTAL FROM FILTER DIRECTORY BOARD</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Modal: Create Client */}
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
                  <UserPlus className="w-4 h-4 text-[#3DDC97]" />
                  ADD CLIENT WORKSPACE PROFILE
                </h3>
                <button 
                  onClick={() => { setShowCreateModal(false); setError(''); }}
                  className="text-[#A8B0BF] hover:text-[#F5F7FA] font-mono text-xs cursor-pointer px-2 py-1 bg-[#0F1115] border border-[#242936] rounded-lg"
                >
                  CLOSE
                </button>
              </div>

              {error && (
                <p className="p-3 bg-red-950/20 border border-red-500/10 text-red-400 font-mono text-xs rounded-xl mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Contact Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@company.com"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Enterprise Organization</label>
                    <input 
                      type="text" 
                      value={company} 
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Phone Line</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 000-0000"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A8B0BF] mb-1 uppercase">Collaborative Directives & Notes</label>
                  <textarea 
                    rows={3}
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide onboarding specifications, billing directions, or strategic scope rules."
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  INITIALIZE GATEWAY PORTAL
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
