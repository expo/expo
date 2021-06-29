import * as React from 'react';

import { P } from '~/components/base/paragraph';
import { CONTAINER_STYLE } from '~/components/plugins/VersionedRedirectNotification';

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
        <P>
          ⚠️ The information you are looking for (addressed by <em>"{targetId}"</em>) has moved.{' '}
          <a href={`${newUrl}#${targetId}`}>Continue to the new location.</a>
        </P>
      </div>
    );
  } else {
    return null;
  }
};

export default PossibleRedirectNotification;
