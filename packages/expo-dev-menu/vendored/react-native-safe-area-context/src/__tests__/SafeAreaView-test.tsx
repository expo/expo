import * as React from 'react';
import { View } from 'react-native';
import * as ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from '../SafeAreaContext';
import { SafeAreaView } from '../SafeAreaView';
import { Metrics } from '../SafeArea.types';

const INITIAL_METRICS: Metrics = {
  insets: { top: 1, left: 2, right: 3, bottom: 4 },
  frame: { x: 0, y: 0, height: 100, width: 100 },
};

describe('SafeAreaView', () => {
  it('renders', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView>
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
  });

  it('can override padding styles', () => {
    const component = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <SafeAreaView style={{ paddingTop: 0 }}>
          <View />
        </SafeAreaView>
      </SafeAreaProvider>,
    );
    expect(component).toMatchSnapshot();
  });
});
