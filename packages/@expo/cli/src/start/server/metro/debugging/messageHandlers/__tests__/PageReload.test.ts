import { mockConnection } from '../../__tests__/mockConnection';
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

  expect(bundler.broadcastMessage).toHaveBeenCalledWith('reload');
  expect(connection.debugger.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({ id: 420 })
  );
});
