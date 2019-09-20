export default class MockNativeSensorModule {
  addListener = jest.fn(async () => {});
  removeListeners = jest.fn(async () => {});
  startObserving = jest.fn(async () => {});
  stopObserving = jest.fn(async () => {});
  setUpdateInterval = jest.fn(async () => {});
}
