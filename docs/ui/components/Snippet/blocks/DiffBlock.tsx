import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';
import React, { useEffect, useState, PropsWithChildren } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

import { Snippet } from '../Snippet';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';

const randomCommitHash = () => Math.random().toString(36).slice(2, 9);

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

  const renderFile = ({
    oldRevision = randomCommitHash(),
    newRevision = randomCommitHash(),
    type,
    hunks,
    newPath,
  }: RenderLine) => (
    <Snippet css={diffContainerStyles} key={oldRevision + '-' + newRevision}>
      <SnippetHeader title={newPath} />
      <SnippetContent skipPadding hideOverflow>
        <Diff viewType="unified" diffType={type} hunks={hunks}>
          {(hunks: any[]) => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
        </Diff>
      </SnippetContent>
    </Snippet>
  );

  return <>{diff.map(renderFile)}</>;
};

const diffContainerStyles = css`
  table {
    ${typography.fontSizes[14]}
  }

  td,
  th {
    border-bottom: none;
  }

  .diff-line:first-of-type {
    height: 29px;

    td {
      padding-top: ${spacing[2]}px;
    }
  }

  .diff-line:last-of-type {
    height: 29px;
  }

  .diff-gutter-col {
    width: ${spacing[10]}px;
    background: ${theme.background.tertiary};
  }

  .diff-gutter-normal {
    color: ${theme.icon.secondary};
  }

  .diff-code {
    word-break: break-word;
    padding-left: ${spacing[4]}px;
  }

  .diff-gutter-insert,
  .diff-code-insert {
    background: ${theme.palette.green['000']};
    color: ${theme.text.success};
  }

  .diff-gutter-insert {
    background: ${theme.background.success};
  }

  .diff-gutter-delete,
  .diff-code-delete {
    background: ${theme.palette.red['000']};
    color: ${theme.text.error};
  }

  .diff-gutter-delete {
    background: ${theme.background.error};
  }

  [data-expo-theme='dark'] & {
    .diff-gutter-insert {
      background: ${theme.palette.green['100']};
    }

    .diff-gutter-delete {
      background: ${theme.palette.red['100']};
    }
  }
`;
