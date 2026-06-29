import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { AppMetricsErrorBoundary } from '../AppMetricsErrorBoundary';
import AppMetrics from '../module';

jest.mock('../module', () => ({
  __esModule: true,
  default: { reportError: jest.fn() },
}));

const reportError = AppMetrics.reportError as jest.Mock;

function Boom(): never {
  throw new Error('render exploded');
}

function NestedBoom() {
  return (
    <View>
      <View>
        <Boom />
      </View>
    </View>
  );
}

function ThrowNull(): never {
  // A falsy throw value (not an Error). React still routes it through the boundary; the boundary
  // must treat "caught" as distinct from the value so a `null` throw doesn't look like a healthy
  // state and re-render the children into an infinite loop.
  // eslint-disable-next-line no-throw-literal
  throw null;
}

beforeEach(() => {
  jest.clearAllMocks();
  // React logs caught render errors to console.error; silence it so the test output stays clean.
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe(AppMetricsErrorBoundary, () => {
  it('renders children unchanged when nothing throws', () => {
    render(
      <AppMetricsErrorBoundary fallback={null}>
        <Text testID="child">healthy</Text>
      </AppMetricsErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeVisible();
    expect(reportError).not.toHaveBeenCalled();
  });

  it('renders the fallback element in place of the failed subtree', () => {
    render(
      <AppMetricsErrorBoundary fallback={<Text testID="fallback">something broke</Text>}>
        <Boom />
      </AppMetricsErrorBoundary>
    );

    expect(screen.getByTestId('fallback')).toBeVisible();
  });

  it('renders nothing when the fallback is explicitly null', () => {
    render(
      <AppMetricsErrorBoundary fallback={null}>
        <Boom />
        <Text testID="child">healthy</Text>
      </AppMetricsErrorBoundary>
    );

    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('catches a falsy (non-Error) throw without looping, and renders the fallback', () => {
    render(
      <AppMetricsErrorBoundary fallback={<Text testID="fallback">caught</Text>}>
        <ThrowNull />
      </AppMetricsErrorBoundary>
    );

    // If the boundary mistook the caught `null` for a healthy state, it would re-render the children
    // and loop; reaching the fallback proves it stopped.
    expect(screen.getByTestId('fallback')).toBeVisible();
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('reports a caught error as a non-fatal errorBoundary exception', () => {
    render(
      <AppMetricsErrorBoundary fallback={null}>
        <Boom />
      </AppMetricsErrorBoundary>
    );

    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'errorBoundary',
        type: 'Error',
        message: 'render exploded',
        isFatal: false,
      })
    );
  });

  it('reports the React component stack of the subtree that threw', () => {
    render(
      <AppMetricsErrorBoundary fallback={null}>
        <NestedBoom />
      </AppMetricsErrorBoundary>
    );

    const { componentStack } = reportError.mock.calls[0][0];
    expect(componentStack).toEqual(expect.stringContaining('Boom'));
    // React's raw component stack is indented and newline-led; the boundary trims it.
    expect(componentStack).toBe(componentStack.trim());
  });

  it('does not let a failure inside reportError escape the boundary', () => {
    reportError.mockImplementation(() => {
      throw new Error('native module blew up');
    });

    expect(() =>
      render(
        <AppMetricsErrorBoundary fallback={<Text testID="fallback">fallback</Text>}>
          <Boom />
        </AppMetricsErrorBoundary>
      )
    ).not.toThrow();
    expect(screen.getByTestId('fallback')).toBeVisible();
  });

  it('reports a caught error only once despite React dev-mode double rendering', () => {
    render(
      <AppMetricsErrorBoundary fallback={<Text>fallback</Text>}>
        <Boom />
      </AppMetricsErrorBoundary>
    );

    expect(reportError).toHaveBeenCalledTimes(1);
  });
});
