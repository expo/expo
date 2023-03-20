import * as React from 'react';

import { A, P } from '~/ui/components/Text';

const PossibleRedirectNotification = ({ newUrl }: React.PropsWithChildren<{ newUrl: string }>) => {
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
      <div className="bg-warning border border-solid border-warning p-4 mt-1 rounded-sm">
        <P className="mb-0">
          ⚠️ The information you are looking for (addressed by <em>"{targetId}"</em>) has moved.{' '}
          <A href={`${newUrl}#${targetId}`}>Continue to the new location.</A>
        </P>
      </div>
    );
  } else {
    return null;
  }
};

export default PossibleRedirectNotification;
