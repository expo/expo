import { css } from '@emotion/react';
import { borderRadius, spacing, theme, typography } from '@expo/styleguide';
import React, { useEffect, useState, PropsWithChildren } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

const DiffTitle = ({ children }: PropsWithChildren<object>) => (
  <div css={titleContainerStyles}>
    <span>{children}</span>
  </div>
);

// These types come from `react-diff-view` library
type RenderLine = {
  oldRevision: string;
  newRevision: string;
  type: 'unified' | 'split';
  hunks: object[];
  newPath: string;
  oldPath: string;
};

type RenderFile = (_arg0: RenderLine) => JSX.Element;

const ConfigurationDiff = ({ source }: PropsWithChildren<{ source: string }>) => {
  const [diff, setDiff] = useState<RenderLine[] | null>(null);
  useEffect(() => {
    async function fetchDiffAsync() {
      const response = await fetch(source);
      const result = await response.text();
      setDiff(parseDiff(result));
    }

    fetchDiffAsync();
  }, [source]);

  if (!diff) {
    return null;
  }

  const renderFile: RenderFile = ({ oldRevision, newRevision, type, hunks, newPath }) => (
    <div css={diffContainerStyles}>
      <DiffTitle>{newPath}</DiffTitle>
      <Diff key={oldRevision + '-' + newRevision} viewType="unified" diffType={type} hunks={hunks}>
        {(hunks: any[]) => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
      </Diff>
    </div>
  );

  return <div>{diff.map(renderFile)}</div>;
};

const diffContainerStyles = css`
  font-family: ${typography.fontFaces.mono};
  color: ${theme.text.default};
  border: 1px solid ${theme.border.default};
  background-color: ${theme.background.screen};
  border-radius: ${borderRadius.small}px;
  margin-bottom: ${spacing[4]}px;

  table {
    ${typography.fontSizes[14]}
    border: none;
  }

  td,
  th {
    border-bottom: none;
  }

  .diff-gutter-normal {
    color: ${theme.text.secondary};
  }

  .diff-gutter-insert,
  .diff-code-insert {
    background: ${theme.background.success};
    color: ${theme.text.success};
  }

  .diff-gutter-delete,
  .diff-code-delete {
    background: ${theme.background.error};
    color: ${theme.text.error};
  }
`;

const titleContainerStyles = css`
  padding: ${spacing[3.5]}px;
  background-color: ${theme.background.default};
  border-bottom: 1px solid ${theme.border.default};
  border-radius: ${borderRadius.small}px ${borderRadius.small}px 0 0;
  color: ${theme.text.default};
  word-break: break-word;
`;

export default ConfigurationDiff;
