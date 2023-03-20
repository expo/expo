import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { P } from '~/ui/components/Text';

export default function VersionedRedirectNotification({ showForQuery = 'redirected' }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (router.query) {
      setVisible(router.query.hasOwnProperty(showForQuery));
    }
  }, [router.query]);

  if (visible) {
    return (
      <div className="bg-warning border border-solid border-warning p-4 mt-1 rounded-sm">
        <P className="mb-0">
          ⚠️ The page you are looking for does not exist in this SDK version. It may have been
          deprecated or added in a newer SDK version.
        </P>
      </div>
    );
  }

  return null;
}
