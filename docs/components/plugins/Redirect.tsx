import { css } from '@emotion/core';
import * as React from 'react';

const CONTAINER_STYLE = css`
  background-color: rgba(225, 228, 23, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const Redirect: React.FC<{ path: string }> = ({ path }) => {
  React.useEffect(() => {
    setTimeout(() => {
      window.location.href = path;
    }, 0);
  });

  return (
    <div css={CONTAINER_STYLE}>
      Redirecting to <a href={path}>{path}</a>
    </div>
  );
};

export default Redirect;
