import type { Href } from '../types';
import { useRouter_UNSTABLE } from './router/client';
import { Children } from './router/host';

export { Link } from './router/client';

export function usePathname() {
  const router = useRouter_UNSTABLE();
  return router.path;
}

// TODO: This doesn't work the same as the classic version.
export function useLocalSearchParams() {
  const router = useRouter_UNSTABLE();
  return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}

export function useGlobalSearchParams() {
  const router = useRouter_UNSTABLE();
  return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}

export function Slot() {
  return <Children />;
}

export function Stack() {
  console.warn('Stack is not implemented in React Server Components yet');
  return <Children />;
}

export function Tabs() {
  console.warn('Tabs is not implemented in React Server Components yet');
  return <Children />;
}

export function Navigator() {
  throw new Error('Navigator is not implemented in React Server Components yet');
}

/** Redirects to the href as soon as the component is mounted. */
export function Redirect({ href }: { href: Href }) {
  const router = useRouter_UNSTABLE();
  router.replace(href);
  return null;
}

export function ExpoRoot() {
  throw new Error('ExpoRoot is not implemented in React Server Components yet');
}

export function useFocusEffect() {
  console.warn('useFocusEffect is not implemented in React Server Components yet');
}

export function useNavigation() {
  console.warn('useNavigation is not implemented in React Server Components yet');
}

export function withLayoutContext() {
  throw new Error('withLayoutContext is not implemented in React Server Components yet');
}
export function useNavigationContainerRef() {
  throw new Error('useNavigationContainerRef is not implemented in React Server Components yet');
}

export function useSegments() {
  throw new Error('useSegments is not implemented in React Server Components yet');
}
export function useRootNavigation() {
  throw new Error('useRootNavigation is not implemented in React Server Components yet');
}
export function useRootNavigationState() {
  throw new Error('useRootNavigationState is not implemented in React Server Components yet');
}
export function useUnstableGlobalHref() {
  throw new Error('useUnstableGlobalHref is not implemented in React Server Components yet');
}

export { useRouter_UNSTABLE as useRouter };

// Expo Router Views
export { Unmatched } from '../views/Unmatched';
export { ErrorBoundaryProps } from '../views/Try';
export { ErrorBoundary } from '../views/ErrorBoundary';

export const router = new Proxy(
  {},
  {
    get(target, prop, receiver) {
      throw new Error(
        `The router object is not available in React Server Components. Use the useRouter hook instead.`
      );
    },
  }
);

// TODO:
// export { Redirect } from './link/Link';
