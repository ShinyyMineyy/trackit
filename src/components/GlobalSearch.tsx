/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, Users, FileText, CheckSquare, FileUp, X, MoveRight, ArrowUpRight } from 'lucide-react';

interface GlobalSearchProps {
  token: string;
  onNavigate: (module: string, entityId?: string) => void;
  onClose: () => void;
}

export default function GlobalSearch({ token, onNavigate, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ clients: [], projects: [], tasks: [], invoices: [], files: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      setResults({ clients: [], projects: [], tasks: [], invoices: [], files: [] });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error('Global query search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      executeQuery();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    
    // Keyboard listener to exit with escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalResults = 
    results.clients.length + 
    results.projects.length + 
    results.tasks.length + 
    results.invoices.length + 
    results.files.length;

  return (
    <div className="fixed inset-0 bg-[#0F1115]/90 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-16 sm:pt-28">
      {/* Search box shell */}
      <div className="w-full max-w-2xl bg-[#171A21] border border-[#242936] rounded-2xl shadow-2xl flex flex-col max-h-[500px] overflow-hidden">
        
        {/* Search header inputs */}
        <div className="p-4 border-b border-[#242936] flex items-center gap-3 relative">
          <Search className="w-5 h-5 text-[#3DDC97]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Fuzzy-search across clients, projects, tasks, invoices, or files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-[#F5F7FA] font-mono focus:ring-0 placeholder-[#A8B0BF]"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-[#3DDC97] border-t-transparent rounded-full animate-spin"></div>
          )}
          <button 
            onClick={onClose}
            className="p-1 border border-[#242936] text-[#A8B0BF] hover:text-[#FF5D73] bg-[#0F1115] hover:bg-neutral-900 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results canvas block */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {query.trim() === '' ? (
            <div className="text-center py-12 text-[#A8B0BF]">
              <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-mono uppercase tracking-widest leading-relaxed">TYPE ANY CONTEXT CORNER SIGNATURE TO BEGIN SEARCHING</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Clients, project contracts, billing codes, or filename stems.</p>
            </div>
          ) : totalResults === 0 && !loading ? (
            <div className="text-center py-12 text-[#A8B0BF]">
              <p className="text-xs font-mono uppercase">Zero matches mapped on query: "{query}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Clients Section */}
              {results.clients.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider pb-1.5 border-b border-[#242936] mb-2 font-bold">Clients Profiles</h4>
                  <div className="space-y-1.5">
                    {results.clients.map((c: any) => (
                      <div 
                        key={c.id} 
                        onClick={() => { onNavigate('clients', c.id); onClose(); }}
                        className="p-3 bg-[#0F1115]/50 hover:bg-[#242936]/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-[#A8B0BF]" />
                          <div>
                            <p className="text-xs font-bold text-[#F5F7FA]">{c.name}</p>
                            <p className="text-[10px] font-mono text-[#A8B0BF] mt-0.5">{c.company || 'Private Recipient'}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {results.projects.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider pb-1.5 border-b border-[#242936] mb-2 font-bold">Project Contracts</h4>
                  <div className="space-y-1.5">
                    {results.projects.map((p: any) => (
                      <div 
                        key={p.id} 
                        onClick={() => { onNavigate('projects', p.id); onClose(); }}
                        className="p-3 bg-[#0F1115]/50 hover:bg-[#242936]/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-4 h-4 text-[#3DDC97]" />
                          <div>
                            <p className="text-xs font-bold text-[#F5F7FA]">{p.name}</p>
                            <p className="text-[10px] font-mono text-[#A8B0BF] mt-0.5">${p.budget.toLocaleString()} • Deadline: {p.deadline}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Section */}
              {results.tasks.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider pb-1.5 border-b border-[#242936] mb-2 font-bold">Tasks Subprojects</h4>
                  <div className="space-y-1.5">
                    {results.tasks.map((t: any) => (
                      <div 
                        key={t.id} 
                        onClick={() => { onNavigate('projects', t.projectId); onClose(); }}
                        className="p-3 bg-[#0F1115]/50 hover:bg-[#242936]/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CheckSquare className="w-4 h-4 text-[#FFB547]" />
                          <div>
                            <p className="text-xs font-bold text-[#F5F7FA]">{t.title}</p>
                            <p className="text-[10px] font-mono text-[#A8B0BF] mt-0.5">Status: {t.status}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              {results.invoices.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-[#3DDC97] uppercase tracking-wider pb-1.5 border-b border-[#242936] mb-2 font-bold">Billing Records</h4>
                  <div className="space-y-1.5">
                    {results.invoices.map((i: any) => (
                      <div 
                        key={i.id} 
                        onClick={() => { onNavigate('invoices'); onClose(); }}
                        className="p-3 bg-[#0F1115]/50 hover:bg-[#242936]/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-xs font-bold text-[#F5F7FA]">{i.invoiceNumber}</p>
                            <p className="text-[10px] font-mono text-[#A8B0BF] mt-0.5">Total: ${i.total.toLocaleString()} • Surcharge: Paid ({i.status})</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="p-3.5 bg-[#0F1115] border-t border-[#242936] text-[10px] font-mono text-center text-[#A8B0BF]">
          Press <span className="text-[#3DDC97]">ESC</span> to close or exit global searching dialog.
        </div>
      </div>
    </div>
  );
}
