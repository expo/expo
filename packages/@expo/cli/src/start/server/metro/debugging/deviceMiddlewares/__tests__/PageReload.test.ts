import { mockConnection } from './testUtilts';
import { PageReloadMiddleware } from '../PageReload';

it('broadcasts reload message', () => {
  const connection = mockConnection();
  const bundler = { broadcastMessage: jest.fn() };
  const handler = new PageReloadMiddleware(connection, bundler as any);

  expect(
    handler.handleDebuggerMessage({
      id: 420,
      method: 'Page.reload',
      params: { ignoreCache: false },
    })
  ).toBe(true);

  expect(bundler.broadcastMessage).toBeCalledWith('reload');
  expect(connection.debuggerInfo.socket.send).toBeCalledWith(JSON.stringify({ id: 420 }));
});
