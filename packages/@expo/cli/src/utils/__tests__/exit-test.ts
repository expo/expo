import { installExitHooks } from '../exit';

it('attaches and removes process listeners', () => {
  jest.spyOn(process, 'on');
  jest.spyOn(process, 'removeListener');

  const fn = jest.fn();

  expect(process.on).not.toBeCalled();

  const unsub = installExitHooks(fn);
  const unsub2 = installExitHooks(jest.fn());

  expect(process.on).toHaveBeenCalledTimes(4);
  expect(process.on).toHaveBeenNthCalledWith(1, 'SIGHUP', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(2, 'SIGINT', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(3, 'SIGTERM', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(4, 'SIGBREAK', expect.any(Function));

  expect(process.removeListener).not.toBeCalled();

  // Unsub the first listener, this won't remove the other listeners.
  unsub();
  expect(process.removeListener).not.toBeCalled();

  // Unsub the second listener, this will remove the other listeners.
  unsub2();
  expect(process.removeListener).toBeCalledTimes(4);
});
