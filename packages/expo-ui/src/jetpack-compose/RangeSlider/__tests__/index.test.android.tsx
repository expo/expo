import { render } from '@testing-library/react-native';

import { RangeSlider } from '..';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: jest.fn((...args) => {
    if (args[0] !== 'ExpoUI' || !['RangeSliderView', 'SlotView'].includes(args[1])) {
      throw new Error(`Unexpected native view requested: ${args[0]} ${args[1]}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    const MockView = (props: any) => {
      if (args[1] === 'RangeSliderView') {
        mockNativeViewFn(props);
      }
      return createElement(View, props);
    };
    return MockView;
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
});

function lastNativeProps() {
  return mockNativeViewFn.mock.calls[mockNativeViewFn.mock.calls.length - 1][0];
}

describe('RangeSlider', () => {
  it('passes Material3 defaults to the native view', () => {
    render(<RangeSlider />);

    expect(lastNativeProps()).toEqual(
      expect.objectContaining({
        value: { start: 0, end: 1 },
        min: 0,
        max: 1,
        steps: 0,
        enabled: true,
      })
    );
  });

  it('forwards the given value and range', () => {
    render(<RangeSlider value={{ start: 20, end: 80 }} min={0} max={100} steps={9} />);

    expect(lastNativeProps()).toEqual(
      expect.objectContaining({
        value: { start: 20, end: 80 },
        min: 0,
        max: 100,
        steps: 9,
      })
    );
  });

  it('unwraps the native event into a range', () => {
    const onValueChange = jest.fn();
    render(<RangeSlider onValueChange={onValueChange} />);

    lastNativeProps().onValueChange({ nativeEvent: { start: 0.25, end: 0.75 } });

    expect(onValueChange).toHaveBeenCalledWith({ start: 0.25, end: 0.75 });
  });

  it('calls onValueChangeFinished without arguments', () => {
    const onValueChangeFinished = jest.fn();
    render(<RangeSlider onValueChangeFinished={onValueChangeFinished} />);

    lastNativeProps().onValueChangeFinished({ nativeEvent: {} });

    expect(onValueChangeFinished).toHaveBeenCalledWith();
  });

  it('omits event props that were not provided', () => {
    render(<RangeSlider />);

    expect(lastNativeProps().onValueChange).toBeUndefined();
    expect(lastNativeProps().onValueChangeFinished).toBeUndefined();
  });
});
