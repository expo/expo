import { act } from '@testing-library/react-native';
import { useState } from 'react';

import { useRootNavigation } from '../useRootNavigation';
import { renderHook } from './renderHook';

let error: jest.SpyInstance;

beforeEach(() => {
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  error.mockRestore();
});

it('returns the navigation container for its own router root', async () => {
  let rerenderFirstRoot: () => void = () => {};
  const first = await renderHook(() => {
    const [, setRenderCount] = useState(0);
    rerenderFirstRoot = () => setRenderCount((count) => count + 1);
    return useRootNavigation();
  });
  const second = await renderHook(() => useRootNavigation());

  await act(rerenderFirstRoot);

  expect(first.result.current).not.toBeNull();
  expect(first.result.current).not.toBe(second.result.current);
});
