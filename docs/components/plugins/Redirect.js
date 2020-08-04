import * as React from 'react';
import { css } from 'react-emotion';

const CONTAINER_STYLE = css`
  background-color: rgba(225, 228, 23, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

export default function Redirect({ path }) {
  React.useEffect(() => {
    setTimeout(() => {
      window.location.href = path;
    }, 0);
  });

  return (
    <div className={CONTAINER_STYLE}>
      Redirecting to <a href={path}>{path}</a>
    </div>
  );
}
