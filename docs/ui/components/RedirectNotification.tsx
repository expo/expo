import { useRouter } from 'next/compat/router';
import { useEffect, useState, PropsWithChildren } from 'react';
import { InlineHelp } from 'ui/components/InlineHelp';

type Props = PropsWithChildren<{
  showForQuery?: string;
}>;

export default function RedirectNotification({ showForQuery = 'redirected', children }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (router?.query) {
      setVisible(router.query.hasOwnProperty(showForQuery));
    }
  }, [router?.query]);

  if (visible) {
    return <InlineHelp type="warning">{children}</InlineHelp>;
  }

  return null;
}
