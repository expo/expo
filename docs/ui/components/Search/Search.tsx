import { CommandMenu, CommandMenuTrigger } from '@expo/styleguide-search-ui';
import { ReactNode, useState } from 'react';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';

import { ExpoDashboardItem } from './ExpoDashboardItem';
import { entries } from './expoEntries';

const { LATEST_VERSION } = versions;
const isDev = process.env.NODE_ENV === 'development';

export const Search = () => {
  const { version } = usePageApiVersion();
  const [open, setOpen] = useState(false);
  const [expoDashboardItems, setExpoDashboardItems] = useState<ReactNode[]>([]);

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
      <CommandMenu
        open={open}
        setOpen={setOpen}
        config={{ docsVersion: version, docsTransformUrl: transformDocsUrl }}
        customSections={[
          {
            heading: 'EAS dashboard',
            items: expoDashboardItems,
            getItemsAsync: getExpoItemsAsync,
            sectionIndex: 1,
          },
        ]}
      />
      <CommandMenuTrigger
        setOpen={setOpen}
        className="mb-2.5 hocus:bg-element hocus:dark:bg-subtle"
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

  // If viewing a docs preview hosted on S3, use the current origin instead of production
  if (window?.location?.origin?.includes('s3-website-us-east-1.amazonaws.com')) {
    url = url.replace('https://docs.expo.dev/', window.location.origin + '/');
  }

  return url;
}
