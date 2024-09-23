import { useRouter_UNSTABLE } from './router/client';

export { Link } from './router/client';

export function usePathname() {
  const router = useRouter_UNSTABLE();
  return router.path;
}

export function useLocalSearchParams() {
  const router = useRouter_UNSTABLE();
  return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}
