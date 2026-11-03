/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const configureReanimatedLogger = jest.fn();

function loadReanimated() {
  const module = require('../reanimated') as typeof import('../reanimated');
  return module.loadReanimated();
}

beforeEach(() => {
  jest.resetModules();
});

describe('loadReanimated', () => {
  it('returns the Reanimated version and configureReanimatedLogger', () => {
    jest.doMock(
      'react-native-reanimated',
      () => ({ reanimatedVersion: '4.7.0', configureReanimatedLogger }),
      { virtual: true }
    );

    expect(loadReanimated()).toEqual({ version: '4.7.0', configureReanimatedLogger });
  });

  it('returns null when react-native-reanimated is not installed', () => {
    jest.doMock(
      'react-native-reanimated',
      () => {
        throw new Error('simulated: react-native-reanimated is not installed');
      },
      { virtual: true }
    );

    expect(loadReanimated()).toBeNull();
  });
});
