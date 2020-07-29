import { useEffect } from 'react';

import ExpoKeepAwake, { isAvailable } from './ExpoKeepAwake';
import { KeepAwakeEventType } from './ExpoKeepAwake.types';

const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

function useKeepAwake(tag: string = ExpoKeepAwakeTag): void {
  useEffect(() => {
    activateKeepAwake(tag);
    return () => {
      deactivateKeepAwake(tag);
    };
  }, [tag]);
}

async function activateKeepAwake(tag: string = ExpoKeepAwakeTag): Promise<void> {
  if (isAvailable() && ExpoKeepAwake.activate) {
    await ExpoKeepAwake.activate(tag);
  }
}

async function deactivateKeepAwake(tag: string = ExpoKeepAwakeTag): Promise<void> {
  if (isAvailable() && ExpoKeepAwake.deactivate) {
    await ExpoKeepAwake.deactivate(tag);
  }
}

function addEventListener(tag: string, listener: (eventType: KeepAwakeEventType) => void) {
  if (isAvailable() && ExpoKeepAwake.addListener) {
    ExpoKeepAwake.addListener(tag, listener);
  }
}

export {
  addEventListener,
  activateKeepAwake,
  deactivateKeepAwake,
  useKeepAwake,
  KeepAwakeEventType,
};
