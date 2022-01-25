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

const context = createContext({
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
    // Make sure the version is in sync on first load
    onRouteChange(router.pathname);
    router.events.on('routeChangeStart', onRouteChange);
    return () => router.events.off('routeChangeStart', onRouteChange);
  }, []);

  return (
    <context.Provider value={{ version, setVersion: onVersionChange }}>
      {props.children}
    </context.Provider>
  );
}

export function useApiVersion() {
  return useContext(context);
}

// TODO(cedric): remove the need for an HOC component
export function withApiVersion<C extends object>(
  Component: React.ComponentType<C & Partial<React.ContextType<typeof context>>>
) {
  const name = Component.displayName || Component.name || 'Anonymous';
  const component = (props: C) => (
    <context.Consumer>
      {apiVersionProps => <Component {...apiVersionProps} {...props} />}
    </context.Consumer>
  );

  component.displayName = `withApiVersion(${name})`;
  return component;
}
