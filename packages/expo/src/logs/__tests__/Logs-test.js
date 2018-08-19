jest.mock('../RemoteConsole', () => ({
  createRemoteConsole: jest.fn(originalConsole => {
    let remoteConsole = Object.create(originalConsole);
    remoteConsole.__isRemote = true;
    return remoteConsole;
  }),
}));

let enableXDELogging;
let disableXDELogging;

let _originalConsole;

beforeEach(() => {
  _originalConsole = global.console;
  ({ enableXDELogging, disableXDELogging } = require('../Logs').default);
});

afterEach(() => {
  global.console = _originalConsole;
  jest.resetModules();
});

it(`enhances the global console`, () => {
  expect(global.console.__isRemote).not.toBeDefined();

  enableXDELogging();
  expect(global.console.__isRemote).toBe(true);
});

it(`restores the original console`, () => {
  enableXDELogging();
  expect(global.console.__isRemote).toBe(true);

  disableXDELogging();
  expect(global.console).toBe(_originalConsole);
  expect(global.console.__isRemote).not.toBeDefined();
});

it(`doesn't fail if enabled multiple times`, () => {
  expect(global.console.__isRemote).not.toBeDefined();

  enableXDELogging();
  let firstEnhancedConsole = global.console;
  expect(global.console.__isRemote).toBe(true);

  expect(enableXDELogging).not.toThrow();
  expect(global.console.__isRemote).toBe(true);
  expect(global.console).toBe(firstEnhancedConsole);
});

it(`doesn't fail if disabled when not enabled`, () => {
  expect(disableXDELogging).not.toThrow();
  expect(global.console).toBe(_originalConsole);
  expect(global.console.__isRemote).not.toBeDefined();

  // Test multiple calls
  expect(disableXDELogging).not.toThrow();
  expect(global.console).toBe(_originalConsole);
});
