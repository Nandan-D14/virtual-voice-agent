"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ListTodo, MoreHorizontal } from "lucide-react";

export type TodoItem = {
  title: string;
  status: "pending" | "in_progress" | "done";
  note?: string;
};

interface TodoListProps {
  items: TodoItem[];
}

export function TodoList({ items }: TodoListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full mb-4 px-1">
      <div className="flex items-center gap-2 mb-2 px-1">
        <ListTodo className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Plan</span>
        <div className="h-px flex-1 bg-zinc-800/50" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={`${item.title}-${index}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                item.status === "done"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : item.status === "in_progress"
                  ? "bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_15px_-5px_rgba(34,211,238,0.1)]"
                  : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <div className="mt-0.5">
                {item.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : item.status === "in_progress" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Circle className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
                  </motion.div>
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium truncate ${
                  item.status === "done" ? "text-emerald-500/70 line-through" : "text-zinc-200"
                }`}>
                  {item.title}
                </div>
                {item.note && (
                  <div className="mt-1 text-[10px] text-zinc-500 line-clamp-1 italic">
                    {item.note}
                  </div>
                )}
              </div>

              {item.status === "in_progress" && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
