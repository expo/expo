import { KeepAwakeEventType } from './ExpoKeepAwake.types';

export function isAvailable() {
  return 'wakeLock' in navigator;
}

function createKeepAwakeManager() {
  const wakeLockMap: Record<string, any> = {};
  return {
    async activate(tag: string) {
      if (wakeLockMap[tag]) {
        throw new Error(`The wake lock with tag ${tag} is already activated.`);
      }

      const wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLockMap[tag] = wakeLock;
    },
    async deactivate(tag: string) {
      if (wakeLockMap[tag]) {
        wakeLockMap[tag].release();
        wakeLockMap[tag] = null;
      } else {
        throw new Error(`The wake lock with tag ${tag} has not activated yet`);
      }
    },
    addListener(tag: string, listener: (eventType: KeepAwakeEventType) => void) {
      if (wakeLockMap[tag]) {
        wakeLockMap[tag].addEventListener('release', () => {
          listener(KeepAwakeEventType.RELEASE);
        });
      }
    },
  };
}

export default createKeepAwakeManager();
