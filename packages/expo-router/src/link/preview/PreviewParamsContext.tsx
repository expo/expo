import { createContext, use } from 'react';

import type { UnknownOutputParams } from '../../types';

export const PreviewParamsContext = createContext<UnknownOutputParams | undefined>(undefined);

export function useIsPreview() {
  return !!use(PreviewParamsContext);
}
