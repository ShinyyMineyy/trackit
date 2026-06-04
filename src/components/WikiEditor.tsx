/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  FileText, Save, Heading1, Heading2, List, Code, CheckSquare, 
  HelpCircle, Sparkles, Columns, BookOpen, Bold, Italic, Link2 
} from 'lucide-react';

interface WikiEditorProps {
  projectId: string;
  initialContent: string;
  token: string;
  onSaved?: () => void;
}

export default function WikiEditor({ projectId, initialContent, token, onSaved }: WikiEditorProps) {
  const [content, setContent] = useState(initialContent || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/projects/${projectId}/wiki`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        setSuccess('Wiki saved successfully!');
        if (onSaved) onSaved();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      console.error('Failed saving project wiki:', e);
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (syntax: string, placeholder = '') => {
    const textarea = document.getElementById(`wiki-textarea-${projectId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const startIdx = textarea.selectionStart;
    const endIdx = textarea.selectionEnd;
    const baseText = textarea.value;

    const selectionText = baseText.substring(startIdx, endIdx) || placeholder;
    const insertion = syntax.replace('$', selectionText);

    const nextContent = baseText.substring(0, startIdx) + insertion + baseText.substring(endIdx);
    setContent(nextContent);

    // Dynamic focus focus offset correction
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startIdx + insertion.length, startIdx + insertion.length);
    }, 100);
  };

  // Safe client-side markdown viewer compilation
  // Avoid importing large react-markdown engine to remain extremely lightning fast
  const parseMarkdownHtml = (rawText: string) => {
    if (!rawText) return '<p class="text-[#A8B0BF] italic font-mono text-center py-8">Documentation Wiki empty. Start typing to edit.</p>';

    // Sanitize and replace markdown lines
    const lines = rawText.split('\n');
    let htmlLines = lines.map(line => {
      let trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        return `<h1 class="text-2xl font-bold font-sans tracking-tight text-[#F5F7FA] mt-6 mb-2 pb-1 border-b border-[#242936]">${trimmed.substring(2)}</h1>`;
      }
      // Heading 2
      if (trimmed.startsWith('## ')) {
        return `<h2 class="text-lg font-bold font-sans tracking-tight text-[#3DDC97] mt-4 mb-2">${trimmed.substring(3)}</h2>`;
      }
      // Heading 3
      if (trimmed.startsWith('### ')) {
        return `<h3 class="text-base font-bold font-sans tracking-tight text-[#F5F7FA] mt-3 mb-1.5">${trimmed.substring(4)}</h3>`;
      }
      // Code blocks
      if (trimmed.startsWith('```')) {
        return `<pre class="bg-[#0F1115] border border-[#242936] p-3 rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto my-3">`;
      }
      if (trimmed === '```') {
        return `</pre>`;
      }
      // Checklists
      if (trimmed.startsWith('- [ ] ')) {
        return `<div class="flex items-center gap-2 text-xs font-sans text-slate-300 my-1"><input type="checkbox" disabled class="rounded border-[#242936] bg-[#0F1115]" /> <span>${trimmed.substring(6)}</span></div>`;
      }
      if (trimmed.startsWith('- [x] ')) {
        return `<div class="flex items-center gap-2 text-xs font-sans text-[#3DDC97] my-1"><input type="checkbox" checked disabled class="rounded border-[#242936] bg-[#0F1115]" /> <span class="line-through">${trimmed.substring(6)}</span></div>`;
      }
      // Unordered lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li class="list-disc pl-2 ml-4 text-xs font-sans text-slate-300 my-1">${trimmed.substring(2)}</li>`;
      }
      // Ordered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const dotIndex = trimmed.indexOf('. ');
        return `<li class="list-decimal pl-2 ml-4 text-xs font-sans text-slate-300 my-1">${trimmed.substring(dotIndex + 2)}</li>`;
      }

      // Inline strong markup replacement
      let processed = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-[#242936]/60 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#3DDC97]">$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-[#3DDC97] hover:underline">$1</a>');

      if (!processed) return '<div class="h-2"></div>';
      return `<p class="text-xs font-sans text-slate-300 leading-relaxed my-2.5">${processed}</p>`;
    });

    return htmlLines.join('\n');
  };

  return (
    <div className="space-y-4 bg-[#171A21] border border-[#242936] p-5 rounded-2xl shadow-lg">
      
      {/* Editor toolbar option panels */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242936] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#3DDC97]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Wiki Manual Pad</h3>
            <p className="text-[11px] text-[#A8B0BF] font-mono uppercase">Markdown documentation workspace</p>
          </div>
        </div>

        {/* Mode Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0F1115] border border-[#242936] p-1 rounded-lg text-[10px] font-mono">
            {[
              { id: 'split', label: 'SPLIT', icon: Columns },
              { id: 'edit', label: 'EDIT ONLY', icon: FileText },
              { id: 'preview', label: 'PREVIEW', icon: BookOpen }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`px-2 py-1 select-none flex items-center gap-1.5 rounded cursor-pointer ${
                  mode === m.id ? 'bg-[#3DDC97] text-[#0F1115] font-bold' : 'text-[#A8B0BF] hover:text-[#F5F7FA]'
                }`}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3.5 py-1.5 bg-[#3DDC97] hover:bg-[#59F0B5] disabled:bg-zinc-800 text-[#0F1115] font-mono text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>

      {success && (
        <p className="p-2.5 bg-[#3DDC97]/15 border border-[#3DDC97]/20 text-[#3DDC97] font-mono text-[11px] rounded-lg animate-pulse">
          {success}
        </p>
      )}

      {/* Editor Markdown Shortcut bar */}
      {mode !== 'preview' && (
        <div className="flex flex-wrap items-center gap-1 bg-[#0F1115] border border-[#242936] p-1.5 rounded-xl">
          {[
            { label: 'H1', action: () => insertMarkdown('# $, ', 'Heading H1'), tooltip: 'Heading 1', icon: Heading1 },
            { label: 'H2', action: () => insertMarkdown('## $, ', 'Heading H2'), tooltip: 'Heading 2', icon: Heading2 },
            { label: 'Bold', action: () => insertMarkdown('**$**', 'bold statement'), tooltip: 'Bold text', icon: Bold },
            { label: 'Italic', action: () => insertMarkdown('*$*', 'italic phrasing'), tooltip: 'Italics text', icon: Italic },
            { label: 'List', action: () => insertMarkdown('- $', 'list entry item'), tooltip: 'Bullet List', icon: List },
            { label: 'Checklist', action: () => insertMarkdown('- [ ] $', 'ongoing checklist deliverable'), tooltip: 'Task Checklist', icon: CheckSquare },
            { label: 'Code', action: () => insertMarkdown('```\n$\n```', 'console.log("mintflow");'), tooltip: 'Code snippet', icon: Code },
            { label: 'Link', action: () => insertMarkdown('[$](url)', 'Figma link'), tooltip: 'Insert link', icon: Link2 }
          ].map((sc, index) => (
            <button
              key={index}
              onClick={sc.action}
              className="p-1 px-1.5 hover:bg-[#242936]/40 text-[#A8B0BF] hover:text-[#3DDC97] rounded flex items-center gap-1 cursor-pointer"
              title={sc.tooltip}
            >
              <sc.icon className="w-3.5 h-3.5" />
              <span className="text-[9px] font-mono leading-none">{sc.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Editor Main Canvas areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
        {/* TEXTAREA EDITOR CANVAS */}
        {mode !== 'preview' && (
          <div className={`h-full ${mode === 'edit' ? 'col-span-2' : 'col-span-1'}`}>
            <textarea
              id={`wiki-textarea-${projectId}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Project Specifications Notebook&#10;&#10;Start documenting objectives, project coordinates, and architecture directives here..."
              className="w-full h-full bg-[#0F1115] border border-[#242936] rounded-xl p-4 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-[#3DDC97] transition-all resize-none"
            />
          </div>
        )}

        {/* COMPILED HTML PREVIEW CANVAS */}
        {mode !== 'edit' && (
          <div className={`h-full border border-[#242936] bg-[#0F1115]/40 rounded-xl p-5 overflow-y-auto ${mode === 'preview' ? 'col-span-2' : 'col-span-1'}`}>
            <div 
              className="prose prose-invert max-w-none text-slate-300"
              dangerouslySetInnerHTML={{ __html: parseMarkdownHtml(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
