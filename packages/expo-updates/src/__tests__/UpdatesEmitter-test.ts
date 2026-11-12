import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'expo-modules-core';

import ExpoUpdatesModule from '../ExpoUpdates';
import {
  addUpdatesStateChangeListener,
  emitTestStateChangeEvent,
  latestContext,
} from '../UpdatesEmitter';
import { useUpdates } from '../UseUpdates';

jest.mock('../ExpoUpdates', () => {
  const actualModule = jest.requireActual('../ExpoUpdates').default;
  jest.spyOn(actualModule, 'addListener');
  return { __esModule: true, default: actualModule };
});

const nativeStateChangeEventName = 'Expo.nativeUpdatesStateChangeEvent';
const isWebServerRender = Platform.OS === 'web' && typeof window === 'undefined';

const nativeStateChangeHandlersRegisteredOnImport = jest
  .mocked(ExpoUpdatesModule.addListener)
  .mock.calls.filter(([eventName]) => eventName === nativeStateChangeEventName)
  .map(([, handler]) => handler as (event: unknown) => void);

function stateChangeEvent(sequenceNumber: number) {
  return {
    context: {
      isStartupProcedureRunning: false,
      isUpdateAvailable: true,
      isUpdatePending: false,
      isChecking: false,
      isDownloading: false,
      isRestarting: false,
      restartCount: 0,
      sequenceNumber,
      downloadProgress: 0,
    },
  };
}

function evaluateUpdatesEmitterAgain() {
  jest.isolateModules(() => {
    require('../UpdatesEmitter');
  });
}

if (isWebServerRender) {
  describe('UpdatesEmitter on a web server render', () => {
    it('does not subscribe to the native state change event on import', () => {
      expect(nativeStateChangeHandlersRegisteredOnImport).toHaveLength(0);
    });

    it('leaves no listener on the shared web module after repeated evaluations', () => {
      evaluateUpdatesEmitterAgain();
      evaluateUpdatesEmitterAgain();
      evaluateUpdatesEmitterAgain();

      expect(ExpoUpdatesModule.listenerCount(nativeStateChangeEventName)).toBe(0);
    });

    it('still notifies subscribers until they are removed', () => {
      const listener = jest.fn();
      const subscription = addUpdatesStateChangeListener(listener);
      emitTestStateChangeEvent(stateChangeEvent(1));
      subscription.remove();
      emitTestStateChangeEvent(stateChangeEvent(2));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
} else {
  describe(`UpdatesEmitter on ${Platform.OS}`, () => {
    it('subscribes to the native state change event once on import', () => {
      expect(nativeStateChangeHandlersRegisteredOnImport).toHaveLength(1);
    });

    it('forwards native state changes to useUpdates', async () => {
      const handleNativeStateChange = nativeStateChangeHandlersRegisteredOnImport[0]!;
      const { result } = await renderHook(() => useUpdates());
      expect(result.current.isUpdateAvailable).toBeFalsy();

      await act(async () => {
        handleNativeStateChange(stateChangeEvent(1));
      });

      expect(result.current.isUpdateAvailable).toBe(true);
      expect(latestContext.sequenceNumber).toBe(1);
    });
  });
}
