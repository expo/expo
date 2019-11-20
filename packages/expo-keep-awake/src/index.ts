import { useEffect } from 'react';

import ExpoKeepAwake from './ExpoKeepAwake';

const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

export function useKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  useEffect(() => {
    activateKeepAwake(tag);
    return () => deactivateKeepAwake(tag);
  }, [tag]);
}

export function activateKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  if (ExpoKeepAwake.activate) ExpoKeepAwake.activate(tag);
}

export function deactivateKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  if (ExpoKeepAwake.deactivate) ExpoKeepAwake.deactivate(tag);
}
