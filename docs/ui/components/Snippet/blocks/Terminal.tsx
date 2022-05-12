import { css, SerializedStyles } from '@emotion/react';
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
  hideOverflow?: boolean;
  style?: SerializedStyles;
  title?: string;
};

export const Terminal = ({
  cmd,
  cmdCopy,
  hideOverflow,
  style,
  title = 'Terminal',
}: TerminalProps) => (
  <Snippet style={style}>
    <SnippetHeader alwaysDark title={title}>
      {renderCopyButton(cmd, cmdCopy)}
    </SnippetHeader>
    <SnippetContent alwaysDark hideOverflow={hideOverflow}>
      {cmd.map(cmdMapper)}
    </SnippetContent>
  </Snippet>
);

/**
 * This method attempts to naively generate the basic cmdCopy from the given cmd list.
 * Currently, the implementation is simple, but we can add multiline support in the future.
 */
function getDefaultCmdCopy(cmd: TerminalProps['cmd']) {
  return cmd.length === 1 && !cmd[0].startsWith('#')
    ? cmd[0].startsWith('$')
      ? cmd[0].slice(2)
      : cmd[0]
    : undefined;
}

function renderCopyButton(cmd: TerminalProps['cmd'], cmdCopy: TerminalProps['cmdCopy']) {
  const copyText = cmdCopy || getDefaultCmdCopy(cmd);
  return copyText && <CopyAction alwaysDark text={copyText} />;
}

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
      <div key={key}>
        <CODE
          css={[
            codeStyle,
            unselectableStyle,
            { display: 'inline', color: darkTheme.text.secondary },
          ]}>
          →&nbsp;
        </CODE>
        <CODE css={codeStyle}>{line.substring(1).trim()}</CODE>
      </div>
    );
  }

  return (
    <CODE key={key} css={[codeStyle, { display: 'inherit' }]}>
      {line}
    </CODE>
  );
}

const unselectableStyle = css`
  user-select: none;
`;

const codeStyle = css`
  display: inline-block;
  line-height: 130%;
  background-color: transparent;
  border: none;
  color: ${darkTheme.text.default};
`;
