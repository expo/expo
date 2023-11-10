import { CommandMenu, CommandMenuTrigger } from '@expo/styleguide-search-ui';
import { ReactNode, useState } from 'react';

import { ExpoDashboardItem } from './ExpoDashboardItem';
import { entries } from './expoEntries';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';

const { LATEST_VERSION } = versions;
const isDev = process.env.NODE_ENV === 'development';

export const Search = () => {
  const { version } = usePageApiVersion();
  const [open, setOpen] = useState(false);
  const [expoDashboardItems, setExpoDashboardItems] = useState<ReactNode[]>([]);

  const getExpoItems = async (query: string) => {
    const filteredEntries = entries.filter(entry =>
      entry.label.toLowerCase().includes(query.toLowerCase())
    );
    setExpoDashboardItems(
      filteredEntries.map(item => <ExpoDashboardItem item={item} query={query} key={item.url} />)
    );
  };

  return (
    <>
      <CommandMenu
        open={open}
        setOpen={setOpen}
        config={{ docsVersion: version, docsTransformUrl: transformDocsUrl }}
        customSections={[
          {
            heading: 'Expo dashboard',
            items: expoDashboardItems,
            getItemsAsync: getExpoItems,
            sectionIndex: 1,
          },
        ]}
      />
      <CommandMenuTrigger setOpen={setOpen} className="mb-2.5" />
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
