import { useRouter } from 'next/router';
import * as React from 'react';
import { css } from 'react-emotion';

const CONTAINER_STYLE = css`
  background-color: rgba(225, 228, 23, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  line-height: 1.5rem;
`;

export default function VersionedRedirectNotification({ showForQuery = 'redirected' }) {
  const router = useRouter();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (router.query) {
      setVisible(router.query.hasOwnProperty(showForQuery));
    }
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
