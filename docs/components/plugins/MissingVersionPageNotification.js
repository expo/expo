import * as React from 'react';
import { css } from 'react-emotion';

const CONTAINER_STYLE = css`
  background-color: rgba(225, 228, 23, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  line-height: 1.5rem;
`;

export default function MissingVersionPageNotification({ showForHash }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(showForHash === getHash());
  }, []);

  if (visible) {
    return (
      <div className={CONTAINER_STYLE}>
        ⚠️ The page you are looking for does not exist in this SDK version. It may have been
        deprecated or added in a newer SDK version.
      </div>
    );
  }

  return null;
}

function getHash() {
  const { hash } = window.location;
  return hash ? hash.replace('#', '') : null;
}
