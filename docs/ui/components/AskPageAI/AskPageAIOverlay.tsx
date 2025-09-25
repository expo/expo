import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AskPageAIChat } from './AskPageAIChat';

type AskPageAIOverlayProps = {
  onClose: () => void;
  pageTitle?: string;
};

export function AskPageAIOverlay({ onClose, pageTitle }: AskPageAIOverlayProps) {
  const [isMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        className="max-sm:left-4 sm:bottom-8 sm:right-8 pointer-events-auto fixed bottom-4 right-4 flex max-h-[min(85vh,600px)] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-default bg-default shadow-xl"
        role="dialog"
        aria-modal="false">
        <AskPageAIChat onClose={onClose} pageTitle={pageTitle} />
      </div>
    </div>,
    document.body
  );
}
