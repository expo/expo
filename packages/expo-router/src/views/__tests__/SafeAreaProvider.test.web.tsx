/** @jest-environment jsdom */
import { act, render, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  type Metrics,
} from 'react-native-safe-area-context';

import { SafeAreaProvider } from '../SafeAreaProvider.web';

// Captures the `onChange` the provider hands to `SafeAreaListener`, so a test
// can emit a measurement without driving the real DOM probe.
let mockEmit: ((metrics: Metrics) => void) | null = null;

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaListener: ({
      children,
      onChange,
    }: {
      children: React.ReactNode;
      onChange: (metrics: Metrics) => void;
    }) => {
      mockEmit = onChange;
      return children;
    },
  };
});

const MEASURED: Metrics = {
  insets: { top: 44, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

function Probe() {
  const insets = useContext(SafeAreaInsetsContext);
  const frame = useContext(SafeAreaFrameContext);
  return <div data-testid="probe">{JSON.stringify({ insets, frame })}</div>;
}

function readProbe(container: HTMLElement) {
  return JSON.parse(container.querySelector('[data-testid="probe"]')!.textContent!);
}

function setReadyState(value: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', { value, configurable: true });
}

beforeEach(() => {
  mockEmit = null;
  setReadyState('complete');
});

it('holds the SSR metrics while the document is still streaming', async () => {
  setReadyState('loading');

  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  // The provider measures as soon as it mounts, which is while boundaries the
  // server has not flushed yet are still dehydrated.
  act(() => mockEmit!(MEASURED));

  expect(readProbe(container)).toEqual({
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    frame: { x: 0, y: 0, width: 0, height: 0 },
  });
});

it('applies the buffered measurement once the stream ends', async () => {
  setReadyState('loading');

  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  act(() => mockEmit!(MEASURED));
  expect(readProbe(container)).toEqual({
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    frame: { x: 0, y: 0, width: 0, height: 0 },
  });

  setReadyState('interactive');
  act(() => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  await waitFor(() => expect(readProbe(container)).toEqual(MEASURED));
});

it('applies measurements directly once settled', async () => {
  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  // The document was already parsed, so the provider settles without waiting
  // for `DOMContentLoaded`.
  await waitFor(() => expect(mockEmit).not.toBeNull());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  act(() => mockEmit!(MEASURED));
  await waitFor(() => expect(readProbe(container)).toEqual(MEASURED));

  const resized: Metrics = { ...MEASURED, frame: { x: 0, y: 0, width: 390, height: 500 } };
  act(() => mockEmit!(resized));
  await waitFor(() => expect(readProbe(container)).toEqual(resized));
});

it('seeds from initialMetrics when one is given', () => {
  const seed: Metrics = {
    insets: { top: 1, bottom: 2, left: 3, right: 4 },
    frame: { x: 0, y: 0, width: 10, height: 20 },
  };

  const { container } = render(
    <SafeAreaProvider initialMetrics={seed}>
      <Probe />
    </SafeAreaProvider>
  );

  expect(readProbe(container)).toEqual(seed);
});
