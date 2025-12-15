import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { Copy07Icon } from '@expo/styleguide-icons/outline/Copy07Icon';
import { useEffect, useState, PropsWithChildren } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

import { SettingsAction } from '~/ui/components/Snippet/actions/SettingsAction';

import { PermalinkedSnippetHeader } from '../PermalinkedSnippetHeader';
import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';

const randomCommitHash = () => Math.random().toString(36).slice(2, 9);

// These types come from `react-diff-view` library
type RenderLine = {
  oldRevision: string;
  newRevision: string;
  type: 'delete' | 'add' | 'modify';
  hunks: object[];
  newPath: string;
  oldPath: string;
};

type Props = PropsWithChildren<{
  source?: string;
  raw?: string;
  filenameModifier?: (filename: string) => string;
  filenameToLinkUrl?: (filename: string) => string;
  showOperation?: boolean;
  collapseDeletedFiles?: boolean;
  SnippetHeaderComponent?: typeof SnippetHeader | typeof PermalinkedSnippetHeader;
}>;

const normalizeDiff = (text: string) => {
  if (!text) {
    return '';
  }

  let inHunk = false;

  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('diff ')) {
        inHunk = false;
        return line;
      }

      if (line.startsWith('@@')) {
        inHunk = true;
        return line;
      }

      if (
        line.startsWith('index ') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ') ||
        line.startsWith('\\ No newline')
      ) {
        return line;
      }

      if (inHunk && !/^[ +-]/.test(line)) {
        return ` ${line}`;
      }

      return line;
    })
    .join('\n');
};

const safeParseDiff = (text: string) => {
  try {
    return parseDiff(text);
  } catch (error) {
    console.warn('Failed to parse diff', error);
    return null;
  }
};

export const DiffBlock = ({
  source,
  raw,
  filenameModifier = str => str,
  filenameToLinkUrl,
  showOperation = false,
  collapseDeletedFiles = false,
  SnippetHeaderComponent = SnippetHeader,
}: Props) => {
  const initialRaw = typeof raw === 'string' && raw.trim().length > 0 ? normalizeDiff(raw) : null;
  const [diff, setDiff] = useState<RenderLine[] | null>(initialRaw ? safeParseDiff(initialRaw) : null);
  useEffect(() => {
    if (source) {
      const fetchDiffAsync = async () => {
        const response = await fetch(source);
        const result = await response.text();
        const normalized = normalizeDiff(result);
        setDiff(safeParseDiff(normalized));
      };

      void fetchDiffAsync();
    }
  }, [source]);

  if (!diff) {
    return null;
  }

  const renderFile = ({
    oldRevision = randomCommitHash(),
    newRevision = randomCommitHash(),
    type,
    hunks,
    newPath,
    oldPath,
  }: RenderLine) => {
    // older SDK template-bare-minimum files (e.g, 46) generate a diff with no hunks and no paths
    // one example of this was a change to gradle-wrapper.jar
    if (hunks.length === 0) {
      return null;
    }
    return (
      <Snippet key={oldRevision + '-' + newRevision}>
        <SnippetHeaderComponent
          title={`${filenameModifier(type === 'delete' ? oldPath : newPath)}`}
          Icon={Copy07Icon}
          operationType={type}
          showOperation={showOperation}
          float={collapseDeletedFiles && type === 'delete'}>
          {newPath && filenameToLinkUrl && type !== 'delete' ? (
            <SnippetAction
              rightSlot={<ArrowUpRightIcon className="icon-sm shrink-0 text-icon-secondary" />}
              onClick={() => {
                window.open(filenameToLinkUrl(newPath), '_blank');
              }}>
              Raw
            </SnippetAction>
          ) : null}
          <SettingsAction />
        </SnippetHeaderComponent>
        {!collapseDeletedFiles || type !== 'delete' ? (
          <SnippetContent className="p-0" hideOverflow>
            <Diff viewType="unified" diffType={type} hunks={hunks}>
              {(hunks: any[]) => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
            </Diff>
          </SnippetContent>
        ) : null}
      </Snippet>
    );
  };

  return <>{diff.map(renderFile)}</>;
};
