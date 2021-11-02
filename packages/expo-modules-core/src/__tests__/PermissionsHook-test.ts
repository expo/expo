import { renderHook, act } from '@testing-library/react-hooks';

import { createPermissionHook } from '../PermissionsHook';
import { PermissionResponse, PermissionStatus } from '../PermissionsInterface';

// The indexes of the array returned by the hooks
const STATUS = 0;
const REQUESTER = 1;
const GETTER = 2;

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
  it('returns status, requester and getter when mounted', () => {
    const { result } = renderHook(
      createPermissionHook({
        requestMethod: async () => permissionGranted,
        getMethod: async () => permissionGranted,
      })
    );

    expect(result.current[STATUS]).toBeNull();
    expect(result.current[REQUESTER]).toBeInstanceOf(Function);
    expect(result.current[GETTER]).toBeInstanceOf(Function);
  });

  it('returns same callbacks when rerendered', async () => {
    const { result, rerender } = renderHook(
      createPermissionHook({
        requestMethod: async () => permissionGranted,
        getMethod: async () => permissionGranted,
      }),
      { initialProps: { get: false } }
    );
    const requester = result.current[REQUESTER];
    const getter = result.current[GETTER];

    rerender();
    expect(result.current[REQUESTER]).toBe(requester);
    expect(result.current[GETTER]).toBe(getter);
  });

  it('skips state update when unmounted', async () => {
    let resolve;
    const logError = jest.spyOn(console, 'error').mockImplementation();
    const promise = new Promise<PermissionResponse>((resolvePromise) => {
      resolve = resolvePromise;
      return permissionGranted;
    });

    const { unmount } = renderHook(
      createPermissionHook({
        requestMethod: async () => permissionDenied,
        getMethod: () => promise,
      })
    );

    unmount();
    resolve();
    await promise;
    expect(logError).not.toHaveBeenCalled();
    logError.mockRestore();
  });

  it('only requests or gets permission status once', async () => {
    const requestMethod = jest.fn(async () => permissionGranted);
    const getMethod = jest.fn(async () => permissionGranted);
    const { waitForNextUpdate } = renderHook(createPermissionHook({ requestMethod, getMethod }), {
      initialProps: { get: true, request: true },
    });

    await waitForNextUpdate();
    expect(requestMethod).toHaveBeenCalledTimes(1);
    expect(getMethod).toHaveBeenCalledTimes(0);
  });

  describe('getter', () => {
    it('returns status with getter by default', async () => {
      const { result, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        })
      );

      await waitForNextUpdate();
      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('returns status with getter method', async () => {
      const { result, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        }),
        { initialProps: { get: false } }
      );

      act(() => {
        result.current[GETTER]();
      });
      await waitForNextUpdate();
      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('returns status with getter option', async () => {
      const { result, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        }),
        { initialProps: { get: true } }
      );

      await waitForNextUpdate();
      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('returns status with getter option after rerender', async () => {
      const { result, rerender, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionDenied,
          getMethod: async () => permissionGranted,
        }),
        { initialProps: { get: false } }
      );

      rerender({ get: true });
      await waitForNextUpdate();

      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('omits options when not provided', async () => {
      const getMethod = jest.fn(async () => permissionGranted);
      const { waitForNextUpdate } = renderHook(
        createPermissionHook({
          getMethod,
          requestMethod: async () => permissionDenied,
        }),
        { initialProps: { get: true } }
      );

      await waitForNextUpdate();
      expect(getMethod).toHaveBeenCalledWith(undefined);
    });

    it('passes options when provided', async () => {
      const getMethod = jest.fn(async () => permissionGranted);
      const { waitForNextUpdate } = renderHook(
        createPermissionHook({
          getMethod,
          requestMethod: async () => permissionDenied,
        }),
        { initialProps: { get: true, setting: 'something' } }
      );

      await waitForNextUpdate();
      expect(getMethod).toHaveBeenCalledWith(expect.objectContaining({ setting: 'something' }));
    });
  });

  describe('requester', () => {
    it('returns status with requester method', async () => {
      const { result, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionGranted,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: false } }
      );

      act(() => {
        result.current[REQUESTER]();
      });
      await waitForNextUpdate();
      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('returns status with requester option', async () => {
      const { result, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionGranted,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: true } }
      );

      await waitForNextUpdate();
      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('returns status with requester option after rerender', async () => {
      const { result, rerender, waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod: async () => permissionGranted,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: false } }
      );

      rerender({ request: true });
      await waitForNextUpdate();
      expect(result.current[STATUS]).toBe(permissionGranted);
    });

    it('omits options when not provided', async () => {
      const requestMethod = jest.fn(async () => permissionGranted);
      const { waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: true } }
      );

      await waitForNextUpdate();
      expect(requestMethod).toHaveBeenCalledWith(undefined);
    });

    it('passes options when provided', async () => {
      const requestMethod = jest.fn(async () => permissionGranted);
      const { waitForNextUpdate } = renderHook(
        createPermissionHook({
          requestMethod,
          getMethod: async () => permissionDenied,
        }),
        { initialProps: { request: true, setting: 'something' } }
      );

      await waitForNextUpdate();
      expect(requestMethod).toHaveBeenCalledWith(expect.objectContaining({ setting: 'something' }));
    });
  });
});
