
"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  src?: string | null;
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File | null) => void;
  onUpload: () => Promise<void>;
  previewUrl?: string | null;
  loading?: boolean;
};

export default function ProfileImageModal({ src, open, onClose, onFileSelected, onUpload, previewUrl, loading }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // focus first focusable element inside modal
    setTimeout(() => el?.focus(), 0);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    setFileName(previewUrl ? 'Selected image' : null);
  }, [previewUrl]);

  if (!open) return null;

  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    setDragOver(false);
    const f = ev.dataTransfer.files?.[0] ?? null;
    if (f) {
      // validate
      if (!ALLOWED.includes(f.type)) {
        setError('Unsupported format — please upload JPG, PNG, WebP, or GIF.');
        onFileSelected(null);
        setFileName(null);
        return;
      }
      if (f.size > MAX_SIZE) {
        setError('File too large — please keep images under 5 MB.');
        onFileSelected(null);
        setFileName(null);
        return;
      }
      setError(null);
      onFileSelected(f);
      setFileName(f.name);
    }
  };

  const onFileChange = (file: File | null) => {
    if (!file) {
      setError(null);
      onFileSelected(null);
      setFileName(null);
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setError('Unsupported format — please upload JPG, PNG, WebP, or GIF.');
      onFileSelected(null);
      setFileName(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large — please keep images under 5 MB.');
      onFileSelected(null);
      setFileName(null);
      return;
    }
    setError(null);
    onFileSelected(file);
    setFileName(file.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div ref={ref} tabIndex={-1} className="bg-white rounded-lg p-6 w-full max-w-md outline-none">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Profile picture</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="mt-4">
          <div className={`mx-auto w-36 h-36 rounded-full overflow-hidden bg-gray-100 ${dragOver ? 'ring-4 ring-blue-200' : ''}`}>
            <Image src={previewUrl ?? src ?? '/favicon.ico'} alt="profile" width={144} height={144} style={{ objectFit: 'cover' }} />
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-4 p-4 border-2 rounded border-dashed ${dragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm text-gray-600">Drag & drop an image here, or</div>
              <label className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
                <span className="text-sm">Choose file</span>
              </label>
              {fileName && (
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <span>{fileName}</span>
                  <button onClick={() => onFileChange(null)} className="text-blue-600 text-xs underline">Clear</button>
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 mt-2">{error}</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
            <button onClick={onUpload} disabled={loading || !!error || !fileName} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Uploading...' : 'Upload'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
