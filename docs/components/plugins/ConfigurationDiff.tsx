import { css, jsx } from '@emotion/core';
import React, { useEffect, useState } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';

const TITLE_CONTAINER = css`
  padding: 15px;
  background-color: rgba(246, 246, 246, 0.8);
  border-bottom: 1px solid #e3e3e3;
  font-family: monospace;
  font-size: 0.9rem;
`;

const Title: React.FC = ({ children }) => (
  <div css={TITLE_CONTAINER}>
    <span>{children}</span>
  </div>
);

// These types come from `react-diff-view` library
type RenderFile = (_arg0: {
  oldRevision: string;
  newRevision: string;
  type: 'unified' | 'split';
  hunks: object[];
  newPath: string;
  oldPath: string;
}) => JSX.Element;

const ConfigurationDiff: React.FC<{ source: string }> = ({ source }) => {
  const [diff, setDiff] = useState<any[] | null>(null);
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
    <div className="diff-container">
      <Title>{newPath}</Title>
      <Diff key={oldRevision + '-' + newRevision} viewType="unified" diffType={type} hunks={hunks}>
        {(hunks: any[]) => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
      </Diff>
    </div>
  );

  return <div>{diff.map(renderFile)}</div>;
};

export default ConfigurationDiff;
