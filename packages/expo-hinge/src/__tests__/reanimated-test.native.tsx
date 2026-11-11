import { act, renderHook } from '@testing-library/react-native';
import { installOnUIRuntime } from 'expo';

import type { HingeChangeEvent } from '../Hinge.types';

type Worklet = (event: HingeChangeEvent) => void;

const mockExpoHinge: { current: ReturnType<typeof createNativeModule> | null } = { current: null };

jest.mock('../ExpoHinge', () => ({
  __esModule: true,
  get default() {
    return mockExpoHinge.current;
  },
}));

jest.mock('expo', () => ({ installOnUIRuntime: jest.fn() }));

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

jest.mock('react-native-reanimated', () => {
  const { useState } = require('react');
  return {
    useSharedValue: (initialValue: unknown) => {
      const [sharedValue] = useState(() => {
        let value = typeof initialValue === 'function' ? initialValue() : initialValue;
        return {
          get: () => value,
          set: (newValue: unknown) => {
            value = newValue;
          },
        };
      });
      return sharedValue;
    },
  };
});

const { addHingeWorkletListener, useAnimatedHinge } = require('../reanimated');

function onHingeChange(_event: HingeChangeEvent) {
  'worklet';
}

function createNativeModule() {
  return {
    getHinge: jest.fn(() => ({ angle: 180, status: 'fullyOpen' })),
    addWorkletListener: jest.fn((_worklet: Worklet) => 1),
    removeWorkletListener: jest.fn((_id: number) => {}),
  };
}

function lastRegisteredWorklet(): Worklet {
  return mockExpoHinge.current!.addWorkletListener.mock.lastCall![0];
}

beforeEach(() => {
  mockExpoHinge.current = createNativeModule();
});

describe(addHingeWorkletListener, () => {
  test('returns an inert subscription without the native module', () => {
    mockExpoHinge.current = null;
    const subscription = addHingeWorkletListener(onHingeChange);
    subscription.remove();
    expect(installOnUIRuntime).not.toHaveBeenCalled();
  });

  test('rejects a function without the worklet directive', () => {
    expect(() => addHingeWorkletListener(() => {})).toThrow(/must be a worklet/);
    expect(mockExpoHinge.current!.addWorkletListener).not.toHaveBeenCalled();
  });

  test('installs Expo modules on the UI runtime once', () => {
    jest.isolateModules(() => {
      const expo = require('expo');
      const worklets = require('react-native-worklets');
      const reanimated = require('../reanimated');
      reanimated.addHingeWorkletListener(onHingeChange);
      reanimated.addHingeWorkletListener(onHingeChange);
      expect(expo.installOnUIRuntime).toHaveBeenCalledTimes(1);
      expect(expo.installOnUIRuntime).toHaveBeenCalledWith(worklets.getUIRuntimeHolder());
    });
    expect(mockExpoHinge.current!.addWorkletListener).toHaveBeenCalledTimes(2);
  });

  test('removes the native listener that it registered', () => {
    mockExpoHinge.current!.addWorkletListener.mockReturnValueOnce(7);
    const subscription = addHingeWorkletListener(onHingeChange);
    subscription.remove();
    expect(mockExpoHinge.current!.removeWorkletListener).toHaveBeenCalledWith(7);
  });
});

describe(useAnimatedHinge, () => {
  test('starts with the current hinge', async () => {
    const { result } = await renderHook(() => useAnimatedHinge());
    expect(result.current.get()).toEqual({ angle: 180, status: 'fullyOpen' });
  });

  test('starts with no hinge without the native module', async () => {
    mockExpoHinge.current = null;
    const { result, unmount } = await renderHook(() => useAnimatedHinge());
    expect(result.current.get()).toBeNull();
    await unmount();
  });

  test('writes each hinge change to the shared value', async () => {
    const { result } = await renderHook(() => useAnimatedHinge());
    const worklet = lastRegisteredWorklet();
    await act(async () => worklet({ hinge: { angle: 90, status: 'partiallyOpen' } }));
    expect(result.current.get()).toEqual({ angle: 90, status: 'partiallyOpen' });
    await act(async () => worklet({ hinge: null }));
    expect(result.current.get()).toBeNull();
  });

  test('keeps one subscription across re-renders and removes it on unmount', async () => {
    mockExpoHinge.current!.addWorkletListener.mockReturnValueOnce(7);
    const { rerender, unmount } = await renderHook(() => useAnimatedHinge());
    await rerender({});
    expect(mockExpoHinge.current!.addWorkletListener).toHaveBeenCalledTimes(1);
    await unmount();
    expect(mockExpoHinge.current!.removeWorkletListener).toHaveBeenCalledWith(7);
  });
});
