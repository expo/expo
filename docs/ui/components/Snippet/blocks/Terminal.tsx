import { css } from '@emotion/react';
import { darkTheme, palette, spacing } from '@expo/styleguide-base';

import { Snippet } from '../Snippet';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';

import { CODE } from '~/ui/components/Text';

type TerminalProps = {
  cmd: string[];
  cmdCopy?: string;
  hideOverflow?: boolean;
  includeMargin?: boolean;
  title?: string;
};

export const Terminal = ({
  cmd,
  cmdCopy,
  hideOverflow,
  includeMargin = true,
  title = 'Terminal',
}: TerminalProps) => (
  <Snippet css={wrapperStyle} includeMargin={includeMargin}>
    <SnippetHeader alwaysDark title={title}>
      {renderCopyButton({ cmd, cmdCopy })}
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
  const validLines = cmd.filter(line => !line.startsWith('#') && line !== '');
  if (validLines.length === 1) {
    return validLines[0].startsWith('$') ? validLines[0].slice(2) : validLines[0];
  }
  return undefined;
}

function renderCopyButton({ cmd, cmdCopy }: TerminalProps) {
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
      <CODE key={key} css={[codeStyle, unselectableStyle, { color: palette.dark.gray10 }]}>
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
          -&nbsp;
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

const wrapperStyle = css`
  li & {
    margin-top: ${spacing[4]}px;
    display: flex;
  }
`;

const unselectableStyle = css`
  user-select: none;
`;

const codeStyle = css`
  white-space: pre;
  display: inline-block;
  line-height: 140%;
  background-color: transparent;
  border: none;
  color: ${darkTheme.text.default};
`;
