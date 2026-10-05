import { renderHook } from '@testing-library/react-native';

const mockWorklets: { current: Record<string, unknown> | undefined } = { current: undefined };

jest.mock('../State/optionalWorklets', () => ({
  get worklets() {
    return mockWorklets.current;
  },
}));

jest.mock('expo', () => {
  class MockWorkletCallback {
    __expo_shared_object_id__ = 42;
    setWorklet() {}
  }
  return {
    requireNativeModule: jest.fn(() => ({ WorkletCallback: MockWorkletCallback })),
    useReleasingSharedObjectWithLifecycle: jest.fn((lifecycle) => lifecycle.factory()),
  };
});

const { useWorkletCallback } = require('../State');

describe('useWorkletCallback', () => {
  afterEach(() => {
    mockWorklets.current = undefined;
  });

  test('wraps a worklet in a native callback', async () => {
    mockWorklets.current = {
      isWorkletFunction: () => true,
      createSerializable: (fn: unknown) => ({ fn }),
    };
    const callback = jest.fn();
    const { result } = await renderHook(() => useWorkletCallback(callback));
    expect(result.current.__expo_shared_object_id__).toBe(42);
  });

  test('rejects a callback without the worklet directive', async () => {
    mockWorklets.current = {
      isWorkletFunction: () => false,
      createSerializable: (fn: unknown) => ({ fn }),
    };
    await expect(renderHook(() => useWorkletCallback(jest.fn()))).rejects.toThrow(
      /must be a worklet function/
    );
  });

  test('explains that react-native-worklets is missing', async () => {
    await expect(renderHook(() => useWorkletCallback(jest.fn()))).rejects.toThrow(
      /react-native-worklets/
    );
  });
});
