import { screen } from '@testing-library/react-native';
import React, { use } from 'react';
import { Text, View } from 'react-native';

import { SuspenseFallbackProps } from '../exports';
import { renderRouter } from '../testing-library';

it('renders custom `<SuspenseFallback>` when one is available', () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const CustomFallback = ({ route }: SuspenseFallbackProps) => (
    <View testID="custom-fallback">
      <Text>Loading {route}...</Text>
    </View>
  );

  renderRouter({
    index: {
      default: SuspendingRoute,
      SuspenseFallback: CustomFallback,
    },
  });

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('custom-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading index...')).toBeOnTheScreen();
});

it('renders default `<SuspenseFallback>` when one is not available', () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  renderRouter({
    index: SuspendingRoute,
  });

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.queryByTestId('custom-fallback')).toBeNull();
});
