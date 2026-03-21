"use client";

import { useEffect, useState } from "react";

import type { WorkflowTemplateData } from "@/lib/message-types";

type WorkflowTemplateRunModalProps = {
  open: boolean;
  template: WorkflowTemplateData | null;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (inputs: Record<string, string>) => void | Promise<void>;
};

export function WorkflowTemplateRunModal({
  open,
  template,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: WorkflowTemplateRunModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !template) {
      return;
    }
    const nextValues: Record<string, string> = {};
    for (const field of template.input_fields) {
      nextValues[field.key] = "";
    }
    setValues(nextValues);
  }, [open, template]);

  if (!open || !template) {
    return null;
  }

  const hasMissingRequired = template.input_fields.some((field) => {
    if (!field.required) return false;
    return !(values[field.key] ?? "").trim();
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#111114]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Run Template
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {template.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {template.description ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-[#151518] dark:text-zinc-300">
              {template.description}
            </div>
          ) : null}

          {template.input_fields.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-500 dark:border-white/10">
              This template does not require manual inputs. Running it will create a fresh session immediately.
            </div>
          ) : (
            template.input_fields.map((field) => (
              <label key={field.key} className="block space-y-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {field.label}
                  {field.required ? (
                    <span className="ml-1 text-cyan-500">*</span>
                  ) : null}
                </span>
                <input
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder || field.label}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-zinc-100"
                />
              </label>
            ))
          )}

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasMissingRequired}
              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Starting..."
                : hasMissingRequired
                  ? "Fill Required Fields"
                  : "Run Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
