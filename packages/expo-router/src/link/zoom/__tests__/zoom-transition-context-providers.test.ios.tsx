import { act, render } from '@testing-library/react-native';
import { use, useEffect } from 'react';
import { Text } from 'react-native';

import { useIsPreview } from '../../preview/PreviewRouteContext';
import { isZoomTransitionEnabled } from '../ZoomTransitionEnabler.ios';
import {
  ZoomTransitionSourceContext,
  type ZoomTransitionSourceContextValueType,
} from '../zoom-transition-context';
import { ZoomTransitionSourceContextProvider } from '../zoom-transition-context-providers';

jest.mock('../ZoomTransitionEnabler.ios');
jest.mock('../../preview/PreviewRouteContext');

describe(ZoomTransitionSourceContextProvider, () => {
  const mockIsZoomTransitionEnabled = isZoomTransitionEnabled as jest.Mock;
  const mockUseIsPreview = useIsPreview as jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsPreview.mockReturnValue(false);
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

  test('provides context with identifier when conditions are met', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    expect(capturedValue).toBeDefined();
    expect(capturedValue.identifier).toBeTruthy();
    expect(typeof capturedValue.identifier).toBe('string');
    expect(capturedValue.hasZoomSource).toBe(false);
  });

  test('provides addSource and removeSource functions', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    expect(capturedValue.addSource).toBeDefined();
    expect(typeof capturedValue.addSource).toBe('function');
    expect(capturedValue.removeSource).toBeDefined();
    expect(typeof capturedValue.removeSource).toBe('function');
  });

  test('addSource updates hasZoomSource to true', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    expect(capturedValue.hasZoomSource).toBe(false);

    act(() => {
      capturedValue.addSource();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);

    const updatedValue = onContextValueChange.mock.calls[1][0];
    expect(updatedValue.hasZoomSource).toBe(true);
  });

  test('removeSource updates hasZoomSource back to false', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    act(() => {
      capturedValue.addSource();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);
    const afterAddValue = onContextValueChange.mock.calls[1][0];
    expect(afterAddValue.hasZoomSource).toBe(true);

    act(() => {
      afterAddValue.removeSource();
    });
    const afterRemoveValue = onContextValueChange.mock.calls[2][0];
    expect(afterRemoveValue.hasZoomSource).toBe(false);
  });

  test('retains identifier between rerenders', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    const { rerender } = render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const initialValue = onContextValueChange.mock.calls[0][0];
    const initialId = initialValue.identifier;
    const addSource = initialValue.addSource;
    expect(initialId).toBeDefined();

    act(() => {
      addSource();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);
    const updatedValue = onContextValueChange.mock.calls[1][0];
    expect(updatedValue.identifier).toBe(initialId);
  });

  test('throws error when more than one source is added', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];

    expect(() => {
      act(() => {
        capturedValue.addSource();
        capturedValue.addSource();
      });
    }).toThrow(
      '[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.'
    );
  });

  test('throws error when asChild is false', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: false }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    expect(() => {
      act(() => {
        capturedValue.addSource();
      });
    }).toThrow('[expo-router] Link must be used with `asChild` prop to enable zoom transitions.');
  });

  test('throws error when zoom transitions are disabled', () => {
    mockIsZoomTransitionEnabled.mockReturnValue(false);

    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider linkProps={{ href: '/test', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    expect(() => {
      act(() => {
        capturedValue.addSource();
      });
    }).toThrow('[expo-router] Zoom transitions are not enabled.');
  });

  test('throws error when href is external', () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionSourceContextValueType]>();
    render(
      <ZoomTransitionSourceContextProvider
        linkProps={{ href: 'https://external.com', asChild: true }}>
        <TestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionSourceContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0][0];
    expect(() => {
      act(() => {
        capturedValue.addSource();
      });
    }).toThrow('[expo-router] Zoom transitions can only be used with internal links.');
  });
});
