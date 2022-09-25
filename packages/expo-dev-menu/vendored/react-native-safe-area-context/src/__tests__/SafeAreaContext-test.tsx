import * as React from 'react';
import { View } from 'react-native';
import * as ReactTestRenderer from 'react-test-renderer';
import NativeSafeAreaView from '../NativeSafeAreaProvider';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
  useSafeAreaFrame,
} from '../SafeAreaContext';
import { Metrics } from '../SafeArea.types';

const TEST_METRICS_1: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, height: 100, width: 100 },
};
const TEST_METRICS_2: Metrics = {
  insets: { top: 2, left: 3, right: 4, bottom: 5 },
  frame: { x: 0, y: 0, width: 10, height: 16 },
};

const PrintInsetsTestView = () => {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingBottom: insets.bottom,
        paddingRight: insets.right,
        top: frame.y,
        left: frame.y,
        width: frame.width,
        height: frame.height,
      }}
    />
  );
};

describe('SafeAreaContext', () => {
  it('renders', () => {
    const component = ReactTestRenderer.create(<SafeAreaProvider />);
    expect(component).toMatchSnapshot();
  });

  it('does not render child until inset values are received', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider>
        <PrintInsetsTestView />
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
  });

  it('renders child when inset values are received', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider>
        <PrintInsetsTestView />
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
    const { onInsetsChange } =
      component.root.findByType(NativeSafeAreaView).props;
    ReactTestRenderer.act(() => {
      onInsetsChange({
        nativeEvent: TEST_METRICS_1,
      });
    });
    expect(component).toMatchSnapshot();
  });

  it('supports setting initial insets', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
        <PrintInsetsTestView />
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
  });

  it('uses parent insets when available', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
        <SafeAreaProvider>
          <PrintInsetsTestView />
        </SafeAreaProvider>
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
  });

  it('uses inner insets', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS_1}>
        <SafeAreaProvider initialMetrics={TEST_METRICS_2}>
          <PrintInsetsTestView />
        </SafeAreaProvider>
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
  });

  it('throws when no provider is rendered', () => {
    // Silence the React error boundary warning; we expect an uncaught error.
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation((message) => {
        if (message.startsWith('The above error occured in the ')) {
          return;
        }
      });
    expect(() => {
      ReactTestRenderer.create(<PrintInsetsTestView />);
    }).toThrow(
      'No safe area insets value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.',
    );

    consoleErrorMock.mockRestore();
  });
});
