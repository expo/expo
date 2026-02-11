import 'server-only';

import { requestHeaders } from 'expo-server';

/**
 * @deprecated Use `requestHeaders` from `expo-server` instead
 */
const unstable_headers = async () => requestHeaders();

export { unstable_headers };
