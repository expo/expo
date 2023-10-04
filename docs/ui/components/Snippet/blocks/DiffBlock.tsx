import { Copy07Icon } from '@expo/styleguide-icons';
import { useEffect, useState, PropsWithChildren } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

import { Snippet } from '../Snippet';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';

const randomCommitHash = () => Math.random().toString(36).slice(2, 9);

function removePrefix(str: string) {
  return str.replace('templates/expo-template-bare-minimum/', '');
}

// These types come from `react-diff-view` library
type RenderLine = {
  oldRevision: string;
  newRevision: string;
  type: 'unified' | 'split';
  hunks: object[];
  newPath: string;
  oldPath: string;
};

type Props = PropsWithChildren<{
  source?: string;
  raw?: string;
}>;

export const DiffBlock = ({ source, raw }: Props) => {
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

  console.log(diff);

  const renderFile = ({
    oldRevision = randomCommitHash(),
    newRevision = randomCommitHash(),
    type,
    hunks,
    newPath,
    oldPath,
  }: RenderLine) => (
    <Snippet key={oldRevision + '-' + newRevision}>
      <SnippetHeader
        title={`${removePrefix(type === 'delete' ? oldPath : newPath)}`}
        Icon={Copy07Icon}
        operationType={type}
      />
      <SnippetContent className="p-0" hideOverflow>
        <Diff viewType="unified" diffType={type} hunks={hunks}>
          {(hunks: any[]) => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
        </Diff>
      </SnippetContent>
    </Snippet>
  );

  return <>{diff.map(renderFile)}</>;
};
