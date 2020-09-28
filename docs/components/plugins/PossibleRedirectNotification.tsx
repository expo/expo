import { css } from '@emotion/core';
import * as React from 'react';

const CONTAINER_STYLE = css`
  background-color: rgba(225, 228, 23, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const PossibleRedirectNotification: React.FC<{ newUrl: string }> = ({ newUrl }) => {
  const [targetId, setTargetId] = React.useState<string | null>(null);

  // We could add a listener on `window.onhashchange` but
  // I don't think this is actually needed.
  React.useEffect(() => {
    const hash = window.location.hash;
    const id = hash ? hash.replace('#', '') : null;
    if (hash && !document.getElementById(id as string)) {
      setTargetId(id);
    }
  }, []);

  if (targetId) {
    return (
      <div css={CONTAINER_STYLE}>
        ⚠️ The information you are looking for (addressed by <em>"{targetId}"</em>) has moved.{' '}
        <a href={`${newUrl}#${targetId}`}>Continue to the new location.</a>
      </div>
    );
  } else {
    return null;
  }
};

export default PossibleRedirectNotification;
