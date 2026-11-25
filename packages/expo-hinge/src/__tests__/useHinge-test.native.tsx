import { act, renderHook } from '@testing-library/react-native';

import ExpoHinge from '../ExpoHinge';
import type { HingeChangeEvent } from '../Hinge.types';
import { useHinge } from '../index';

jest.mock('../ExpoHinge', () => {
  const listeners = new Set<Function>();
  return {
    __esModule: true,
    default: {
      isAvailable: true,
      getHinge: jest.fn(() => ({ angle: 180, status: 'fullyOpen' })),
      addListener: jest.fn((_eventName: string, listener: Function) => {
        listeners.add(listener);
        return {
          remove: () => {
            listeners.delete(listener);
          },
        };
      }),
      emit: (event: unknown) => {
        listeners.forEach((listener) => listener(event));
      },
    },
  };
});

const emit = (ExpoHinge as unknown as { emit: (event: HingeChangeEvent) => void }).emit;
const addListenerMock = ExpoHinge!.addListener as jest.Mock;

test('renders the current hinge on the first render', async () => {
  const { result } = await renderHook(() => useHinge());
  expect(result.current).toEqual({ angle: 180, status: 'fullyOpen' });
});

test('re-renders on hinge changes and unsubscribes on unmount', async () => {
  const { result, unmount } = await renderHook(() => useHinge());
  await act(async () => emit({ hinge: { angle: 90, status: 'partiallyOpen' } }));
  expect(result.current).toEqual({ angle: 90, status: 'partiallyOpen' });
  await act(async () => emit({ hinge: null }));
  expect(result.current).toBeNull();

  const subscriptions = addListenerMock.mock.results.length;
  await unmount();
  await act(async () => emit({ hinge: { angle: 0, status: 'closed' } }));
  expect(result.current).toBeNull();
  expect(addListenerMock.mock.results).toHaveLength(subscriptions);
});
