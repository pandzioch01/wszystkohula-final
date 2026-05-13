import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Tailwind max-width class for the dialog. Defaults to max-w-lg. */
  size?: string;
}

export function Modal({ open, onClose, title, children, size = 'max-w-lg' }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while the modal is open — the modal itself scrolls if
  // its content overflows, but the underlying page should not move.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${size} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-gray-500 hover:text-gray-900 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {/* Only the body scrolls — header stays pinned, the page underneath stays still. */}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
