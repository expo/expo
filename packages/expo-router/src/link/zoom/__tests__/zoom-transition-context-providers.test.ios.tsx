import { act, render } from '@testing-library/react-native';
import { use, useEffect } from 'react';
import { Text } from 'react-native';

import {
  ZoomTransitionSourceContext,
  type ZoomTransitionSourceContextValueType,
} from '../zoom-transition-context';
import { ZoomTransitionSourceContextProvider } from '../zoom-transition-context-providers';
import { isZoomTransitionEnabled } from '../zoom-transition-enabled';

jest.mock('../zoom-transition-enabled');

describe(ZoomTransitionSourceContextProvider, () => {
  const mockIsZoomTransitionEnabled = isZoomTransitionEnabled as jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsZoomTransitionEnabled.mockReturnValue(true);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  function TestComponent({
    onContextValueChange,
  }: {
    onContextValueChange?: (value: ZoomTransitionSourceContextValueType) => void;
  }) {
    const value = use(ZoomTransitionSourceContext);
    useEffect(() => {
      onContextValueChange?.(value);
    }, [value, onContextValueChange]);
    return <Text>Test</Text>;
  }

  test('provides context with identifier when conditions are met', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    expect(capturedValue).toBeDefined();
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    expect(capturedValue.identifier).toBeTruthy();
    expect(typeof capturedValue.identifier).toBe('string');
    expect(capturedValue.hasZoomSource).toBe(false);
  });

  test('provides addSource and removeSource functions', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    expect(capturedValue.addSource).toBeDefined();
    expect(typeof capturedValue.addSource).toBe('function');
    expect(capturedValue.removeSource).toBeDefined();
    expect(typeof capturedValue.removeSource).toBe('function');
  });

  test('addSource updates hasZoomSource to true', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    expect(capturedValue.hasZoomSource).toBe(false);

    await act(() => {
      capturedValue.addSource();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);

    const updatedValue = onContextValueChange.mock.calls[1]![0];
    // Narrows type for TypeScript
    if (!updatedValue) throw new Error('Expected updatedValue to be defined');
    expect(updatedValue.hasZoomSource).toBe(true);
  });

  test('removeSource updates hasZoomSource back to false', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    await act(() => {
      capturedValue.addSource();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);
    const afterAddValue = onContextValueChange.mock.calls[1]![0];
    // Narrows type for TypeScript
    if (!afterAddValue) throw new Error('Expected afterAddValue to be defined');
    expect(afterAddValue.hasZoomSource).toBe(true);

    await act(() => {
      afterAddValue.removeSource();
    });
    const afterRemoveValue = onContextValueChange.mock.calls[2]![0];
    // Narrows type for TypeScript
    if (!afterRemoveValue) throw new Error('Expected afterRemoveValue to be defined');
    expect(afterRemoveValue.hasZoomSource).toBe(false);
  });

  test('retains identifier between rerenders', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const initialValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!initialValue) throw new Error('Expected initialValue to be defined');
    const initialId = initialValue.identifier;
    const addSource = initialValue.addSource;
    expect(initialId).toBeDefined();

    await act(() => {
      addSource();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);
    const updatedValue = onContextValueChange.mock.calls[1]![0];
    // Narrows type for TypeScript
    if (!updatedValue) throw new Error('Expected updatedValue to be defined');
    expect(updatedValue.identifier).toBe(initialId);
  });

  test('throws error when more than one source is added', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');

    await expect(async () => {
      await act(() => {
        capturedValue.addSource();
        capturedValue.addSource();
      });
    }).rejects.toThrow(
      '[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.'
    );
  });

  test('throws error when asChild is false', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: false }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    await expect(async () => {
      await act(() => {
        capturedValue.addSource();
      });
    }).rejects.toThrow(
      '[expo-router] Link must be used with `asChild` prop to enable zoom transitions.'
    );
  });

  test('throws error when zoom transitions are disabled', async () => {
    mockIsZoomTransitionEnabled.mockReturnValue(false);

    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    await expect(async () => {
      await act(() => {
        capturedValue.addSource();
      });
    }).rejects.toThrow('[expo-router] Zoom transitions are not enabled.');
  });

  test('throws error when href is external', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    await render(
      <ZoomTransitionSourceContextProvider
        linkProps={{ href: 'https://external.com', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Narrows type for TypeScript
    if (!capturedValue) throw new Error('Expected capturedValue to be defined');
    await expect(async () => {
      await act(() => {
        capturedValue.addSource();
      });
    }).rejects.toThrow('[expo-router] Zoom transitions can only be used with internal links.');
  });
});
