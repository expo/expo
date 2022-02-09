import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';

import { PageApiVersionProvider } from '~/providers/page-api-version';
import { PageMetadataContext } from '~/providers/page-metadata';
import { PageMetadata } from '~/types/common';
import { Page } from '~/ui/components/Page';

type MarkdownWrapperProps = PropsWithChildren<{
  meta: PageMetadata;
}>;

export function MarkdownWrapper(props: MarkdownWrapperProps) {
  const router = useRouter();

  return (
    <PageApiVersionProvider router={router}>
      <PageMetadataContext.Provider value={props.meta}>
        <Page {...props}>{props.children}</Page>
      </PageMetadataContext.Provider>
    </PageApiVersionProvider>
  );
}
