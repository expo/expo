import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';

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
    return <br key={key} className="select-none" />;
  }

  if (line.startsWith('#')) {
    return (
      <div key={key} className="dark-theme">
        <CODE className="whitespace-pre inline-block !bg-[transparent] !border-none !leading-snug select-none !text-palette-gray10">
          {line}
        </CODE>
      </div>
    );
  }

  if (line.startsWith('$')) {
    return (
      <div key={key} className="dark-theme">
        <CODE className="whitespace-pre inline-block !bg-[transparent] !border-none !leading-snug select-none !text-secondary">
          -&nbsp;
        </CODE>
        <CODE className="whitespace-pre inline-block !bg-[transparent] !border-none text-default !leading-snug">
          {line.substring(1).trim()}
        </CODE>
      </div>
    );
  }

  return (
    <div key={key} className="dark-theme">
      <CODE
        css={[{ display: 'inherit' }]}
        className="whitespace-pre inline-block !bg-[transparent] !border-none text-default !leading-snug">
        {line}
      </CODE>
    </div>
  );
}

const wrapperStyle = css`
  li & {
    margin-top: ${spacing[4]}px;
    display: flex;
  }
`;
