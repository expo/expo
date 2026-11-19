import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { RangeSlider } from '../jetpack-compose/RangeSlider';

const mockNativeView = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: jest.fn((moduleName, viewName) => {
    if (moduleName !== 'ExpoUI') {
      throw new Error(`Unexpected native module requested: ${moduleName}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    return (props: any) => {
      mockNativeView(viewName, props);
      return createElement(View, props);
    };
  }),
}));

beforeEach(() => {
  mockNativeView.mockClear();
});

function getNativeProps() {
  return mockNativeView.mock.calls.find(([name]) => name === 'RangeSliderView')![1];
}

it('forwards the range configuration and unwraps both selected endpoints', async () => {
  const onValueChange = jest.fn();
  const onValueChangeFinished = jest.fn();
  const eventListener = jest.fn();
  const modifiers = [{ $type: 'onSizeChanged', eventListener }];
  await render(
    <RangeSlider
      startValue={20}
      endValue={80}
      trackRange={{ start: 0, endInclusive: 100 }}
      steps={9}
      enabled={false}
      modifiers={modifiers}
      onValueChange={onValueChange}
      onValueChangeFinished={onValueChangeFinished}
    />
  );

  const props = getNativeProps();
  expect(props).toEqual(
    expect.objectContaining({
      startValue: 20,
      endValue: 80,
      trackRange: { start: 0, endInclusive: 100 },
      steps: 9,
      enabled: false,
      modifiers,
    })
  );
  props.onValueChange({ nativeEvent: { start: 30, endInclusive: 70 } });
  props.onValueChangeFinished();
  props.onGlobalEvent({ nativeEvent: { payload: ['onSizeChanged', { width: 200, height: 48 }] } });

  expect(onValueChange).toHaveBeenCalledWith({ start: 30, endInclusive: 70 });
  expect(onValueChangeFinished).toHaveBeenCalledTimes(1);
  expect(eventListener).toHaveBeenCalledWith({ width: 200, height: 48 });
});

it('does not register absent callbacks', async () => {
  await render(<RangeSlider />);
  expect(getNativeProps().onValueChange).toBeUndefined();
  expect(getNativeProps().onValueChangeFinished).toBeUndefined();
});

it('assigns distinct native slots to the start thumb, end thumb, and track', async () => {
  await render(
    <RangeSlider>
      <RangeSlider.StartThumb>
        <View testID="start-thumb" />
      </RangeSlider.StartThumb>
      <RangeSlider.EndThumb>
        <View testID="end-thumb" />
      </RangeSlider.EndThumb>
      <RangeSlider.Track>
        <View testID="track" />
      </RangeSlider.Track>
    </RangeSlider>
  );

  const slots = mockNativeView.mock.calls
    .filter(([name]) => name === 'SlotView')
    .map(([, props]) => [props.slotName, props.children.props.testID]);
  expect(slots).toEqual([
    ['startThumb', 'start-thumb'],
    ['endThumb', 'end-thumb'],
    ['track', 'track'],
  ]);
});
