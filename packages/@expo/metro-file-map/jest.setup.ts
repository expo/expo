// Prevent real filesystem access in tests — use memfs via __mocks__/
jest.mock('fs');
jest.mock('fs/promises');

// The timers module is not automatically faked by jest.useFakeTimers().
// Redirect it to globalThis so faked timers are used consistently.
jest.mock('timers', () => ({
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
}));
