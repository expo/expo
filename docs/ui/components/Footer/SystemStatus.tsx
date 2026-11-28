import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { useEffect, useState } from 'react';

const STATUS_PAGE_URL = 'https://status.expo.dev';

type StatusIndicator = 'none' | 'minor' | 'major' | 'critical' | 'maintenance';

type StatusPageResponse = {
  status?: { indicator?: StatusIndicator; description?: string };
};

const INDICATOR_CLASSES: Record<StatusIndicator, string> = {
  none: 'bg-[#00824d] dark:bg-palette-green11',
  minor: 'bg-palette-yellow11',
  maintenance: 'bg-palette-yellow11',
  major: 'bg-palette-red11',
  critical: 'bg-palette-red11',
};

export function SystemStatus() {
  const [status, setStatus] = useState<StatusPageResponse['status']>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${STATUS_PAGE_URL}/api/v2/status.json`, { signal: controller.signal })
      .then(response => response.json() as Promise<StatusPageResponse>)
      .then(data => {
        setStatus(data.status);
      })
      .catch(() => {});
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <LinkBase
      href={STATUS_PAGE_URL}
      openInNewTab
      className={mergeClasses(
        'flex items-center gap-2 rounded-3xl px-2 py-1 text-xs leading-[1.6] font-medium text-default',
        'transition-colors hocus:bg-element'
      )}>
      <span
        aria-hidden="true"
        className={mergeClasses(
          'size-1.5 shrink-0 rounded-[18px]',
          status?.indicator ? INDICATOR_CLASSES[status.indicator] : 'bg-palette-gray9'
        )}
      />
      {status?.description ?? 'System status'}
      <ArrowUpRightIcon
        aria-hidden="true"
        className="icon-sm shrink-0 text-[#b0b4ba] dark:text-icon-default"
      />
    </LinkBase>
  );
}
