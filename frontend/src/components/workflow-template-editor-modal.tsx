"use client";

import { useEffect, useState } from "react";

import type { WorkflowTemplateInputField } from "@/lib/message-types";
import type { WorkflowTemplateDraft } from "@/lib/workflow-template-utils";

type WorkflowTemplateEditorModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  submitLabel: string;
  initialDraft?: WorkflowTemplateDraft;
  initialValue?: WorkflowTemplateDraft;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (draft: WorkflowTemplateDraft) => void | Promise<void>;
};

function cloneInputFields(fields: WorkflowTemplateInputField[]) {
  return fields.map((field) => ({ ...field }));
}

export function WorkflowTemplateEditorModal({
  open,
  title,
  subtitle,
  submitLabel,
  initialDraft,
  initialValue,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: WorkflowTemplateEditorModalProps) {
  const resolvedDraft = initialValue ?? initialDraft;
  const [name, setName] = useState(resolvedDraft?.name ?? "");
  const [description, setDescription] = useState(resolvedDraft?.description ?? "");
  const [instructions, setInstructions] = useState(resolvedDraft?.instructions ?? "");
  const [inputFields, setInputFields] = useState<WorkflowTemplateInputField[]>(
    cloneInputFields(resolvedDraft?.inputFields ?? []),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(resolvedDraft?.name ?? "");
    setDescription(resolvedDraft?.description ?? "");
    setInstructions(resolvedDraft?.instructions ?? "");
    setInputFields(cloneInputFields(resolvedDraft?.inputFields ?? []));
  }, [initialDraft, initialValue, open, resolvedDraft?.description, resolvedDraft?.inputFields, resolvedDraft?.instructions, resolvedDraft?.name]);

  if (!open) {
    return null;
  }

  const addField = () => {
    setInputFields((prev) => [
      ...prev,
      {
        key: `field_${prev.length + 1}`,
        label: `Field ${prev.length + 1}`,
        placeholder: "",
        required: false,
      },
    ]);
  };

  const updateField = (
    index: number,
    patch: Partial<WorkflowTemplateInputField>,
  ) => {
    setInputFields((prev) =>
      prev.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
  };

  const removeField = (index: number) => {
    setInputFields((prev) => prev.filter((_, fieldIndex) => fieldIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedInstructions = instructions.trim();
    if (!trimmedName || !trimmedInstructions) {
      return;
    }
    await onSubmit({
      name: trimmedName,
      description: description.trim(),
      instructions: trimmedInstructions,
      inputFields: inputFields.map((field) => ({
        key: field.key.trim(),
        label: field.label.trim(),
        placeholder: field.placeholder.trim(),
        required: field.required,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#111114]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {subtitle || "Save the proven flow from this session and reuse it later with manual inputs."}
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

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Template name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-zinc-100"
                placeholder="Competitor research"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Description
              </span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-zinc-100"
                placeholder="Reusable workflow summary"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Instructions
            </span>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={10}
              className="w-full rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm leading-6 text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-zinc-100"
              placeholder="Describe the workflow the agent should reuse."
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Manual input fields
                </p>
                <p className="text-xs text-zinc-500">
                  These values will be collected each time the template is run.
                </p>
              </div>
              <button
                type="button"
                onClick={addField}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Add field
              </button>
            </div>

            <div className="space-y-3">
              {inputFields.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-500 dark:border-white/10">
                  This template does not need extra inputs yet.
                </div>
              ) : (
                inputFields.map((field, index) => (
                  <div
                    key={`${field.key}-${index}`}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-[#151518]"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_1.2fr_auto]">
                      <input
                        value={field.key}
                        onChange={(event) =>
                          updateField(index, { key: event.target.value })
                        }
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1f1f23] dark:text-zinc-100"
                        placeholder="company_name"
                      />
                      <input
                        value={field.label}
                        onChange={(event) =>
                          updateField(index, { label: event.target.value })
                        }
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1f1f23] dark:text-zinc-100"
                        placeholder="Company name"
                      />
                      <input
                        value={field.placeholder}
                        onChange={(event) =>
                          updateField(index, { placeholder: event.target.value })
                        }
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-[#1f1f23] dark:text-zinc-100"
                        placeholder="Acme Inc."
                      />
                      <div className="flex items-center justify-end gap-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              updateField(index, { required: event.target.checked })
                            }
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
              disabled={isSubmitting || !name.trim() || !instructions.trim()}
              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
