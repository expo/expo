import { Copy07Icon } from '@expo/styleguide-icons';
import { useEffect, useState, PropsWithChildren } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

import { PermalinkedSnippetHeader } from '../PermalinkedSnippetHeader';
import { Snippet } from '../Snippet';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';

import { SettingsAction } from '~/ui/components/Snippet/actions/SettingsAction';

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
  showOperation?: boolean;
  collapseDeletedFiles?: boolean;
  SnippetHeaderComponent?: typeof SnippetHeader | typeof PermalinkedSnippetHeader;
}>;

export const DiffBlock = ({
  source,
  raw,
  filenameModifier = str => str,
  showOperation = false,
  collapseDeletedFiles = false,
  SnippetHeaderComponent = SnippetHeader,
}: Props) => {
  const [diff, setDiff] = useState<RenderLine[] | null>(raw ? parseDiff(raw) : null);
  useEffect(() => {
    if (source) {
      const fetchDiffAsync = async () => {
        const response = await fetch(source);
        const result = await response.text();
        setDiff(parseDiff(result));
      };

      fetchDiffAsync();
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
    if (!hunks.length) {
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
