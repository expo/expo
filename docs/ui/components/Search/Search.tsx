import { SearchLgIcon } from '@expo/styleguide-icons/outline/SearchLgIcon';
import type { SharedAskAiEntry } from '@expo/styleguide-search-ui';
import { useCommandMenuShortcut } from '@expo/styleguide-search-ui/trigger';
import { lazy, ReactNode, Suspense, useEffect, useRef, useState } from 'react';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';

import { entries } from './expoEntries';

const CommandMenu = lazy(() =>
  import('@expo/styleguide-search-ui').then(m => ({ default: m.CommandMenu }))
);

type SearchProps = {
  mainSection?: string;
};

const { LATEST_VERSION } = versions;
const isDev = process.env.NODE_ENV === 'development';

export const Search = ({ mainSection }: SearchProps) => {
  const { version } = usePageApiVersion();
  const [open, setOpen] = useState(false);
  const [expoDashboardItems, setExpoDashboardItems] = useState<ReactNode[]>([]);
  const [sharedAiEntry, setSharedAiEntry] = useState<SharedAskAiEntry | null>(null);
  const [shortcutLabel, setShortcutLabel] = useState<string | null>(null);
  const hasOpened = useRef(false);

  if (open) {
    hasOpened.current = true;
  }

  useCommandMenuShortcut(setOpen, { enabled: !hasOpened.current });

  useEffect(() => {
    setShortcutLabel(/mac|iphone|ipod|ipad/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K');
  }, []);

  useEffect(() => {
    // Cheap literal pre-check so anchor hashes never trigger loading the search bundle.
    if (!window.location.hash.startsWith('#ask-share=')) {
      return;
    }
    let cancelled = false;
    void import('@expo/styleguide-search-ui').then(
      async ({ decodeAskAiShare, parseAskAiShareHash }) => {
        const encoded = parseAskAiShareHash(window.location.hash);
        const entry = encoded ? await decodeAskAiShare(encoded) : null;
        if (entry && !cancelled) {
          setSharedAiEntry(entry);
          setOpen(true);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function getExpoItemsAsync(query: string) {
    const filteredEntries = entries.filter(entry =>
      entry.label.toLowerCase().includes(query.toLowerCase())
    );
    const { ExpoDashboardItem } = await import('./ExpoDashboardItem');
    setExpoDashboardItems(
      filteredEntries.map(item => <ExpoDashboardItem item={item} query={query} key={item.url} />)
    );
  }

  return (
    <>
      {hasOpened.current && (
        <Suspense>
          <CommandMenu
            open={open}
            setOpen={setOpen}
            sharedAiEntry={sharedAiEntry}
            config={{
              docsVersion: version,
              docsTransformUrl: transformDocsUrl,
              ...(mainSection && { docsSectionContext: { mainSection } }),
            }}
            customSections={[
              {
                heading: 'Expo dashboard',
                items: expoDashboardItems,
                getItemsAsync: getExpoItemsAsync,
                sectionIndex: Number.MAX_SAFE_INTEGER,
              },
            ]}
          />
        </Suspense>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="flex h-9 w-full items-center gap-2.5 rounded-3xl border-[0.5px] border-default bg-default py-2 pr-[15.5px] pl-[7.5px] shadow-xs hocus:bg-element hocus:dark:bg-subtle">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <SearchLgIcon aria-hidden="true" className="icon-md shrink-0 text-icon-default" />
          <span className="truncate text-sm leading-[1.4] font-medium text-secondary">
            Search or ask AI
          </span>
        </span>
        {shortcutLabel && (
          <span className="text-sm leading-[1.4] font-medium text-quaternary max-md:hidden">
            {shortcutLabel}
          </span>
        )}
      </button>
    </>
  );
};

function transformDocsUrl(url: string) {
  if (url.includes(LATEST_VERSION)) {
    url = url.replace(LATEST_VERSION, 'latest');
  }
  if (isDev) {
    url = url.replace('https://docs.expo.dev/', 'http://localhost:3002/');
  }

  return url;
}
