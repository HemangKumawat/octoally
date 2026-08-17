import { useEffect, useRef } from 'react';

/* ponytail: native <dialog> is the primitive. showModal() gives focus trap,
   Escape, aria-modal, top-layer stacking and inert background for free — no
   library, no z-index war. Upgrade path: if we ever need anchored menus /
   popovers / comboboxes, add `radix-ui` for THOSE; dialogs stay native. */

interface ModalShellProps {
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  /** Clicking the backdrop closes. Default true. */
  dismissOnBackdrop?: boolean;
  children: React.ReactNode;
}

export function ModalShell({
  onClose,
  labelledBy,
  className = '',
  dismissOnBackdrop = true,
  children,
}: ModalShellProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    // Escape fires `cancel` then `close`; both route to onClose exactly once.
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el.removeEventListener('cancel', onCancel);
      document.body.style.overflow = prev;
      if (el.open) el.close();
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={`modal-shell ${className}`}
      onClick={(e) => {
        // Backdrop clicks land on the <dialog> itself, never on its children.
        if (dismissOnBackdrop && e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
