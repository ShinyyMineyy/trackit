/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Users, Clock, Tag, X, HelpCircle } from 'lucide-react';
import { CalendarEventModel, Project } from '../types';

interface CalendarProps {
  token: string;
  projects?: Project[];
  onRefresh?: () => void;
}

export default function CalendarView({ token, projects = [], onRefresh }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEventModel[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form parameters
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [type, setType] = useState<'Deadline' | 'Meeting' | 'Milestone'>('Meeting');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error('Failed fetching calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) {
      setError('Please supply an event headline title and date.');
      return;
    }

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          date: dateStr,
          time: timeStr || undefined,
          type,
          projectId: selectedProjectId || undefined
        })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setDateStr('');
        setTimeStr('');
        setSelectedProjectId('');
        setShowEventModal(false);
        setError('');
        fetchEvents();
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed scheduling calendar event.');
      }
    } catch (e) {
      setError('Connection timeout.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEvents();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error('Erase calendar target error:', e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  // Compute Calendar Month Grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const startDayOfWeek = startOfMonth.getDay(); // 0 is Sunday, 6 is Saturday

  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  const daysInMonth: (number | null)[] = [];

  // Padding days for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    daysInMonth.push(null);
  }

  // Days in current month
  for (let i = 1; i <= lastDateOfMonth; i++) {
    daysInMonth.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Action panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242936] pb-6">
        <div>
          <span className="text-xs font-mono text-[#3DDC97] uppercase tracking-widest block mb-1 font-semibold">SYNCHRONIZED CALENDARS</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA]">Deadlines & Meetings</h1>
          <p className="text-sm text-[#A8B0BF] mt-1 font-mono uppercase">Timeline logs, milestones, and customer interactions</p>
        </div>
        <button
          onClick={() => { setShowEventModal(true); setError(''); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] font-mono font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          CREATE EVENT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Calendar visual Month Grid */}
        <div className="lg:col-span-2 p-6 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#F5F7FA] font-sans">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2 bg-[#0F1115] border border-[#242936] p-1 rounded-xl">
              <button 
                onClick={handlePrevMonth}
                className="p-1 px-2 hover:bg-[#242936] rounded-lg text-[#A8B0BF] hover:text-[#3DDC97] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1 px-2 hover:bg-[#242936] rounded-lg text-[#A8B0BF] hover:text-[#3DDC97] transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono text-[#A8B0BF] border-b border-[#242936] pb-3 uppercase tracking-wider">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2 min-h-[300px]">
            {daysInMonth.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-[#0F1115]/20"></div>;
              
              // Map day date string YYYY-MM-DD
              const dateObj = new Date(year, month, day);
              const formattedDateStr = dateObj.toISOString().split('T')[0];
              
              const dayEvents = events.filter(e => e.date === formattedDateStr);

              return (
                <div 
                  key={`day-${day}`} 
                  onClick={() => {
                    setDateStr(formattedDateStr);
                    setShowEventModal(true);
                  }}
                  className="h-16 rounded-xl border border-[#242936] bg-[#0F1115]/50 hover:bg-[#242936]/20 p-1.5 flex flex-col justify-between items-start transition-all cursor-pointer relative group lg:p-2"
                >
                  <span className="text-xs font-mono text-[#A8B0BF] font-semibold">{day}</span>
                  
                  {/* Small visual dots previewing event category */}
                  <div className="flex flex-wrap gap-1 mt-1 max-w-full overflow-hidden">
                    {dayEvents.map(ev => (
                      <span 
                        key={ev.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === 'Deadline' ? 'bg-[#FF5D73]' :
                          ev.type === 'Meeting' ? 'bg-[#FFB547]' : 'bg-[#3DDC97]'
                        }`}
                        title={ev.title}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Events List view */}
        <div className="lg:col-span-1 p-5 bg-[#171A21] border border-[#242936] rounded-2xl shadow-lg space-y-4 max-h-[460px] overflow-y-auto">
          <h3 className="text-xs font-mono text-[#3DDC97] uppercase tracking-wider border-b border-[#242936] pb-2 font-bold">
            Events Schedule Diary
          </h3>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-[#A8B0BF] font-mono text-center py-10">LOADING CALENDAR SLOTS...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-[#A8B0BF] font-mono text-center py-10">No events currently scheduled.</p>
            ) : (
              events.map(ev => (
                <div 
                  key={ev.id} 
                  className="p-3 bg-[#0F1115] border border-[#242936] rounded-xl flex items-start justify-between gap-2"
                >
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        ev.type === 'Deadline' ? 'bg-[#FF5D73]' :
                        ev.type === 'Meeting' ? 'bg-[#FFB547]' : 'bg-[#3DDC97]'
                      }`} />
                      <h4 className="text-xs font-bold text-[#F5F7FA] truncate">{ev.title}</h4>
                    </div>
                    {ev.description && (
                      <p className="text-[10px] text-[#A8B0BF] font-sans truncate">{ev.description}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-[#3DDC97]">
                      <span>{ev.date}</span>
                      {ev.time && <span>• {ev.time} UTC</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="text-xs text-[#FF5D73] font-mono cursor-pointer p-1 hover:bg-[#FF5D73]/10 rounded transition-all shrink-0"
                  >
                    DISMISS
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#171A21] border border-[#242936] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-[#242936] pb-3">
              <h3 className="text-sm font-semibold text-[#F5F7FA] font-mono flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3DDC97]" />
                SCHEDULE CALENDAR EVENT
              </h3>
              <button 
                onClick={() => { setShowEventModal(false); setError(''); }}
                className="text-[#A8B0BF] hover:text-[#F5F7FA] border border-[#242936] bg-[#0F1115] font-mono text-xs cursor-pointer px-2 py-0.5 rounded-lg"
              >
                CLOSE
              </button>
            </div>

            {error && (
              <p className="p-3 bg-red-950/20 border border-red-500/10 text-red-500 font-mono text-xs rounded-xl mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Event Title *</label>
                <input 
                  type="text" 
                  required
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Apex Deliverable Handover"
                  className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                />
              </div>

              <div>
                <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Description & Coordinates</label>
                <textarea 
                  rows={2}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Insert address coordinates, credentials link, or notes tracker."
                  className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Date *</label>
                  <input 
                    type="date" 
                    required
                    value={dateStr} 
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Time (UTC)</label>
                  <input 
                    type="time" 
                    value={timeStr} 
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Category Classification</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                  >
                    <option value="Meeting">Team Meeting</option>
                    <option value="Deadline">Hard Deadline</option>
                    <option value="Milestone">Platform Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Link Project Contract</label>
                  <select 
                    value={selectedProjectId} 
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                  >
                    <option value="">No selective link</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] rounded-xl font-bold transition-all mt-2 active:scale-95"
              >
                SYNC SCHEDULE EVENT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
