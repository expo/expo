import { useRouter } from 'next/compat/router';
import nprogress from 'nprogress';
import { useEffect } from 'react';

/**
 * Set up NProgress using NextJS Router events.
 * This hook listens to these three events:
 *   - routeChangeStart → start
 *   - routeChangeComplete → done
 *   - routeChangeError → done
 */
export function useNProgress() {
  const router = useRouter();

  useEffect(function didMount() {
    router?.events.on('routeChangeStart', nprogress.start);
    router?.events.on('routeChangeComplete', nprogress.done);
    router?.events.on('routeChangeError', nprogress.done);

    return function didUnmount() {
      router?.events.off('routeChangeStart', nprogress.start);
      router?.events.off('routeChangeComplete', nprogress.done);
      router?.events.off('routeChangeError', nprogress.done);
    };
  }, []);
}
