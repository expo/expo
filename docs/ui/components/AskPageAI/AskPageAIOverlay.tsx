import { mergeClasses } from '@expo/styleguide';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AskPageAIChat } from './AskPageAIChat';

type AskPageAIOverlayProps = {
  onClose: () => void;
  onMinimize: () => void;
  pageTitle?: string;
  isExpoSdkPage?: boolean;
  isVisible: boolean;
  isExpanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function AskPageAIOverlay({
  onClose,
  onMinimize,
  pageTitle,
  isExpoSdkPage,
  isVisible,
  isExpanded,
  onExpandedChange,
}: AskPageAIOverlayProps) {
  const [isMounted, setMounted] = useState(false);
  const [isSmallScreen, setSmallScreen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateSmallScreen = (event: MediaQueryListEvent | MediaQueryList) => {
      setSmallScreen(event.matches);
    };

    updateSmallScreen(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateSmallScreen);
      return () => {
        mediaQuery.removeEventListener('change', updateSmallScreen);
      };
    }

    mediaQuery.addListener(updateSmallScreen);
    return () => {
      mediaQuery.removeListener(updateSmallScreen);
    };
  }, []);

  useEffect(() => {
    if (!isVisible && isExpanded) {
      onExpandedChange?.(false);
    }
  }, [isExpanded, isVisible, onExpandedChange]);

  useEffect(() => {
    if (!isSmallScreen || !isExpanded) {
      return;
    }

    onExpandedChange?.(false);
  }, [isExpanded, isSmallScreen, onExpandedChange]);

  const shouldShowExpandedLayout = isExpanded && !isSmallScreen;
  const canToggleExpand = !isSmallScreen;

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[120]">
      <div
        className={mergeClasses(
          'fixed bottom-4 right-4 flex h-full flex-col overflow-hidden rounded-2xl border border-default bg-default transition-all duration-200 ease-out',
          'max-sm:left-4 sm:bottom-8',
          shouldShowExpandedLayout
            ? 'sm:top-8 sm:bottom-8 sm:right-12 bottom-4 top-4 h-auto w-[min(600px,calc(100vw-72px))] max-w-[min(600px,calc(100vw-72px))]'
            : 'sm:right-8 max-h-[min(85vh,600px)] w-[min(420px,calc(100vw-24px))]',
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
            isExpoSdkPage={isExpoSdkPage}
            isExpanded={shouldShowExpandedLayout}
            onToggleExpand={
              canToggleExpand
                ? () => {
                    onExpandedChange?.(!isExpanded);
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>,
    document.body
  );
}
