import { MDXProvider } from '@mdx-js/react';
import React, { PropsWithChildren } from 'react';

import * as oldMarkdownComponents from '~/common/translate-markdown';
import DocumentationPage from '~/components/DocumentationPage';
import { markdownComponents, MarkdownWrapper } from '~/ui/components/Markdown';

type MarkdownProviderProps = PropsWithChildren<object>;

// TODO(cedric): remove old design after fully switching to new design
const COMPONENTS = process.env.NEXT_PUBLIC_EXPO_DESIGN
  ? { ...markdownComponents, wrapper: MarkdownWrapper }
  : { ...oldMarkdownComponents, wrapper: DocumentationPage };

export function MarkdownProvider(props: MarkdownProviderProps) {
  return <MDXProvider components={COMPONENTS}>{props.children}</MDXProvider>;
}
