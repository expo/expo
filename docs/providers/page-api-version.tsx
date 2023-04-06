import { useRouter } from 'next/router';
import { createContext, PropsWithChildren, useCallback, useContext } from 'react';

import { isVersionedPath } from '~/common/routes';
import navigation from '~/public/static/constants/navigation.json';

export const PageApiVersionContext = createContext({
  /** The version selected in the URL, or the default version */
  version: 'latest',
  /** If the current URL has a version defined */
  hasVersion: false,
  /** Change the URL to the select version  */
  setVersion: newVersion => {
    throw new Error('PageApiVersionContext not found');
  },
} as PageApiVersionContextType);

export type PageApiVersionContextType = {
  version: keyof typeof navigation.reference;
  hasVersion: boolean;
  setVersion: (newVersion: string) => void;
};

type Props = PropsWithChildren<object>;

export function PageApiVersionProvider({ children }: Props) {
  const router = useRouter();
  const version = getVersionFromPath(router.pathname);
  const hasVersion = version !== null;

  // note(Cedric): if the page doesn't exists, the error page will handle it
  const setVersion = useCallback((newVersion: string) => {
    router.push(replaceVersionInPath(router.pathname, newVersion));
  }, []);

  return (
    <PageApiVersionContext.Provider
      value={{ setVersion, hasVersion, version: version || 'latest' }}>
      {children}
    </PageApiVersionContext.Provider>
  );
}

export function usePageApiVersion() {
  return useContext(PageApiVersionContext);
}

/**
 * Find the version within the pathname of the URL.
 * This only accepts pathname without hashes or query strings.
 */
export function getVersionFromPath(path: string): PageApiVersionContextType['version'] | null {
  return isVersionedPath(path)
    ? (path.split('/', 3).pop()! as PageApiVersionContextType['version'])
    : null;
}

/**
 * Replace the version in the pathname from the URL.
 * If no version was found, the path is returned as is.
 */
export function replaceVersionInPath(path: string, newVersion: string) {
  const version = getVersionFromPath(path);
  return version ? path.replace(version, newVersion) : path;
}
