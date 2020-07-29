import { useEffect } from 'react';

import ExpoKeepAwake, { isAvailable } from './ExpoKeepAwake';

const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

export function useKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  useEffect(() => {
    activateKeepAwake(tag);
    return () => deactivateKeepAwake(tag);
  }, [tag]);
}

export function activateKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  if (isAvailable() && ExpoKeepAwake.activate) {
    ExpoKeepAwake.activate(tag);
  }
}

export function deactivateKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  if (isAvailable() && ExpoKeepAwake.deactivate) {
    ExpoKeepAwake.deactivate(tag);
  }
}
