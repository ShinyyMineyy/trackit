/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Play, Edit, Trash2, Calendar, FileText, 
  CheckSquare, ArrowRight, Eye, Clipboard, HelpCircle
} from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface KanbanProps {
  projectId: string;
  tasks: Task[];
  token: string;
  onRefresh: () => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; border: string }[] = [
  { id: 'Todo', label: 'Todo Pipeline', color: 'bg-zinc-800/10 text-[#A8B0BF]', border: 'border-zinc-800' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-[#FFB547]/5 text-[#FFB547]', border: 'border-[#FFB547]/30' },
  { id: 'Review', label: 'Client Evaluation', color: 'bg-blue-500/5 text-blue-400', border: 'border-blue-500/25' },
  { id: 'Done', label: 'Fully Completed', color: 'bg-[#3DDC97]/5 text-[#3DDC97]', border: 'border-[#3DDC97]/30' }
];

export default function KanbanBoard({ projectId, tasks, token, onRefresh }: KanbanProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [error, setError] = useState('');

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (colId: TaskStatus) => {
    if (!draggedTaskId) return;
    
    try {
      const res = await fetch(`/api/tasks/${draggedTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: colId })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error('Drag drop backend update error:', e);
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setError('Please provide a task title and final cutoff due date.');
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ projectId, title, description, status, dueDate })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setDueDate('');
        setStatus('Todo');
        setShowCreateForm(false);
        setError('');
        onRefresh();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed task allocation.');
      }
    } catch (e) {
      setError('Service unavailable.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this task?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error('Failed erasing task:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Board Summary Metric and Action Button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F5F7FA] font-mono uppercase tracking-wider">Sub Tasks Board</h3>
          <p className="text-xs text-[#A8B0BF] mt-0.5">Drag & drop cards across pipelines to organize milestones instantly.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#3DDC97]/10 hover:bg-[#3DDC97]/20 border border-[#3DDC97]/30 text-xs text-[#3DDC97] font-mono rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          ALLOCATE TASK
        </button>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        {COLUMNS.map(col => {
          const filteredTasks = tasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className="p-4 bg-[#171A21] border border-[#242936] rounded-2xl flex flex-col min-h-[350px] shadow"
            >
              <div className="flex items-center justify-between border-b border-[#242936] pb-3 mb-4">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${col.color} border ${col.border}`}>
                  {col.label}
                </span>
                <span className="text-[10px] font-mono text-[#A8B0BF]">{filteredTasks.length} left</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-[#242936] hover:border-zinc-800 transition-all flex items-center justify-center p-3 text-center">
                    <p className="text-[10px] text-[#A8B0BF] font-mono uppercase">Pipeline Empty</p>
                  </div>
                ) : (
                  filteredTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => handleDragStart(t.id)}
                      className="p-3.5 bg-[#0F1115] border border-[#242936] hover:border-[#3DDC97]/40 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 hover:shadow-lg group"
                    >
                      <h4 className="text-xs font-semibold text-[#F5F7FA] group-hover:text-[#3DDC97] transition-all leading-relaxed">
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[10px] text-[#A8B0BF] mt-1.5 font-sans leading-relaxed line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between border-t border-[#242936] mt-3.5 pt-2 font-mono text-[9px] text-[#A8B0BF]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#3DDC97]" />
                          {t.dueDate}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-[#FF5D73] opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 transition-all cursor-pointer p-0.5 rounded hover:bg-red-950/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full overlay task create form */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#171A21] border border-[#242936] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#242936] pb-3">
                <h4 className="text-sm font-semibold text-[#F5F7FA] font-mono flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#3DDC97]" />
                  ALLOCATE PROJECT WORK TASK
                </h4>
                <button 
                  onClick={() => { setShowCreateForm(false); setError(''); }}
                  className="text-xs font-mono text-[#A8B0BF] hover:text-[#F5F7FA] border border-[#242936] bg-[#0F1115] rounded-lg px-2.5 py-1"
                >
                  CLOSE
                </button>
              </div>

              {error && (
                <p className="p-3 bg-red-950/20 border border-red-500/10 text-red-400 font-mono text-xs rounded-xl mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Task Title *</label>
                  <input 
                    type="text" 
                    required
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Code auth routing specs"
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                  />
                </div>

                <div>
                  <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Description</label>
                  <textarea 
                    rows={2}
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Include credentials, URLs, scopes, or deliverable checklist items."
                    className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Due Date *</label>
                    <input 
                      type="date" 
                      required
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A8B0BF] mb-1 uppercase tracking-wider text-[10px]">Start Pillar</label>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="w-full bg-[#0F1115] border border-[#242936] rounded-xl text-xs text-[#F5F7FA] px-3.5 py-2.5 focus:outline-none focus:border-[#3DDC97]"
                    >
                      <option value="Todo">Todo Pipeline</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Evaluation</option>
                      <option value="Done">Completed</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#3DDC97] hover:bg-[#59F0B5] text-[#0F1115] rounded-xl font-bold transition-all mt-2 active:scale-95"
                >
                  SEED WORKFLOW FIELD
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
