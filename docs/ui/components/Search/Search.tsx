import { DocSearch } from '@docsearch/react';
import { Global } from '@emotion/react';
import * as React from 'react';

import { LATEST_VERSION } from '~/constants/versions';
import { usePageApiVersion } from '~/providers/page-api-version';
import { DocSearchStyles } from '~/ui/components/Search/styles';

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
            if (item.url.includes(LATEST_VERSION)) {
              return { ...item, url: item.url.replace(LATEST_VERSION, 'latest') };
            }
            return item;
          })
        }
      />
    </>
  );
};
