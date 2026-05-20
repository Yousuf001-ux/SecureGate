"use client";

import { useState } from "react";
import type { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { PasswordStrengthIndicator } from "@/components/PasswordStrength";

interface PasswordInputProps {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  watchedPassword?: string;
  labelAction?: React.ReactNode;
}

export function PasswordInput({
  id,
  label,
  registration,
  error,
  disabled = false,
  placeholder = "••••••••",
  showStrengthIndicator = false,
  watchedPassword,
  labelAction,
}: PasswordInputProps): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        {labelAction && (
          <div className="text-xs">{labelAction}</div>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          disabled={disabled}
          {...registration}
          className={`w-full px-3.5 py-2 pr-10 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all ${
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          }`}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {visible ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {showStrengthIndicator && watchedPassword !== undefined && (
        <PasswordStrengthIndicator password={watchedPassword} />
      )}

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 font-medium mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
