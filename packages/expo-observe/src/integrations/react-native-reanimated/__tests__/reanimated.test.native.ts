/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const runOnUISync = jest.fn();
const scheduleOnRN = jest.fn();

function loadReanimated() {
  const module = require('../reanimated') as typeof import('../reanimated');
  return module.loadReanimated();
}

beforeEach(() => {
  jest.resetModules();
});

describe('loadReanimated', () => {
  it('returns the Reanimated version and the Worklets scheduling functions', () => {
    jest.doMock('react-native-reanimated', () => ({ reanimatedVersion: '4.6.0' }), {
      virtual: true,
    });
    jest.doMock('react-native-worklets', () => ({ runOnUISync, scheduleOnRN }), {
      virtual: true,
    });

    expect(loadReanimated()).toEqual({
      version: '4.6.0',
      worklets: { runOnUISync, scheduleOnRN },
    });
  });

  it('returns null when react-native-reanimated is not installed', () => {
    jest.doMock(
      'react-native-reanimated',
      () => {
        throw new Error('simulated: react-native-reanimated is not installed');
      },
      { virtual: true }
    );
    jest.doMock('react-native-worklets', () => ({ runOnUISync, scheduleOnRN }), {
      virtual: true,
    });

    expect(loadReanimated()).toBeNull();
  });

  it('returns null when react-native-worklets is not installed', () => {
    jest.doMock('react-native-reanimated', () => ({ reanimatedVersion: '4.6.0' }), {
      virtual: true,
    });
    jest.doMock(
      'react-native-worklets',
      () => {
        throw new Error('simulated: react-native-worklets is not installed');
      },
      { virtual: true }
    );

    expect(loadReanimated()).toBeNull();
  });
});
