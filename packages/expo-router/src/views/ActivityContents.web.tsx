'use client';
import { Activity, type ActivityProps } from 'react';

export function ActivityContents({ mode, children }: ActivityProps) {
  const observeActivity = (element: HTMLDivElement | null) => {
    if (element === null) {
      return;
    }

    const restoreDisplay = () => {
      for (const child of element.children) {
        if (child instanceof HTMLElement && child.style.display === 'none') {
          child.style.display = 'contents';
        }
      }
    };
    const observer = new MutationObserver(restoreDisplay);
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });
    restoreDisplay();

    return () => observer.disconnect();
  };

  return (
    <div ref={observeActivity} style={{ display: 'contents' }}>
      <Activity mode={mode}>
        <div style={{ display: 'contents' }}>{children}</div>
      </Activity>
    </div>
  );
}
