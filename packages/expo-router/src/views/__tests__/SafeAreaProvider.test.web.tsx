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
  // The library measures its own wrapper view, which the provider ignores.
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

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

function setDocumentSize(width: number, height: number) {
  Object.defineProperty(document.documentElement, 'offsetWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'offsetHeight', {
    value: height,
    configurable: true,
  });
}

beforeEach(() => {
  mockEmit = null;
  setReadyState('complete');
  setDocumentSize(1024, 768);
});

it('measures the frame during the first render so it never changes afterwards', () => {
  setReadyState('loading');

  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  // Already correct before hydration finishes, rather than applied by an effect.
  expect(readProbe(container).frame).toEqual({ x: 0, y: 0, width: 1024, height: 768 });
});

it('holds the SSR insets while the document is still streaming', () => {
  setReadyState('loading');

  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  // The library measures as soon as it mounts, which is while boundaries the
  // server has not flushed yet are still dehydrated.
  act(() => mockEmit!(MEASURED));

  expect(readProbe(container).insets).toEqual(ZERO_INSETS);
});

it('applies the buffered insets once the stream ends', async () => {
  setReadyState('loading');

  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  act(() => mockEmit!(MEASURED));
  expect(readProbe(container).insets).toEqual(ZERO_INSETS);

  setReadyState('interactive');
  act(() => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  await waitFor(() => expect(readProbe(container).insets).toEqual(MEASURED.insets));
  // The frame stays the one measured during the first render.
  expect(readProbe(container).frame).toEqual({ x: 0, y: 0, width: 1024, height: 768 });
});

it('ignores the frame the library reports for its own wrapper view', async () => {
  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  await waitFor(() => expect(mockEmit).not.toBeNull());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  act(() => mockEmit!(MEASURED));
  await waitFor(() => expect(readProbe(container).insets).toEqual(MEASURED.insets));
  expect(readProbe(container).frame).toEqual({ x: 0, y: 0, width: 1024, height: 768 });
});

it('updates the frame when the window resizes', async () => {
  const { container } = render(
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );

  setDocumentSize(390, 844);
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });

  await waitFor(() =>
    expect(readProbe(container).frame).toEqual({ x: 0, y: 0, width: 390, height: 844 })
  );
});

it('seeds the insets from initialMetrics when one is given', () => {
  const seed: Metrics = {
    insets: { top: 1, bottom: 2, left: 3, right: 4 },
    frame: { x: 0, y: 0, width: 10, height: 20 },
  };

  const { container } = render(
    <SafeAreaProvider initialMetrics={seed}>
      <Probe />
    </SafeAreaProvider>
  );

  expect(readProbe(container).insets).toEqual(seed.insets);
});
