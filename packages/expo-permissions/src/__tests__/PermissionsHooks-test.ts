import { renderHook, act } from '@testing-library/react-hooks';

import * as Permissions from '../Permissions';
import { usePermissions } from '../PermissionsHooks';

const DATA = 0;
const ASK = 1;
const GET = 2;

const response: any = { status: 'granted' };

it('returns data, ask and get callbacks when mounted', async () => {
  const hook = renderHook(() => usePermissions(Permissions.CAMERA, { get: false }));

  expect(hook.result.current[DATA]).toBeUndefined();
  expect(hook.result.current[ASK]).toBeInstanceOf(Function);
  expect(hook.result.current[GET]).toBeInstanceOf(Function);
});

it('accepts multiple permission types', async () => {
  const asker = jest.spyOn(Permissions, 'askAsync').mockResolvedValue(response);

  const permissions = [
    Permissions.CAMERA,
    Permissions.MEDIA_LIBRARY,
  ] as Permissions.PermissionType[];
  const hook = renderHook(() => usePermissions(permissions, { get: false }));
  await act(() => hook.result.current[ASK]());

  expect(asker).toBeCalledWith(...permissions);
});

describe('ask callback', () => {
  it('updates data with ask callback', async () => {
    jest.spyOn(Permissions, 'askAsync').mockResolvedValue(response);

    const hook = renderHook(() => usePermissions(Permissions.CAMERA, { get: false }));
    await act(() => hook.result.current[ASK]());

    expect(hook.result.current[DATA]).toMatchObject(response);
  });

  it('uses the same ask callback when rerendered', async () => {
    const hook = renderHook(() => usePermissions(Permissions.CAMERA, { get: false }));
    const asker = hook.result.current[ASK];
    hook.rerender();

    expect(asker).toBe(hook.result.current[ASK]);
  });

  it('uses the same ask callback for multiple permissions when rerendered', async () => {
    const permissions = [
      Permissions.CAMERA,
      Permissions.MEDIA_LIBRARY,
    ] as Permissions.PermissionType[];

    const hook = renderHook(() => usePermissions(permissions, { get: false }));
    const asker = hook.result.current[ASK];
    hook.rerender();

    expect(asker).toBe(hook.result.current[ASK]);
  });
});

describe('ask option', () => {
  it('asks the permissions when mounted', async () => {
    const asker = jest.spyOn(Permissions, 'askAsync').mockResolvedValue(response);

    const hook = renderHook(() => usePermissions(Permissions.CAMERA, { ask: true }));
    await hook.waitForNextUpdate();

    expect(asker).toBeCalledWith(Permissions.CAMERA);
    expect(hook.result.current[DATA]).toMatchObject(response);
  });

  it('asks the permissions when rerendered', async () => {
    const asker = jest.spyOn(Permissions, 'askAsync').mockResolvedValue(response);

    const hook = renderHook(
      (permissions) => usePermissions(permissions, { get: false, ask: false }),
      { initialProps: [Permissions.CAMERA] as Permissions.PermissionType[] }
    );
    hook.rerender([Permissions.CAMERA, Permissions.MEDIA_LIBRARY]);
    await act(() => hook.result.current[ASK]());

    expect(asker).toBeCalledWith(Permissions.CAMERA, Permissions.MEDIA_LIBRARY);
    expect(hook.result.current[DATA]).toMatchObject(response);
  });
});

describe('get callback', () => {
  it('updates data with get callback', async () => {
    jest.spyOn(Permissions, 'getAsync').mockResolvedValue(response);

    const hook = renderHook(() => usePermissions(Permissions.CAMERA, { get: false }));
    await act(() => hook.result.current[GET]());

    expect(hook.result.current[DATA]).toMatchObject(response);
  });

  it('uses the same get callback when rerendered', async () => {
    const hook = renderHook(() => usePermissions(Permissions.CAMERA, { get: false }));
    const getter = hook.result.current[GET];
    hook.rerender();

    expect(getter).toBe(hook.result.current[GET]);
  });

  it('uses the same get callback for multiple permissions when rerendered', async () => {
    const permissions = [
      Permissions.CAMERA,
      Permissions.MEDIA_LIBRARY,
    ] as Permissions.PermissionType[];
    const hook = renderHook(() => usePermissions(permissions, { get: false }));
    const getter = hook.result.current[GET];
    hook.rerender();

    expect(getter).toBe(hook.result.current[GET]);
  });
});

describe('get option', () => {
  it('gets the permissions when mounted', async () => {
    const getter = jest.spyOn(Permissions, 'getAsync').mockResolvedValue(response);

    const hook = renderHook(() => usePermissions(Permissions.CAMERA, { get: true }));
    await hook.waitForNextUpdate();

    expect(getter).toBeCalledWith(Permissions.CAMERA);
    expect(hook.result.current[DATA]).toMatchObject(response);
  });

  it('gets the permissions when rerendered', async () => {
    const getter = jest.spyOn(Permissions, 'getAsync').mockResolvedValue(response);

    const hook = renderHook((permissions) => usePermissions(permissions, { get: false }), {
      initialProps: [Permissions.CAMERA] as Permissions.PermissionType[],
    });
    hook.rerender([Permissions.CAMERA, Permissions.MEDIA_LIBRARY]);
    await act(() => hook.result.current[GET]());

    expect(getter).toBeCalledWith(Permissions.CAMERA, Permissions.MEDIA_LIBRARY);
    expect(hook.result.current[DATA]).toMatchObject(response);
  });
});
