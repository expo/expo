/** @jest-environment jsdom */
import { act, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { View } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeAreaProvider } from '../SafeAreaProvider';

function Metrics() {
  return <span>{JSON.stringify({ insets: useSafeAreaInsets(), frame: useSafeAreaFrame() })}</span>;
}

const zeroMetrics = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

it('renders children and zero metrics on the server without initial metrics', () => {
  const html = renderToString(
    <SafeAreaProvider>
      <Metrics />
    </SafeAreaProvider>
  );
  const container = document.createElement('div');
  container.innerHTML = html;
  expect(container.textContent).toBe(JSON.stringify(zeroMetrics));
});

it('keeps metrics fixed through hydration and resize, including nested providers', async () => {
  const content = (
    <SafeAreaProvider>
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 40, right: 10, bottom: 30, left: 10 },
          frame: { x: 10, y: 20, width: 400, height: 800 },
        }}
        initialSafeAreaInsets={{ top: 50, right: 20, bottom: 40, left: 20 }}>
        <Metrics />
      </SafeAreaProvider>
    </SafeAreaProvider>
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(content);
  const serverNode = container.querySelector('span');

  const result = render(content, { container, hydrate: true });
  await act(async () => {
    window.dispatchEvent(new Event('resize'));
  });

  expect(result.container.querySelector('span')).toBe(serverNode);
  expect(result.container.textContent).toBe(JSON.stringify(zeroMetrics));
  expect(container.querySelector('[initialmetrics], [initialsafeareainsets]')).toBeNull();
});

it('preserves the wrapper, styles, events and ref', () => {
  const ref = createRef<View>();
  const onPointerDown = jest.fn();
  const result = render(
    <SafeAreaProvider
      ref={ref}
      testID="safe-area"
      style={{ paddingTop: 16, flex: 2 }}
      onPointerDown={onPointerDown}>
      <span>Content</span>
    </SafeAreaProvider>
  );
  const wrapper = result.getByTestId('safe-area');
  expect(ref.current).toBe(wrapper);
  expect(wrapper.style.paddingTop).toBe('16px');
  expect(wrapper.style.flexGrow).toBe('2');
  fireEvent.pointerDown(wrapper);
  expect(onPointerDown).toHaveBeenCalledTimes(1);
});
