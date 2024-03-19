import { mockConnection } from './testUtilts';
import { PageReloadHandler } from '../PageReload';

it('broadcasts reload message', () => {
  const connection = mockConnection();
  const bundler = { broadcastMessage: jest.fn() };
  const handler = new PageReloadHandler(connection, bundler as any);

  expect(
    handler.handleDebuggerMessage({
      id: 420,
      method: 'Page.reload',
      params: { ignoreCache: false },
    })
  ).toBe(true);

  expect(bundler.broadcastMessage).toBeCalledWith('reload');
  expect(connection.debugger.sendMessage).toBeCalledWith(expect.objectContaining({ id: 420 }));
});
