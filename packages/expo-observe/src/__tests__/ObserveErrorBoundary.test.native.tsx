import { render, screen } from '@testing-library/react-native';
import { AppMetricsErrorBoundary } from 'expo-app-metrics';
import { Text } from 'react-native';

import { ObserveErrorBoundary } from '../ObserveErrorBoundary';

// The boundary reports through the native `ExpoAppMetrics` module; stub `requireNativeModule` so the
// alias renders for real without touching native code. The stub is memoized inside the factory
// (which is hoisted above module-scope `const`s) so identity stays stable across calls.
jest.mock('expo', () => {
  const stub = { reportError: jest.fn() };
  return {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ...(jest.requireActual('expo') as typeof import('expo')),
    requireNativeModule: jest.fn(() => stub),
  };
});

function Boom(): never {
  throw new Error('kaboom');
}

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  // React logs caught render errors to console.error; silence it so the test output stays clean.
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('ObserveErrorBoundary', () => {
  it('aliases the AppMetricsErrorBoundary component', () => {
    expect(ObserveErrorBoundary).toBe(AppMetricsErrorBoundary);
  });

  it('catches a render error and renders the fallback through the Observe entry point', () => {
    render(
      <ObserveErrorBoundary fallback={<Text testID="fallback">Something broke</Text>}>
        <Boom />
      </ObserveErrorBoundary>
    );

    expect(screen.getByTestId('fallback')).toBeVisible();
  });
});
