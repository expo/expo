import { act, render } from '@testing-library/react-native';
import { use, useEffect } from 'react';
import { Text } from 'react-native';

import {
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
} from '../../../navigationParams';
import { useIsPreview } from '../../preview/PreviewRouteContext';
import { isZoomTransitionEnabled } from '../ZoomTransitionEnabler.ios';
import {
  ZoomTransitionSourceContext,
  ZoomTransitionTargetContext,
  type ZoomTransitionSourceContextValueType,
  type ZoomTransitionTargetContextValueType,
} from '../zoom-transition-context';
import {
  ZoomTransitionSourceContextProvider,
  ZoomTransitionTargetContextProvider,
} from '../zoom-transition-context-providers';

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

describe(ZoomTransitionTargetContextProvider, () => {
  const mockIsZoomTransitionEnabled = isZoomTransitionEnabled as jest.Mock;
  const mockUseIsPreview = useIsPreview as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsPreview.mockReturnValue(false);
    mockIsZoomTransitionEnabled.mockReturnValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  function makeRouteForTarget(key: string, sourceId: string = 'source-123') {
    return {
      key,
      name: 'test',
      params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: sourceId,
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: key,
      },
    };
  }

  function TargetTestComponent({
    onContextValueChange,
  }: {
    onContextValueChange?: (value: ZoomTransitionTargetContextValueType) => void;
  }) {
    const value = use(ZoomTransitionTargetContext);
    useEffect(() => {
      onContextValueChange?.(value);
    }, [value, onContextValueChange]);
    return <Text>Target Test</Text>;
  }

  test('provides context with addEnabler, removeEnabler, and hasEnabler', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    expect(typeof capturedValue.addEnabler).toBe('function');
    expect(typeof capturedValue.removeEnabler).toBe('function');
    expect(capturedValue.hasEnabler).toBe(false);
  });

  test('addEnabler sets hasEnabler to true', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    const capturedValue = onContextValueChange.mock.calls[0]![0];
    expect(capturedValue.hasEnabler).toBe(false);

    await act(() => {
      capturedValue.addEnabler();
    });

    expect(onContextValueChange).toHaveBeenCalledTimes(2);
    const updatedValue = onContextValueChange.mock.calls[1]![0];
    expect(updatedValue.hasEnabler).toBe(true);
  });

  test('removeEnabler sets hasEnabler back to false', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    const capturedValue = onContextValueChange.mock.calls[0]![0];

    await act(() => {
      capturedValue.addEnabler();
    });

    const afterAddValue = onContextValueChange.mock.calls[1]![0];
    expect(afterAddValue.hasEnabler).toBe(true);

    await act(() => {
      afterAddValue.removeEnabler();
    });

    const afterRemoveValue = onContextValueChange.mock.calls[2]![0];
    expect(afterRemoveValue.hasEnabler).toBe(false);
  });

  test('tracks multiple enablers correctly', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    const capturedValue = onContextValueChange.mock.calls[0]![0];

    // Add two enablers
    await act(() => {
      capturedValue.addEnabler();
    });
    const afterFirstAdd = onContextValueChange.mock.calls[1]![0];
    expect(afterFirstAdd.hasEnabler).toBe(true);

    await act(() => {
      afterFirstAdd.addEnabler();
    });
    const afterSecondAdd = onContextValueChange.mock.calls[2]![0];
    expect(afterSecondAdd.hasEnabler).toBe(true);

    // Remove one - still has enabler
    await act(() => {
      afterSecondAdd.removeEnabler();
    });
    const afterFirstRemove = onContextValueChange.mock.calls[3]![0];
    expect(afterFirstRemove.hasEnabler).toBe(true);

    // Remove second - no more enablers
    await act(() => {
      afterFirstRemove.removeEnabler();
    });
    const afterSecondRemove = onContextValueChange.mock.calls[4]![0];
    expect(afterSecondRemove.hasEnabler).toBe(false);
  });

  test('identifier is null when route has no zoom params', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    const routeWithoutParams = { key: 'route-1', name: 'test', params: {} };

    await render(
      <ZoomTransitionTargetContextProvider route={routeWithoutParams}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    // Should get the default context value (no identifier)
    expect(capturedValue.identifier).toBeNull();
  });

  test('provides identifier from route zoom transition params', async () => {
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1', 'source-abc')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    expect(capturedValue.identifier).toBe('source-abc');
  });

  test('identifier is null when isPreview is true', async () => {
    mockUseIsPreview.mockReturnValue(true);
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    expect(capturedValue.identifier).toBeNull();
  });

  test('identifier is null when zoom transitions are disabled', async () => {
    mockIsZoomTransitionEnabled.mockReturnValue(false);
    const onContextValueChange = jest.fn<void, [ZoomTransitionTargetContextValueType]>();
    await render(
      <ZoomTransitionTargetContextProvider route={makeRouteForTarget('route-1')}>
        <TargetTestComponent onContextValueChange={onContextValueChange} />
      </ZoomTransitionTargetContextProvider>
    );

    expect(onContextValueChange).toHaveBeenCalledTimes(1);
    const capturedValue = onContextValueChange.mock.calls[0]![0];
    expect(capturedValue.identifier).toBeNull();
  });
});
