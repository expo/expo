import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import { TerminalSquareIcon } from '@expo/styleguide-icons';

import { Snippet } from '../Snippet';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';

import { CODE } from '~/ui/components/Text';

type TerminalProps = {
  cmd: string[];
  cmdCopy?: string;
  hideOverflow?: boolean;
  title?: string;
};

export const Terminal = ({ cmd, cmdCopy, hideOverflow, title = 'Terminal' }: TerminalProps) => (
  <Snippet css={wrapperStyle}>
    <SnippetHeader alwaysDark title={title} Icon={TerminalSquareIcon}>
      {renderCopyButton({ cmd, cmdCopy })}
    </SnippetHeader>
    <SnippetContent alwaysDark hideOverflow={hideOverflow} className="flex flex-col">
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
    return <br key={key} className="select-none" />;
  }

  if (line.startsWith('#')) {
    return (
      <CODE
        key={key}
        className="whitespace-pre !bg-[transparent] !border-none select-none !text-palette-gray10">
        {line}
      </CODE>
    );
  }

  if (line.startsWith('$')) {
    return (
      <div key={key}>
        <CODE className="whitespace-pre !bg-[transparent] !border-none select-none !text-secondary">
          -&nbsp;
        </CODE>
        <CODE className="whitespace-pre !bg-[transparent] !border-none text-default">
          {line.substring(1).trim()}
        </CODE>
      </div>
    );
  }

  return (
    <CODE key={key} className="whitespace-pre !bg-[transparent] !border-none text-default">
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
