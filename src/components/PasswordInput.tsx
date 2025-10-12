"use client";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export default function PasswordInput({ value, onChange, placeholder = 'Password', ariaLabel }: Props) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative mb-2">
      <input
        className="w-full p-2 pr-10 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-200"
        placeholder={placeholder}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel ?? placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 transition-transform duration-150 ease-in-out hover:scale-110"
      >
        <FontAwesomeIcon icon={show ? faEyeSlash : faEye} className="w-5 h-5" />
      </button>
    </div>
  );
}
