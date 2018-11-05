jest.mock('../RemoteConsole', () => ({
  createRemoteConsole: jest.fn(originalConsole => {
    let remoteConsole = Object.create(originalConsole);
    remoteConsole.__isRemote = true;
    return remoteConsole;
  }),
}));

let enableExpoCliLogging;
let disableExpoCliLogging;

let _originalConsole;

beforeEach(() => {
  _originalConsole = global.console;
  ({ enableExpoCliLogging, disableExpoCliLogging } = require('../Logs').default);
});

afterEach(() => {
  global.console = _originalConsole;
  jest.resetModules();
});

it(`enhances the global console`, () => {
  expect(global.console.__isRemote).not.toBeDefined();

  enableExpoCliLogging();
  expect(global.console.__isRemote).toBe(true);
});

it(`restores the original console`, () => {
  enableExpoCliLogging();
  expect(global.console.__isRemote).toBe(true);

  disableExpoCliLogging();
  expect(global.console).toBe(_originalConsole);
  expect(global.console.__isRemote).not.toBeDefined();
});

it(`doesn't fail if enabled multiple times`, () => {
  expect(global.console.__isRemote).not.toBeDefined();

  enableExpoCliLogging();
  let firstEnhancedConsole = global.console;
  expect(global.console.__isRemote).toBe(true);

  expect(enableExpoCliLogging).not.toThrow();
  expect(global.console.__isRemote).toBe(true);
  expect(global.console).toBe(firstEnhancedConsole);
});

it(`doesn't fail if disabled when not enabled`, () => {
  expect(disableExpoCliLogging).not.toThrow();
  expect(global.console).toBe(_originalConsole);
  expect(global.console.__isRemote).not.toBeDefined();

  // Test multiple calls
  expect(disableExpoCliLogging).not.toThrow();
  expect(global.console).toBe(_originalConsole);
});
