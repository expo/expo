import { useRouter } from 'next/router';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { isVersionedUrl, getVersionFromUrl, replaceVersionInUrl } from '~/common/utilities';

type Props = PropsWithChildren<object>;

// TODO(cedric): remove the need of exporting this context
export const apiVersionContext = createContext({
  version: 'latest',
  setVersion: (newVersion: string) => console.error('ApiVersion context provider not found'),
});

export function ApiVersionProvider(props: Props) {
  const router = useRouter();
  const [version, setVersion] = useState('latest');

  const onVersionChange = useCallback((newVersion: string) => {
    if (isVersionedUrl(router.pathname)) {
      setVersion(newVersion);
      // note: if the page doesn't exists, the error page will handle it
      router.push(replaceVersionInUrl(router.pathname, newVersion));
    }
  }, []);

  const onRouteChange = useCallback((url: string) => {
    if (isVersionedUrl(url)) {
      setVersion(getVersionFromUrl(url));
    }
  }, []);

  useEffect(() => {
    router.events.on('routeChangeStart', onRouteChange);
    return () => router.events.off('routeChangeStart', onRouteChange);
  }, []);

  return (
    <apiVersionContext.Provider value={{ version, setVersion: onVersionChange }}>
      {props.children}
    </apiVersionContext.Provider>
  );
}

export function useApiVersion() {
  return useContext(apiVersionContext);
}
