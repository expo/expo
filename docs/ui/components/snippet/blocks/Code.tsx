import React, { PropsWithChildren } from 'react';

import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';

import { Highlight, getPrismLanguage } from '~/ui/components/Highlight';

type CodeProps = PropsWithChildren<{
  title?: string;
  className?: string;
}>;

// TODO(cedric): features
// - [x] Use syntax color for the code with Prism
// - [ ] Add "Open in Snack" for specific code snippets
// - [ ] Detect language based on MDX ```css and ```js tags, update highlight
// - [ ] Hide code that isn't relevant using `@hide <placeholder> ... @end`
// - [ ] Annotate/mark code with tooltip popover

export const Code = ({ children, className, title = 'JavaScript' }: CodeProps) => {
  const textChildren = children?.toString() || '';
  const mdxLanguage = (className || '').split(' ')[0]; // TODO(cedric): clean this up

  return (
    <Snippet>
      <SnippetHeader title={title}>
        <SnippetAction>Open in Snack</SnippetAction>
        <CopyAction text={textChildren} />
      </SnippetHeader>
      <SnippetContent>
        <Highlight language={getPrismLanguage(mdxLanguage)}>{textChildren}</Highlight>
      </SnippetContent>
    </Snippet>
  );
};
