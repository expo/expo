import ExpoUpdatesModule from '../ExpoUpdates';
import '../UpdatesEmitter';

jest.mock('../ExpoUpdates', () => {
  const actualModule = jest.requireActual('../ExpoUpdates').default;
  jest.spyOn(actualModule, 'addListener');
  return { __esModule: true, default: actualModule };
});

const nativeStateChangeEventName = 'Expo.nativeUpdatesStateChangeEvent';

const nativeStateChangeHandlersRegisteredOnImport = jest
  .mocked(ExpoUpdatesModule.addListener)
  .mock.calls.filter(([eventName]) => eventName === nativeStateChangeEventName);

function evaluateUpdatesEmitterAgain() {
  jest.isolateModules(() => {
    require('../UpdatesEmitter');
  });
}

it('does not subscribe to the native state change event on import', () => {
  expect(nativeStateChangeHandlersRegisteredOnImport).toHaveLength(0);
});

it('leaves no listener on the shared web module after repeated evaluations', () => {
  evaluateUpdatesEmitterAgain();
  evaluateUpdatesEmitterAgain();
  evaluateUpdatesEmitterAgain();

  expect(ExpoUpdatesModule.listenerCount(nativeStateChangeEventName)).toBe(0);
});
