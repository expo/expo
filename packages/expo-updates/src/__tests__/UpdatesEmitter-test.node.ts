import ExpoUpdatesModule from '../ExpoUpdates';

jest.mock('../ExpoUpdates');

const EVENT_NAME = 'Expo.nativeUpdatesStateChangeEvent';

it('keeps a single native listener when the module graph is re-evaluated', () => {
  require('../UpdatesEmitter');
  expect(ExpoUpdatesModule.listenerCount(EVENT_NAME)).toBe(1);

  // A server rendering runtime recreates the module graph for every request, while the native
  // module instance persists on the global object. Without cleanup each evaluation stacked
  // another listener that retained the whole previous module scope, leaking until the dev
  // server ran out of heap. See https://github.com/expo/expo/issues/47938.
  for (let i = 0; i < 5; i++) {
    jest.resetModules();
    require('../UpdatesEmitter');
  }

  expect(ExpoUpdatesModule.listenerCount(EVENT_NAME)).toBe(1);
});
