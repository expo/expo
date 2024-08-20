// export { Stack } from './layouts/Stack';
// export { Tabs } from './layouts/Tabs';
// export * from './exports';

import { useRouter_UNSTABLE } from './rsc/router/client';

export { Link } from './rsc/router/client';

export function usePathname() {
  const router = useRouter_UNSTABLE();
  return router.path;
}

export function useLocalSearchParams() {
  const router = useRouter_UNSTABLE();
  return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}
