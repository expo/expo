import { useSelector } from 'react-redux';

export default function isUserAuthenticated(session: { sessionSecret: string | null }): boolean {
  return !!session.sessionSecret;
}

export function useIsAuthenticated() {
  return useSelector(data => isUserAuthenticated(data.session));
}
