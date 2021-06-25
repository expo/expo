import { css } from '@emotion/react';
import { darkTheme } from '@expo/styleguide';
import React from 'react';

import { Snippet } from '../Snippet';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';

import { CODE } from '~/ui/components/Text';

type TerminalProps = {
  cmd: string[];
  cmdCopy?: string;
  title?: string;
};

// TODO(cedric): features
// - [x] Use syntax color for shell prefixes and comments
// - [x] Make prefix and comments unselectable? (maybe obsolete with the copy to clipboard)
// - [ ] Add "Copy" button with feedback

export const Terminal = ({ cmd, cmdCopy, title = 'Terminal' }: TerminalProps) => (
  <Snippet>
    <SnippetHeader alwaysDark title={title}>
      {!!cmdCopy && <CopyAction alwaysDark text={cmdCopy} />}
    </SnippetHeader>
    <SnippetContent alwaysDark>{cmd.map(cmdMapper)}</SnippetContent>
  </Snippet>
);

/**
 * Map all provided lines and render the correct component.
 * This method supports:
 *   - Render newlines for empty strings
 *   - Render a line with `#` prefix as comment with secondary text
 *   - Render a line without `$` prefix as primary text
 *   - Render a line with `$` prefix, as secondary and primary text
 */
function cmdMapper(line: string, index: number) {
  const key = `line-${index}`;

  if (line.trim() === '') {
    return <br key={key} css={unselectableStyle} />;
  }

  if (line.startsWith('#')) {
    return (
      <CODE key={key} css={[codeStyle, unselectableStyle, { color: darkTheme.code.comment }]}>
        {line}
      </CODE>
    );
  }

  if (line.startsWith('$')) {
    return (
      <>
        <CODE
          key={`${key}-prefix`}
          css={[
            codeStyle,
            unselectableStyle,
            { display: 'inline', color: darkTheme.highlight.accent },
          ]}>
          $&nbsp;
        </CODE>
        <CODE key={key} css={[codeStyle, { display: 'inline' }]}>
          {line.substring(1).trim()}
        </CODE>
      </>
    );
  }

  return (
    <CODE key={key} css={codeStyle}>
      {line}
    </CODE>
  );
}

const unselectableStyle = css`
  user-select: none;
`;

const codeStyle = css`
  background-color: transparent;
  border: none;
  color: ${darkTheme.text.default};
`;
