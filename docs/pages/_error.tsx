import { css } from '@emotion/react';
import { Button, theme, typography } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import * as Sentry from '@sentry/browser';
import { useEffect, useState } from 'react';

import { getRedirectPath } from '~/common/error-utilities';
import Head from '~/components/Head';
import { NotFoundImage, RedirectImage, ServerErrorImage } from '~/ui/components/ErrorPage';
import { Layout } from '~/ui/components/Layout';
import { H1, P } from '~/ui/components/Text';

const REDIRECT_SUFFIX = '?redirected';

const renderRedirect = () => (
  // note(simek): "redirect-link" ID is needed for test-links script
  <>
    <Head title="Redirecting" />
    <RedirectImage />
    <H1 css={styles.header}>Redirecting</H1>
    <P css={styles.description} id="redirect-link">
      Just a moment…
    </P>
  </>
);

const renderNotFoundAfterRedirect = () => (
  <>
    <Head title="Not Found" />
    <ServerErrorImage />
    <H1 css={styles.header}>404: Not Found</H1>
    <P css={styles.description} id="__redirect_failed">
      We took an educated guess and tried to direct you to the right page, but it seems that did not
      work out! Maybe it doesn't exist anymore! 😔
    </P>
    <Button theme="secondary" href="/">
      Return Home
    </Button>
  </>
);

const renderNotFound = () => (
  <>
    <Head title="Not Found" />
    <NotFoundImage />
    <H1 css={styles.header}>404: Not Found</H1>
    <P css={styles.description} id="__not_found">
      We couldn't find the page you were looking for. Check the URL to make sure it's correct and
      try again.
    </P>
    <Button theme="secondary" href="/">
      Return Home
    </Button>
  </>
);

const Error = () => {
  const [notFound, setNotFound] = useState<boolean>(false);
  const [redirectFailed, setRedirectFailed] = useState<boolean>(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const { pathname, search } = window.location;

    if (search === REDIRECT_SUFFIX) {
      Sentry.captureMessage(`Redirect failed`);
      setRedirectFailed(true);
      return;
    }

    const newRedirectPath = getRedirectPath(pathname);

    if (newRedirectPath !== pathname) {
      setRedirectPath(newRedirectPath);
      return;
    }

    // We are confident now that we can render a not found error
    setNotFound(true);
    Sentry.captureMessage(`Page not found (404)`, {
      extra: {
        '404': pathname,
      },
    });
  }, []);

  useEffect(() => {
    if (redirectPath && typeof window !== 'undefined') {
      setTimeout(() => (window.location.href = `${redirectPath}${REDIRECT_SUFFIX}`), 1200);
    }
  }, [redirectPath]);

  const getContent = () => {
    if (redirectPath) {
      return renderRedirect();
    } else if (redirectFailed) {
      return renderNotFoundAfterRedirect();
    } else if (notFound) {
      return renderNotFound();
    }
    return undefined;
  };

  return (
    <Layout cssLayout={styles.layout} cssContent={styles.container}>
      {getContent()}
    </Layout>
  );
};

export default Error;

const styles = {
  layout: css({
    backgroundColor: theme.background.subtle,
  }),
  container: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  }),
  header: css({
    ...typography.fontSizes[31],
    marginTop: spacing[8],
  }),
  description: css({
    textAlign: 'center',
    maxWidth: 450,
    marginTop: spacing[6],
    marginBottom: spacing[8],
    color: theme.text.secondary,
  }),
};
