import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { useRouter } from 'next/router';
import * as React from 'react';

import { P } from '~/ui/components/Text';

export const CONTAINER_STYLE = css`
  background-color: ${theme.background.warning};
  border: 1px solid ${theme.border.warning};
  padding: 16px;
  margin-bottom: 1rem;
  border-radius: 4px;

  div,
  p {
    margin-bottom: 0;
  }
`;

export default function VersionedRedirectNotification({ showForQuery = 'redirected' }) {
  const router = useRouter();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (router.query) {
      setVisible(router.query.hasOwnProperty(showForQuery));
    }
  }, [router.query]);

  if (visible) {
    return (
      <div css={CONTAINER_STYLE}>
        <P>
          ⚠️ The page you are looking for does not exist in this SDK version. It may have been
          deprecated or added in a newer SDK version.
        </P>
      </div>
    );
  }

  return null;
}
