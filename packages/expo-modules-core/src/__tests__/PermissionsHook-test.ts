import { renderHook, act, waitFor } from '@testing-library/react-native';

import { createPermissionHook } from '../PermissionsHook';
import type { PermissionResponse } from '../PermissionsInterface';
import { PermissionStatus } from '../PermissionsInterface';

// The indexes of the array returned by the hooks
const RESULT_STATUS = 0;
const RESULT_REQUESTER = 1;
const RESULT_GETTER = 2;

const permissionGranted: PermissionResponse = {
  status: PermissionStatus.GRANTED,
  expires: 'never',
  granted: true,
  canAskAgain: true,
};

const permissionDenied: PermissionResponse = {
  status: PermissionStatus.DENIED,
  expires: 'never',
  granted: false,
  canAskAgain: false,
};

describe('factory', () => {
  it('creates hook with both requester and getter', () => {
    const hook = createPermissionHook({
      requestMethod: async () => permissionGranted,
      getMethod: async () => permissionGranted,
    });
    expect(hook).toBeInstanceOf(Function);
  });
});

describe('product', () => {
  it('returns status, requester and getter when mounted', async () => {
    // Keep the initial permission lookup pending so the null status is observable.
    let resolveStatus!: (response: PermissionResponse) => void;
    const { result } = await renderHook(
      createPermissionHook({
        requestMethod: async () => permissionGranted,
        getMethod: () =>
          new Promise<PermissionResponse>((resolve) => {
            resolveStatus = resolve;
          }),
      })
    );

    expect(result.current[RESULT_STATUS]).toBeNull();
    expect(result.current[RESULT_REQUESTER]).toBeInstanceOf(Function);
    expect(result.current[RESULT_GETTER]).toBeInstanceOf(Function);

    await act(async () => {
      resolveStatus(permissionGranted);
    });
    expect(result.current[RESULT_STATUS]).toEqual(permissionGranted);
  });

  it('returns same callbacks when rerendered', async () => {
    const { result, rerender } = await renderHook(
      createPermissionHook({
        requestMethod: async () => permissionGranted,
        getMethod: async () => permissionGranted,
      }),
      { initialProps: { get: false } }
    );
    const requester = result.current[RESULT_REQUESTER];
    const getter = result.current[RESULT_GETTER];

    await rerender({ get: false });
    expect(result.current[RESULT_REQUESTER]).toBe(requester);
    expect(result.current[RESULT_GETTER]).toBe(getter);
  });

  it('skips state update when unmounted', async () => {
    let resolve: (value?: any) => void;

    const logError = jest.spyOn(console, 'error').mockImplementation();
    const promise = new Promise<PermissionResponse>((resolvePromise) => {
      resolve = resolvePromise;
      return permissionGranted;
    });

    const { unmount } = await renderHook(
      createPermissionHook({
        requestMethod: async () => permissionDenied,
        getMethod: () => promise,
      })
    );

    await act(() => unmount());
    resolve!();
    await promise;
    expect(logError).not.toHaveBeenCalled();
    logError.mockRestore();
  });

  it('only requests or gets permission status once', async () => {
    const requestMethod = jest.fn(async () => permissionGranted);
    const getMethod = jest.fn(async () => permissionGranted);

    await renderHook(createPermissionHook({ requestMethod, getMethod }), {
      initialProps: { get: true, request: true },
    });

    await waitFor(() => {
      expect(requestMethod).toHaveBeenCalledTimes(1);
      expect(getMethod).toHaveBeenCalledTimes(0);
    });
  });

  describe('getter', () => {
    it('returns status with getter by default', async () => {
      const { result } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        })
      );

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('returns status with getter method', async () => {
      const { result } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        }),
        { initialProps: { get: false } }
      );

      await act(() => {
        result.current[RESULT_GETTER]();
      });

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('returns status with getter option', async () => {
      const { result } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        }),
        { initialProps: { get: true } }
      );

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('returns status with getter option after rerender', async () => {
      const { result, rerender } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        }),
        { initialProps: { get: false } }
      );

      await rerender({ get: true });

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('omits options when not provided', async () => {
      const getMethod = jest.fn(async () => permissionGranted);

      await renderHook(
        createPermissionHook({
          getMethod,
          requestMethod: async () => permissionDenied,
        }),
        { initialProps: { get: true } }
      );

      await waitFor(() => {
        expect(getMethod).toHaveBeenCalledWith();
      });
    });

    it('passes options when provided', async () => {
      const getMethod = jest.fn(async () => permissionGranted);

      await renderHook(
        createPermissionHook<PermissionResponse, { setting: string }>({
          getMethod,
          requestMethod: async () => permissionDenied,
        }),
        { initialProps: { get: true, setting: 'something' } }
      );

      await waitFor(() => {
        expect(getMethod).toHaveBeenCalledWith(expect.objectContaining({ setting: 'something' }));
      });
    });
  });

  describe('requester', () => {
    it('returns status with requester method', async () => {
      const { result } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionGranted,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: false } }
      );

      await act(() => {
        result.current[RESULT_REQUESTER]();
      });

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('returns status with requester option', async () => {
      const { result } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionGranted,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: true } }
      );

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('returns status with requester option after rerender', async () => {
      const { result, rerender } = await renderHook(
        createPermissionHook({
          requestMethod: async () => permissionGranted,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: false } }
      );

      await rerender({ request: true });

      await waitFor(() => {
        expect(result.current[RESULT_STATUS]).toBe(permissionGranted);
      });
    });

    it('omits options when not provided', async () => {
      const requestMethod = jest.fn(async () => permissionGranted);

      await renderHook(
        createPermissionHook({
          requestMethod,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: true } }
      );

      await waitFor(() => {
        expect(requestMethod).toHaveBeenCalledWith();
      });
    });

    it('passes options when provided', async () => {
      const requestMethod = jest.fn(async () => permissionGranted);

      await renderHook(
        createPermissionHook<PermissionResponse, { setting: string }>({
          requestMethod,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: true, setting: 'something' } }
      );

      await waitFor(() => {
        expect(requestMethod).toHaveBeenCalledWith(
          expect.objectContaining({ setting: 'something' })
        );
      });
    });
  });
});
