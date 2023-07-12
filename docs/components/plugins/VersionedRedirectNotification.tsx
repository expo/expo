import { useRouter } from 'next/compat/router';
import { useEffect, useState } from 'react';

import { Callout } from '~/ui/components/Callout';

export default function VersionedRedirectNotification({ showForQuery = 'redirected' }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (router?.query) {
      setVisible(router.query.hasOwnProperty(showForQuery));
    }
  }, [router?.query]);

  if (visible) {
    return (
      <Callout type="warning">
        The page you are looking for does not exist in this SDK version. It may have been deprecated
        or added in a newer SDK version.
      </Callout>
    );
  }

  return null;
}
