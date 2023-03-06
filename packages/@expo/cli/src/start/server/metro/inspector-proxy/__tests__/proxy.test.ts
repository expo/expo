import { InspectorProxy as MetroProxy } from 'metro-inspector-proxy';

import { ExpoInspectorProxy as ExpoProxy } from '../proxy';

describe(ExpoProxy, () => {
  it('shares devices with metro proxy', () => {
    const { expoProxy, metroProxy } = createTestProxy();
    expect(metroProxy._devices).toBe(expoProxy.devices);
  });

  it('forwards `processRequest` to metro proxy', () => {
    const { expoProxy, metroProxy } = createTestProxy();
    const spy = jest.spyOn(metroProxy, 'processRequest');
    const ctx = {
      req: jest.fn() as any,
      res: jest.fn() as any,
      next: jest.fn(),
    };

    expoProxy.processRequest(ctx.req, ctx.res, ctx.next);
    expect(spy).toBeCalledWith(ctx.req, ctx.res, ctx.next);
  });

  // TODO(cedric): add tests for `createWebSocketListeners`, using a mocked websocket
});

function createTestProxy() {
  class ExpoDevice {}
  const metroProxy = new MetroProxy();
  const expoProxy = new ExpoProxy(metroProxy, ExpoDevice);

  return { ExpoDevice, metroProxy, expoProxy };
}
