import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { Language, Prism } from 'prism-react-renderer';

import { CODE } from '~/ui/components/Text';

import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';

type TerminalProps = {
  cmd: string[];
  cmdCopy?: string;
  hideOverflow?: boolean;
  title?: string;
  className?: string;
  browserAction?: {
    href: string;
    label: string;
  };
};

export const Terminal = ({
  cmd,
  cmdCopy,
  hideOverflow,
  className,
  title = 'Terminal',
  browserAction,
}: TerminalProps) => (
  <Snippet className={mergeClasses('terminal-snippet [li_&]:mt-4', className)}>
    <SnippetHeader alwaysDark title={title} Icon={TerminalSquareIcon}>
      {renderBrowserAction(browserAction)}
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
  const copyText = cmdCopy ?? getDefaultCmdCopy(cmd);
  return copyText && <CopyAction alwaysDark text={copyText} />;
}

function renderBrowserAction(browserAction: TerminalProps['browserAction']) {
  if (!browserAction) {
    return null;
  }

  const { href, label } = browserAction;

  return (
    <SnippetAction
      alwaysDark
      className="max-sm-gutters:gap-0 [&_p]:max-sm-gutters:hidden"
      rightSlot={<ArrowUpRightIcon className="icon-sm shrink-0 text-icon-secondary" />}
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }}>
      {label}
    </SnippetAction>
  );
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
        className="select-none whitespace-pre !border-none !bg-transparent !text-palette-gray10">
        {line}
      </CODE>
    );
  }

  if (line.startsWith('$')) {
    return (
      <div key={key} className="w-fit">
        <CODE className="select-none whitespace-pre !border-none !bg-transparent !text-secondary">
          -&nbsp;
        </CODE>
        <CODE
          className="whitespace-pre !border-none !bg-transparent text-default"
          dangerouslySetInnerHTML={{
            __html: Prism.highlight(
              line.slice(1).trim(),
              Prism.languages['bash'],
              'bash' as Language
            ),
          }}
        />
      </div>
    );
  }

  return (
    <CODE key={key} className="whitespace-pre !border-none !bg-transparent text-default">
      {line}
    </CODE>
  );
}
