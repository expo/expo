import { css } from '@emotion/core';
import { useRouter } from 'next/router';
import * as React from 'react';

import { P } from '~/components/base/paragraph';
import * as Constants from '~/constants/theme';

const CONTAINER_STYLE = css`
  background-color: ${Constants.expoColors.yellow[100]};
  border: 1px solid ${Constants.expoColors.yellow[200]};
  padding: 16px;
  margin-bottom: 1rem;
  border-radius: 4px;

  div {
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
  }, []);

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
