"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Trash2, Calendar, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type AdminNote } from "../../lib/supabase";

interface NotesPanelProps {
  notes: AdminNote[];
  onAddNote: (content: string) => void;
  onDeleteNote?: (noteId: string) => void;
  submissionId: string;
}

export default function NotesPanel({
  notes = [],
  onAddNote,
  onDeleteNote,
  submissionId,
}: NotesPanelProps) {
  const [newNote, setNewNote] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the notes when a new one is added
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote("");
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/5 bg-zinc-950/65 overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-white/[0.01]">
        <MessageSquare className="size-4 text-indigo-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Admin Notes ({notes.length})
        </h3>
      </div>

      {/* Notes Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[220px] custom-scrollbar">
        <AnimatePresence initial={false}>
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 text-zinc-600"
            >
              <MessageSquare className="size-8 stroke-[1] mb-2" />
              <p className="text-xs">No admin notes yet</p>
            </motion.div>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-xl border border-white/5 bg-zinc-900/30 p-3 hover:border-white/10 hover:bg-zinc-900/50 transition-all duration-200"
              >
                {/* Meta details */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-4.5 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-semibold border border-white/5">
                      <User className="size-2.5" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300">
                      {note.author}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(note.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {onDeleteNote && (
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-rose-400 rounded transition-all"
                        title="Delete note"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-zinc-300 leading-relaxed break-words whitespace-pre-wrap pl-1">
                  {note.content}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={feedEndRef} />
      </div>

      {/* Input Section */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/5 p-3 bg-zinc-950/40"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an internal note..."
            className="w-full rounded-xl border border-white/5 bg-zinc-900/20 py-2.5 pl-3.5 pr-10 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-white/10 focus:bg-zinc-900/40"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="absolute right-2 p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-white/5 disabled:opacity-30 disabled:hover:text-zinc-500 disabled:hover:bg-transparent transition-all"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
