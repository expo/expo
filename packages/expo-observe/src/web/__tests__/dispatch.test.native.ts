import { dispatch, setDispatchBundleDefaults, setDispatchConfig } from '../dispatch';

it('is a no-op on native, where the native module dispatches', async () => {
  const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(jest.fn());

  setDispatchBundleDefaults({ environment: 'production', isJsDev: false });
  setDispatchConfig({ web: true });
  await expect(dispatch()).resolves.toBeUndefined();

  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});
