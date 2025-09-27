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
  const [isExpanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setExpanded(false);
    }
  }, [isVisible]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        className={mergeClasses(
          'max-sm:left-4 sm:bottom-8 sm:right-8 fixed bottom-4 right-4 flex h-full w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-default bg-default transition-all duration-150 ease-out',
          isExpanded ? 'h-[min(97vh,860px)] max-h-[min(97vh,860px)]' : 'max-h-[min(85vh,600px)]',
          isVisible
            ? 'pointer-events-auto translate-y-0 opacity-100 shadow-xl'
            : 'pointer-events-none translate-y-3 opacity-0 shadow-none'
        )}
        role="dialog"
        aria-modal="false"
        aria-hidden={!isVisible}>
        {isVisible && (
          <AskPageAIChat
            onClose={onClose}
            onMinimize={onMinimize}
            pageTitle={pageTitle}
            isExpanded={isExpanded}
            onToggleExpand={() => {
              setExpanded(prev => !prev);
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
