import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppMetricsRoot } from '../AppMetricsRoot';
import AppMetrics from '../module';

jest.mock('../module', () => ({
  __esModule: true,
  default: { markFirstRender: jest.fn(), reportError: jest.fn() },
}));

const markFirstRender = AppMetrics.markFirstRender as jest.Mock;
const reportError = AppMetrics.reportError as jest.Mock;

function Boom(): never {
  throw new Error('render exploded');
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe(AppMetricsRoot, () => {
  it('marks the first render and renders its children', () => {
    render(
      <AppMetricsRoot>
        <Text testID="child">app</Text>
      </AppMetricsRoot>
    );

    expect(markFirstRender).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('child')).toBeVisible();
  });

  it('mounts an error boundary that renders the fallback when given errorBoundaryFallback', () => {
    render(
      <AppMetricsRoot errorBoundaryFallback={<Text testID="fallback">crashed</Text>}>
        <Boom />
      </AppMetricsRoot>
    );

    expect(screen.getByTestId('fallback')).toBeVisible();
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('mounts no boundary without a fallback, so a render error propagates unchanged', () => {
    // No boundary is mounted, so the error escapes the tree exactly as if AppMetricsRoot weren't
    // there (preserving React Native's default crash behavior for existing prop-less usage).
    expect(() =>
      render(
        <AppMetricsRoot>
          <Boom />
        </AppMetricsRoot>
      )
    ).toThrow('render exploded');
  });
});
