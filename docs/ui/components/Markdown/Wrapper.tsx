import GithubSlugger from 'github-slugger';
import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';

import { PageApiVersionProvider } from '~/providers/page-api-version';
import { PageMetadataContext } from '~/providers/page-metadata';
import { PageScene } from '~/scenes/PageScene';
import { PageMetadata } from '~/types/common';
import { AnchorContext } from '~/ui/components/Text';

type MarkdownWrapperProps = PropsWithChildren<{
  meta: PageMetadata;
}>;

export function MarkdownWrapper(props: MarkdownWrapperProps) {
  const router = useRouter();

  return (
    <AnchorContext.Provider value={new GithubSlugger()}>
      <PageApiVersionProvider router={router}>
        <PageMetadataContext.Provider value={props.meta}>
          <PageScene {...props}>{props.children}</PageScene>
        </PageMetadataContext.Provider>
      </PageApiVersionProvider>
    </AnchorContext.Provider>
  );
}
