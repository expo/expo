import { CommandMenuTrigger, useCommandMenuShortcut } from '@expo/styleguide-search-ui/trigger';
import { lazy, ReactNode, Suspense, useRef, useState } from 'react';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';

import { ExpoDashboardItem } from './ExpoDashboardItem';
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
  const hasOpened = useRef(false);

  if (open) {
    hasOpened.current = true;
  }

  useCommandMenuShortcut(setOpen, { enabled: !hasOpened.current });

  async function getExpoItemsAsync(query: string) {
    const filteredEntries = entries.filter(entry =>
      entry.label.toLowerCase().includes(query.toLowerCase())
    );
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
            config={{
              docsVersion: version,
              docsTransformUrl: transformDocsUrl,
              ...(mainSection && { docsSectionContext: { mainSection } }),
            }}
            customSections={[
              {
                heading: 'EAS dashboard',
                items: expoDashboardItems,
                getItemsAsync: getExpoItemsAsync,
                sectionIndex: Number.MAX_SAFE_INTEGER,
              },
            ]}
          />
        </Suspense>
      )}
      <CommandMenuTrigger
        setOpen={setOpen}
        className="hocus:bg-element hocus:dark:bg-subtle mb-2.5"
      />
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
