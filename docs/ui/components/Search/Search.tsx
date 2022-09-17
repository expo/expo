import { DocSearch } from '@docsearch/react';
import { Global } from '@emotion/react';
import * as React from 'react';

import { LATEST_VERSION } from '~/constants/versions.cjs';
import { usePageApiVersion } from '~/providers/page-api-version';
import { DocSearchStyles } from '~/ui/components/Search/styles';

const env = process.env.NODE_ENV;

export const Search = () => {
  const { version } = usePageApiVersion();
  return (
    <>
      <Global styles={DocSearchStyles} />
      <DocSearch
        appId="QEX7PB7D46"
        indexName="expo"
        apiKey="89231e630c63f383765538848f9a0e9e"
        searchParameters={{
          facetFilters: [['version:none', `version:${version}`]],
        }}
        transformItems={items =>
          items.map(item => {
            const envUrl =
              env === 'development'
                ? item.url.replace('https://docs.expo.dev/', 'http://localhost:3002/')
                : item.url;
            return {
              ...item,
              url: envUrl.includes(LATEST_VERSION)
                ? envUrl.replace(LATEST_VERSION, 'latest')
                : envUrl,
            };
          })
        }
      />
    </>
  );
};
