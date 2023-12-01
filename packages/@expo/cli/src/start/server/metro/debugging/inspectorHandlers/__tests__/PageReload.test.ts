import { PageReloadHandler } from '../PageReload';

it('broadcasts reload message', () => {
  const bundler = { broadcastMessage: jest.fn() };
  const handler = new PageReloadHandler(bundler as any);
  const socket = { send: jest.fn() };

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Page.reload',
        params: { ignoreCache: false },
      },
      { socket }
    )
  ).toBe(true);

  expect(bundler.broadcastMessage).toBeCalledWith('reload');
  expect(socket.send).toBeCalledWith(JSON.stringify({ id: 420 }));
});
