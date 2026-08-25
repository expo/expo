import { render } from '@testing-library/react-native';

import { CircularWavyProgressIndicator, LinearWavyProgressIndicator } from '..';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: jest.fn((...args) => {
    if (args[0] !== 'ExpoUI') {
      throw new Error(`Unexpected native module requested: ${args[0]}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    const MockView = (props: any) => {
      mockNativeViewFn(args[1], props);
      return createElement(View, props);
    };
    return MockView;
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
});

describe('LinearWavyProgressIndicator', () => {
  it('passes the wave configuration to the native view', () => {
    render(
      <LinearWavyProgressIndicator progress={0.5} amplitude={0.4} wavelength={24} waveSpeed={18} />
    );

    const [viewName, props] = mockNativeViewFn.mock.calls[0];
    expect(viewName).toBe('LinearWavyProgressIndicatorView');
    expect(props.amplitude).toBe(0.4);
    expect(props.wavelength).toBe(24);
    expect(props.waveSpeed).toBe(18);
  });

  it('leaves the wave configuration undefined when not specified', () => {
    render(<LinearWavyProgressIndicator progress={0.5} />);

    const [, props] = mockNativeViewFn.mock.calls[0];
    expect(props.amplitude).toBeUndefined();
    expect(props.wavelength).toBeUndefined();
    expect(props.waveSpeed).toBeUndefined();
  });
});

describe('CircularWavyProgressIndicator', () => {
  it('passes the wave configuration to the native view', () => {
    render(<CircularWavyProgressIndicator amplitude={1} wavelength={20} waveSpeed={10} />);

    const [viewName, props] = mockNativeViewFn.mock.calls[0];
    expect(viewName).toBe('CircularWavyProgressIndicatorView');
    expect(props.amplitude).toBe(1);
    expect(props.wavelength).toBe(20);
    expect(props.waveSpeed).toBe(10);
  });
});
