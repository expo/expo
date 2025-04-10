import { Button } from '@expo/styleguide';
import { captureMessage } from '@sentry/browser';
import { useEffect, useState } from 'react';

import { getRedirectPath } from '~/common/error-utilities';
import DocumentationHead from '~/components/DocumentationHead';
import { NotFoundImage, RedirectImage, ServerErrorImage } from '~/ui/components/ErrorPage';
import { Layout } from '~/ui/components/Layout';
import { H1, P } from '~/ui/components/Text';

const REDIRECT_SUFFIX = '?redirected';

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
      captureMessage(`Redirect failed`);
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
    captureMessage(`Page not found (404)`, {
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

  return (
    <Layout className="flex flex-col items-center justify-center !pb-20">
      {redirectPath && (
        <>
          <DocumentationHead title="Redirecting" />
          <RedirectImage />
          <H1 className="!mt-8">Redirecting</H1>
          {/* note(simek): "redirect-link" ID is needed for test-links script */}
          <P theme="secondary" className="mb-8 max-w-[450px] text-center" id="redirect-link">
            Just a moment…
          </P>
        </>
      )}
      {(redirectFailed || notFound) && (
        <>
          <DocumentationHead title="Not Found" />
          {redirectFailed ? <ServerErrorImage /> : <NotFoundImage />}
          <H1 className="!mt-8">404: Not Found</H1>
          {redirectFailed ? (
            <P theme="secondary" className="mb-8 max-w-[450px] text-center" id="__redirect_failed">
              We took an educated guess and tried to direct you to the right page, but it seems that
              did not work out! Maybe it doesn't exist anymore! 😔
            </P>
          ) : (
            <P theme="secondary" className="mb-8 max-w-[450px] text-center" id="__not_found">
              We couldn't find the page you were looking for. Check the URL to make sure it's
              correct and try again.
            </P>
          )}
          <Button theme="secondary" href="/">
            Return Home
          </Button>
        </>
      )}
    </Layout>
  );
};

export default Error;
