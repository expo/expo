import React, { useEffect, useState } from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_BOLD = css`
  font-family: ${Constants.fonts.demi};
  font-weight: 400;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`;

const TITLE_CONTAINER = css`
  padding: 15px;
  background-color: rgba(246, 246, 246, 0.8);
  border-bottom: 1px solid #e3e3e3;
  font-family: monospace;
  font-size: 0.9rem;
`;

function Title({ children }) {
  return (
    <div className={TITLE_CONTAINER}>
      <span>{children}</span>
    </div>
  );
}

export default function ConfigurationDiff({ source }) {
  const [diff, setDiff] = useState(null);
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

  const renderFile = ({ oldRevision, newRevision, type, hunks, oldPath, newPath }) => (
    <div className="diff-container">
      <Title>{newPath}</Title>
      <Diff key={oldRevision + '-' + newRevision} viewType="unified" diffType={type} hunks={hunks}>
        {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
      </Diff>
    </div>
  );

  return <div>{diff.map(renderFile)}</div>;
}
