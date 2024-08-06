import { type PropsWithChildren, useState } from 'react';

import { type ProtocolType, SharedContext } from './utils';

/**
 * Wraps a group of route urls and shares the preference.
 */
export function RouteUrlGroup({ children }: PropsWithChildren) {
  const [type, setType] = useState<ProtocolType>('custom');
  return <SharedContext.Provider value={{ type, setType }}>{children}</SharedContext.Provider>;
}
