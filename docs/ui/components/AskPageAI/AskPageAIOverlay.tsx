import { mergeClasses } from '@expo/styleguide';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AskPageAIChat } from './AskPageAIChat';

type AskPageAIOverlayProps = {
  onClose: () => void;
  onMinimize: () => void;
  pageTitle?: string;
  isVisible: boolean;
};

export function AskPageAIOverlay({
  onClose,
  onMinimize,
  pageTitle,
  isVisible,
}: AskPageAIOverlayProps) {
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
        className={mergeClasses(
          'max-sm:left-4 sm:bottom-8 sm:right-8 fixed bottom-4 right-4 flex h-full max-h-[min(85vh,600px)] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-default bg-default transition-all duration-150 ease-out',
          isVisible
            ? 'pointer-events-auto translate-y-0 opacity-100 shadow-xl'
            : 'pointer-events-none translate-y-3 opacity-0 shadow-none'
        )}
        role="dialog"
        aria-modal="false"
        aria-hidden={!isVisible}>
        <AskPageAIChat onClose={onClose} onMinimize={onMinimize} pageTitle={pageTitle} />
      </div>
    </div>,
    document.body
  );
}
