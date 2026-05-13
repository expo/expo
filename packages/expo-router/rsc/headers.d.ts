import { requestHeaders } from 'expo-server';

/**
 * @deprecated Use `requestHeaders` from `expo-server` instead
 */
declare const unstable_headers: () => Promise<ReturnType<typeof requestHeaders>>;

export { unstable_headers };
