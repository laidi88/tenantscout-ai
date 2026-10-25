"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { FormState } from "@/lib/validation";
import { buttonClass, cn } from "./ui";

// Form controls used with Server Actions and useActionState. Inputs are
// uncontrolled; `values` from a failed submission are fed back as defaults so
// nothing the user typed is lost.

const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 aria-invalid:border-red-400";

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  hint?: string;
  required?: boolean;
  className?: string;
};

function FieldWrapper({ name, label, state, hint, required, className, children }: FieldProps & { children: ReactNode }) {
  const errors = state.errors?.[name];
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <div className="mt-1">{children}</div>
      {errors?.length ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {errors[0]}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function valueFor(state: FormState, name: string, fallback: string) {
  const v = state.values?.[name];
  return typeof v === "string" ? v : fallback;
}

export function TextField({
  defaultValue = "",
  type = "text",
  placeholder,
  step,
  ...props
}: FieldProps & { defaultValue?: string; type?: string; placeholder?: string; step?: string }) {
  const invalid = Boolean(props.state.errors?.[props.name]?.length);
  return (
    <FieldWrapper {...props}>
      <input
        id={props.name}
        name={props.name}
        type={type}
        step={step}
        placeholder={placeholder}
        defaultValue={valueFor(props.state, props.name, defaultValue)}
        required={props.required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${props.name}-error` : undefined}
        className={inputClass}
      />
    </FieldWrapper>
  );
}

export function TextAreaField({ defaultValue = "", rows = 4, ...props }: FieldProps & { defaultValue?: string; rows?: number }) {
  const invalid = Boolean(props.state.errors?.[props.name]?.length);
  return (
    <FieldWrapper {...props}>
      <textarea
        id={props.name}
        name={props.name}
        rows={rows}
        defaultValue={valueFor(props.state, props.name, defaultValue)}
        required={props.required}
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
    </FieldWrapper>
  );
}

export function SelectField({
  defaultValue = "",
  options,
  placeholder,
  ...props
}: FieldProps & { defaultValue?: string; options: { value: string; label: string }[]; placeholder?: string }) {
  const invalid = Boolean(props.state.errors?.[props.name]?.length);
  return (
    <FieldWrapper {...props}>
      <select
        id={props.name}
        name={props.name}
        defaultValue={valueFor(props.state, props.name, defaultValue)}
        required={props.required}
        aria-invalid={invalid || undefined}
        className={inputClass}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function CheckboxGroupField({
  defaultValue = [],
  options,
  ...props
}: FieldProps & { defaultValue?: string[]; options: { value: string; label: string }[] }) {
  const submitted = props.state.values?.[props.name];
  const checked = Array.isArray(submitted) ? submitted : defaultValue;
  return (
    <fieldset className={props.className}>
      <legend className="block text-sm font-medium text-slate-800">{props.label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 has-checked:border-slate-900 has-checked:bg-slate-900 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-slate-400"
          >
            <input type="checkbox" name={props.name} value={o.value} defaultChecked={checked.includes(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
      {props.hint && <p className="mt-1 text-xs text-slate-500">{props.hint}</p>}
    </fieldset>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700",
      )}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant)}>
      {pending ? pendingText : children}
    </button>
  );
}
