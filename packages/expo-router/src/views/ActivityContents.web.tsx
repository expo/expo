'use client';
import { Activity, type ActivityProps } from 'react';

function observeActivity(element: HTMLDivElement | null) {
  if (element === null) {
    return;
  }

  const activityChild = element.firstElementChild;
  if (!(activityChild instanceof HTMLElement)) {
    return;
  }

  const restoreDisplay = () => {
    if (activityChild.style.display === 'none') {
      activityChild.style.display = 'contents';
    }
  };
  const observer = new MutationObserver(restoreDisplay);
  observer.observe(activityChild, { attributes: true, attributeFilter: ['style'] });
  restoreDisplay();

  return () => observer.disconnect();
}

export function ActivityContents({ mode, children }: ActivityProps) {
  return (
    // React detaches refs inside a hidden Activity, so observe it from an outer wrapper.
    <div ref={observeActivity} style={{ display: 'contents' }}>
      <Activity mode={mode}>
        <div style={{ display: 'contents' }}>{children}</div>
      </Activity>
    </div>
  );
}
