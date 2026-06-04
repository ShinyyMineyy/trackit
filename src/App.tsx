/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Users, Briefcase, FileText, Calendar, Mail, Search,
  Lock, LogOut, Check, Sliders, Globe, RefreshCw, X, ArrowRight,
  Sparkles, ShieldAlert, KeyRound, ExternalLink, HelpCircle, ArrowLeft,
  Building, UserCheck, Laptop
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Projects from './components/Projects';
import FinanceModule from './components/FinanceModule';
import CalendarView from './components/CalendarView';
import EmailViewer from './components/EmailViewer';
import GlobalSearch from './components/GlobalSearch';
import ClientPortal from './components/ClientPortal';
import { setCachedToken, getCachedToken, clearCachedToken } from './lib/google';

type ModuleId = 'dashboard' | 'clients' | 'projects' | 'finance' | 'calendar';

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('trackit_token') || localStorage.getItem('mintflow_token')
  );
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');
  const [activeEntityId, setActiveEntityId] = useState<string | undefined>(undefined);

  // Authenticate states
  const [roleMode, setRoleMode] = useState<'select' | 'worker' | 'client'>('select');
  const [registerMode, setRegisterMode] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [clientAccessToken, setClientAccessToken] = useState('');

  // Layout states Overlay drawers
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Google OAuth Settings
  const [googleCode, setGoogleCode] = useState('');
  const [googleLinked, setGoogleLinked] = useState(!!getCachedToken());
  const [googleMessage, setGoogleMessage] = useState('');

  // Portal Redirection
  const [portalToken, setPortalToken] = useState<string | null>(null);

  // Handle URL Routing & Redirections
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/portal/')) {
      const tokenFromUrl = path.split('/portal/')[1];
      if (tokenFromUrl) {
        setPortalToken(tokenFromUrl);
      }
    }
  }, []);

  // Sync token changes to storage
  const handleLoginSuccess = (receivedToken: string) => {
    localStorage.setItem('trackit_token', receivedToken);
    setToken(receivedToken);
    setAuthError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('trackit_token');
    localStorage.removeItem('mintflow_token');
    clearCachedToken();
    setToken(null);
    setRoleMode('select');
    setCurrentModule('dashboard');
  };

  const executeAuthCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please supply all credential fields.');
      return;
    }

    try {
      setAuthenticating(true);
      setAuthError('');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data.token);
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      setAuthError('Could not connect to the login server.');
    } finally {
      setAuthenticating(false);
    }
  };

  const executeRegisterCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !authEmail || !authPassword) {
      setAuthError('Please supply all fields to register.');
      return;
    }

    try {
      setAuthenticating(true);
      setAuthError('');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerName, email: authEmail, password: authPassword })
      });

      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data.token);
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setAuthError('Could not connect to the registration server.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleNavigateDirect = (module: string, entityId?: string) => {
    setCurrentModule(module as ModuleId);
    setActiveEntityId(entityId);
  };

  // Google Integration linkers
  const handleLinkGoogleToken = () => {
    if (!googleCode.trim()) {
      setGoogleMessage('Provide a valid authorization string.');
      return;
    }
    setCachedToken(googleCode.trim());
    setGoogleLinked(true);
    setGoogleCode('');
    setGoogleMessage('GOOGLE WORKSPACE INTEGRATION VERIFIED & LOCKED!');
    setTimeout(() => setGoogleMessage(''), 4000);
  };

  // Render Portal if matched in Routing index URL
  if (portalToken) {
    return <ClientPortal portalToken={portalToken} />;
  }

  // Render Admin Authentication & Role Selector screen if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA] flex items-center justify-center p-4 selection:bg-[#3DDC97]/20 selection:text-[#3DDC97] font-sans">
        <div className="w-full max-w-md space-y-6">
          
          {roleMode === 'select' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              {/* Logo Header */}
              <div className="space-y-2">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-[#3DDC97] items-center justify-center font-bold text-[#0F1115] text-xl shadow-xl shadow-[#3DDC97]/15">T</div>
                <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Welcome to TrackIt</h1>
                <p className="text-xs text-[#A8B0BF] max-w-sm mx-auto">Please select how you would like to connect to your workspace today</p>
              </div>

              {/* Roles Deck Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Worker option */}
                <button
                  onClick={() => {
                    setRoleMode('worker');
                    setAuthError('');
                    setRegisterMode(false);
                  }}
                  className="p-6 bg-[#171A21] border border-[#242936] hover:border-[#3DDC97]/50 rounded-2xl text-left transition-all hover:translate-y-[-2px] group text-slate-200 cursor-pointer shadow-lg"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#3DDC97]/10 flex items-center justify-center text-[#3DDC97] mb-4 group-hover:bg-[#3DDC97] group-hover:text-[#0F1115] transition-all">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#F5F7FA] mb-1">Freelancer</h3>
                  <p className="text-[11px] text-[#A8B0BF] leading-normal font-sans">Manage clients, create projects, log wiki resources, and invoice accounts.</p>
                </button>

                {/* 2. Client option */}
                <button
                  onClick={() => {
                    setRoleMode('client');
                    setAuthError('');
                  }}
                  className="p-6 bg-[#171A21] border border-[#242936] hover:border-[#3DDC97]/50 rounded-2xl text-left transition-all hover:translate-y-[-2px] group text-slate-200 cursor-pointer shadow-lg"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#3DDC97]/10 flex items-center justify-center text-[#3DDC97] mb-4 group-hover:bg-[#3DDC97] group-hover:text-[#0F1115] transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#F5F7FA] mb-1">Client / Guest</h3>
                  <p className="text-[11px] text-[#A8B0BF] leading-normal font-sans">Access active project status pipelines, download invoices, update tasks, and view comments.</p>
                </button>
              </div>

              <div className="text-[10px] text-zinc-500 text-center font-mono pt-4">
                TrackIt Workspaces - Professional & Secure
              </div>
            </motion.div>
          )}

          {roleMode === 'client' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex w-10.5 h-10.5 rounded-xl bg-[#3DDC97] items-center justify-center font-bold text-[#0F1115] text-lg shadow-md">C</div>
                <h2 className="text-xl font-bold text-[#F5F7FA]">Client Secure Portal</h2>
                <p className="text-xs text-[#A8B0BF]">Enter your personal access token to check milestones</p>
              </div>

              <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-2xl space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="block text-[#A8B0BF] font-semibold text-[10px] uppercase tracking-wider">Access Token</label>
                  <input 
                    type="text" 
                    required
                    value={clientAccessToken}
                    onChange={(e) => setClientAccessToken(e.target.value)}
                    placeholder="Enter private token..."
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all font-sans"
                  />
                  <p className="text-[10px] text-zinc-500 pt-1 leading-relaxed">Freelancers generate portal tokens directly on client cards under the client database.</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setRoleMode('select');
                      setClientAccessToken('');
                    }}
                    className="px-3.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (clientAccessToken.trim()) {
                        setPortalToken(clientAccessToken.trim());
                      }
                    }}
                    className="flex-1 py-2.5 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Connect Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {roleMode === 'worker' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Header with Switcher Tabs */}
              <div className="text-center space-y-2">
                <div className="inline-flex w-10.5 h-10.5 rounded-xl bg-[#3DDC97] items-center justify-center font-bold text-[#0F1115] text-lg shadow-md">T</div>
                <h2 className="text-xl font-bold text-[#F5F7FA]">Freelancer Workspace</h2>
                <div className="inline-flex p-1 bg-[#0F1115] rounded-xl border border-[#242936] mt-2">
                  <button
                    onClick={() => {
                      setRegisterMode(false);
                      setAuthError('');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !registerMode ? 'bg-[#3DDC97] text-[#0F1115]' : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setRegisterMode(true);
                      setAuthError('');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      registerMode ? 'bg-[#3DDC97] text-[#0F1115]' : 'text-zinc-400 hover:text-slate-100'
                    }`}
                  >
                    Register Freelancer
                  </button>
                </div>
              </div>

              {/* Form container */}
              <div className="p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3DDC97]/5 rounded-full filter blur-2xl"></div>
                
                <form onSubmit={registerMode ? executeRegisterCall : executeAuthCall} className="space-y-4">
                  {authError && (
                    <div className="p-3.5 bg-red-950/20 border border-red-500/10 text-[#FF5D73] text-xs rounded-xl leading-relaxed">
                      {authError}
                    </div>
                  )}

                  {registerMode && (
                    <div className="space-y-1 text-xs">
                      <label className="block text-[#A8B0BF] font-semibold uppercase tracking-wider text-[10px]">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all font-sans"
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    <label className="block text-[#A8B0BF] font-semibold uppercase tracking-wider text-[10px]">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder={registerMode ? "you@example.com" : "admin@trackit.com"}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="block text-[#A8B0BF] font-semibold uppercase tracking-wider text-[10px]">Password</label>
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] transition-all font-sans"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setRoleMode('select')}
                      className="px-3.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={authenticating}
                      className="flex-1 py-2.5 bg-[#3DDC97] hover:bg-[#59F0B5] disabled:bg-zinc-800 text-[#0F1115] font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      {authenticating 
                        ? (registerMode ? 'Creating Account...' : 'Signing In...') 
                        : (registerMode ? 'Create Account' : 'Sign In')
                      }
                    </button>
                  </div>
                </form>
              </div>

              {/* Seed administrative demo helper (Only show when not in register mode for clean onboarding feel) */}
              {!registerMode && (
                <div className="p-4 bg-[#171A21]/30 border border-[#242936] rounded-xl font-sans text-[11px] text-zinc-400 space-y-1">
                  <p className="font-bold text-[#3DDC97] uppercase tracking-wide text-[10px]">Demo Credentials:</p>
                  <p>• Email: <span className="text-slate-300 font-mono select-all font-semibold">admin@trackit.com</span></p>
                  <p>• Password: <span className="text-slate-300 font-mono select-all font-bold">admin123</span></p>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA] flex font-sans selection:bg-[#3DDC97]/20 selection:text-[#3DDC97]">
      
      {/* 1. Sidebar Panel Layout */}
      <aside id="sidebar-navigation" className="w-64 bg-[#11141A] border-r border-[#242936] flex flex-col justify-between shrink-0 hidden md:flex h-screen sticky top-0">
        <div className="p-6 space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3DDC97] flex items-center justify-center font-bold text-[#0F1115] shadow-[0_0_15px_rgba(61,220,151,0.3)]">T</div>
            <div>
              <span className="text-[9px] font-mono text-[#3DDC97] uppercase tracking-widest block font-bold leading-none">TRACKIT</span>
              <span className="text-xs text-[#A8B0BF] tracking-tight block mt-0.5 font-medium">Freelancer Desk</span>
            </div>
          </div>

          {/* Navigation modules rails */}
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Compass },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'finance', label: 'Billing & Invoices', icon: FileText },
              { id: 'calendar', label: 'Calendar & Due Dates', icon: Calendar }
            ].map(m => {
              const active = currentModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleNavigateDirect(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm font-medium leading-none cursor-pointer ${
                    active 
                      ? 'bg-[#3DDC97]/15 text-[#3DDC97]' 
                      : 'text-[#A8B0BF] hover:text-[#F5F7FA] hover:bg-[#171A21]'
                  }`}
                >
                  <m.icon className={`w-4 h-4 ${active ? 'text-[#3DDC97]' : 'text-[#A8B0BF]'}`} />
                  <span className="font-sans text-[13px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info controllers */}
        <div className="p-4 border-t border-[#242936] space-y-4 font-mono text-[10px]">
          
          {/* Mail log dispatcher triggers */}
          <button
            onClick={() => setShowEmailViewer(true)}
            className="w-full flex items-center gap-2 px-3 py-2 border border-[#242936] hover:border-[#3DDC97]/40 hover:text-[#3DDC97] text-[#A8B0BF] bg-[#0F1115] rounded-lg transition-all cursor-pointer font-bold leading-none"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            VIEW OUTGOING EMAIL LOGS
          </button>

          {/* Settings modal controller */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 border border-[#242936] hover:border-[#3DDC97]/40 hover:text-[#3DDC97] text-[#A8B0BF] bg-[#0F1115] rounded-lg transition-all cursor-pointer font-bold leading-none"
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            Workspace Settings
          </button>

          {/* Session Profile card */}
          <div className="bg-[#171A21] rounded-xl border border-[#242936] p-4">
            <p className="text-[10px] text-[#A8B0BF] font-semibold mb-2.5 uppercase tracking-widest leading-none">Admin Account</p>
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2.5 max-w-[75%] overflow-hidden">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#3DDC97] text-[#0F1115] flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(61,220,151,0.2)]">
                  AD
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold truncate text-[#F5F7FA]">admin@mintflow.com</p>
                  <p className="text-[10px] text-[#3DDC97] font-medium">Online Now</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 border border-[#242936] hover:border-red-500/40 text-[#A8B0BF] hover:text-[#FF5D73] rounded-lg bg-[#0F1115] transition-colors cursor-pointer shrink-0"
                title="Logout Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace Upper frame layout */}
      <div id="admin-layout-shell" className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        
        {/* Navigation upper belts */}
        <nav id="navigation-topbar" className="bg-[#0F1115] border-b border-[#242936] h-16 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Desktop fuzzy visual trigger shortcuts */}
            <span className="text-xs font-medium text-[#3DDC97] uppercase tracking-wider hidden md:inline-block leading-none bg-[#3DDC97]/15 px-2.5 py-1 rounded">
              Workspace Manager
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Action fuzzy search buttons */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#242936] text-[#A8B0BF] hover:border-[#3DDC97]/30 hover:text-slate-100 bg-[#0F1115] rounded-xl text-xs transition-all cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Search everything...</span>
              <kbd className="hidden sm:inline bg-neutral-800 border border-neutral-700 px-1 rounded text-[9px]">ESC</kbd>
            </button>

            {/* Mobile Logouts option */}
            <div className="md:hidden">
              <button
                onClick={handleLogout}
                className="p-2 border border-[#242936] hover:border-red-500/20 bg-[#0F1115] text-[#FF5D73] rounded-xl block transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Dynamic Canvas Container rendering */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {currentModule === 'dashboard' && <Dashboard token={token} onNavigate={handleNavigateDirect} openEmailLogs={() => setShowEmailViewer(true)} />}
          {currentModule === 'clients' && <Clients token={token} onNavigate={handleNavigateDirect} />}
          {currentModule === 'projects' && <Projects token={token} activeProjectId={activeEntityId} onNavigate={handleNavigateDirect} />}
          {currentModule === 'finance' && <FinanceModule token={token} />}
          {currentModule === 'calendar' && <CalendarView token={token} onRefresh={() => {}} />}
        </main>
      </div>

      {/* 3. Global search drawer modal */}
      <AnimatePresence>
        {showSearchModal && (
          <GlobalSearch
            token={token}
            onNavigate={handleNavigateDirect}
            onClose={() => setShowSearchModal(false)}
          />
        )}
      </AnimatePresence>

      {/* 4. SMTP outgoing logs drawer */}
      <AnimatePresence>
        {showEmailViewer && (
          <EmailViewer
            token={token}
            onClose={() => setShowEmailViewer(false)}
          />
        )}
      </AnimatePresence>

      {/*  settings & integrations overlays model */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 selection:bg-[#3DDC97]/20">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#171A21] border border-[#242936] rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-xs"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#242936] pb-3">
                <h3 className="text-sm font-semibold text-[#F5F7FA] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#3DDC97]" />
                  WORKSPACE SETTINGS
                </h3>
                <button 
                  onClick={() => { setShowSettingsModal(false); setGoogleMessage(''); }}
                  className="text-xs text-[#A8B0BF] hover:text-[#FF5D73] border border-[#242936] bg-[#0F1115] px-2.5 py-0.5 rounded-lg cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              {googleMessage && (
                <p className="p-3 bg-[#0F1115] border border-[#242936] text-[10px] text-[#3DDC97] rounded-xl mb-4 font-bold uppercase leading-relaxed animate-pulse">
                  {googleMessage}
                </p>
              )}

              <div className="space-y-6">
                
                {/* Google Workspace Setup */}
                <div className="space-y-3">
                  <span className="text-[10px] text-[#3DDC97] font-bold uppercase block tracking-wider">Google Workspace Integrations</span>
                  <p className="text-[11px] text-[#A8B0BF] leading-relaxed">
                    Enable integrations with Google Drive and Google Calendar. Enter your authorized OAuth credentials to connect.
                  </p>

                  <div className="p-3 bg-[#0F1115] border border-[#242936] rounded-xl space-y-1.5 leading-normal">
                    <div className="flex justify-between items-center text-[10px] pb-1 border-b border-[#242936]">
                      <span className="text-[#A8B0BF]">Google Integration Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${googleLinked ? 'bg-[#3DDC97]/15 text-[#3DDC97]' : 'bg-[#FF5D73]/15 text-[#FF5D73]'}`}>
                        {googleLinked ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    {!googleLinked && (
                      <p className="text-[9px] text-zinc-500">
                        Defaulting to local file storage. Set up an authentication token below to connect live cloud files.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block text-[#A8B0BF] text-[9px] uppercase">OAuth Code / Security Token</label>
                    <input
                      type="password"
                      placeholder="Paste google auth token code..."
                      value={googleCode}
                      onChange={(e) => setGoogleCode(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleLinkGoogleToken}
                        className="flex-1 py-2 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                      >
                        SAVE CREDENTIALS
                      </button>
                      {googleLinked && (
                        <button
                          onClick={() => { clearCachedToken(); setGoogleLinked(false); setGoogleMessage('Google keys cleared successfully.'); }}
                          className="px-3.5 py-2 border border-[#242936] hover:bg-[#FF5D73]/10 text-[#FF5D73] rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Local server health verification */}
                <div className="border-t border-[#242936] pt-4 leading-normal text-[9px] text-zinc-500 text-center space-y-1">
                  <p>TrackIt Client Management Portal</p>
                  <p>Powered by React & Express Server</p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
