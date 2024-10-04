import { createInspectorDeviceClass } from '../device';
import { NetworkResponseHandler } from '../handlers/NetworkResponse';
import { PageReloadHandler } from '../handlers/PageReload';
import { VscodeDebuggerGetPossibleBreakpointsHandler } from '../handlers/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerScriptParsedHandler } from '../handlers/VscodeDebuggerScriptParsed';
import { VscodeDebuggerSetBreakpointByUrlHandler } from '../handlers/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeGetPropertiesHandler } from '../handlers/VscodeRuntimeGetProperties';
import { InspectorHandler } from '../handlers/types';

describe('ExpoInspectorDevice', () => {
  it('initializes with default handlers', () => {
    const { device } = createTestDevice();

    function findHandler<T extends Function>(type: T) {
      return device.handlers.find((handler) => handler instanceof type);
    }

    expect(findHandler(NetworkResponseHandler)).toBeTruthy();
    expect(findHandler(PageReloadHandler)).toBeTruthy();
    expect(findHandler(VscodeDebuggerGetPossibleBreakpointsHandler)).toBeTruthy();
    expect(findHandler(VscodeDebuggerScriptParsedHandler)).toBeTruthy();
    expect(findHandler(VscodeDebuggerSetBreakpointByUrlHandler)).toBeTruthy();
    expect(findHandler(VscodeRuntimeGetPropertiesHandler)).toBeTruthy();
  });

  describe('device', () => {
    it('handles known device messages', () => {
      const { device, MetroDevice } = createTestDevice();
      const handler: InspectorHandler = { onDeviceMessage: jest.fn().mockReturnValue(true) };
      device.handlers = [handler];

      device._processMessageFromDevice(
        { method: 'Network.responseReceived', params: { requestId: 420 } },
        jest.fn() // debugger info mock
      );

      expect(handler.onDeviceMessage).toBeCalled();
      // Expect the message is NOT propagated to original handlers
      expect(MetroDevice.prototype._processMessageFromDevice).not.toBeCalled();
    });

    it('does not handle unknown device messages', () => {
      const { device, MetroDevice } = createTestDevice();
      const handler: InspectorHandler = { onDeviceMessage: jest.fn().mockReturnValue(false) };
      device.handlers = [handler];

      device._processMessageFromDevice(
        { method: 'Network.responseReceived', params: { requestId: 420 } },
        jest.fn() // debugger info mock
      );

      expect(handler.onDeviceMessage).toBeCalled();
      // Expect the message is propagated to original handlers
      expect(MetroDevice.prototype._processMessageFromDevice).toBeCalled();
    });

    it('does not handle without handlers', () => {
      const { device, MetroDevice } = createTestDevice();
      device.handlers = [];

      device._processMessageFromDevice(
        { method: 'Network.responseReceived', params: { requestId: 420 } },
        jest.fn() // debugger info mock
      );

      // Expect the message is propagated to original handlers
      expect(MetroDevice.prototype._processMessageFromDevice).toBeCalled();
    });
  });

  describe('debugger', () => {
    it('intercepts known debugger messages', () => {
      const { device, MetroDevice } = createTestDevice();
      const handler: InspectorHandler = { onDebuggerMessage: jest.fn().mockReturnValue(true) };
      device.handlers = [handler];

      const handled = device._interceptMessageFromDebugger(
        { id: 420, method: 'Network.getResponseBody', params: { requestId: 420 } },
        jest.fn(), // debugger info mock
        jest.fn() as any // socket mock
      );

      expect(handled).toBe(true);
      expect(handler.onDebuggerMessage).toBeCalled();
      // Expect the message is NOT propagated to original handlers
      expect(MetroDevice.prototype._interceptMessageFromDebugger).not.toBeCalled();
    });

    it('does not intercept unknown debugger messages', () => {
      const { device, MetroDevice } = createTestDevice();
      const handler: InspectorHandler = { onDebuggerMessage: jest.fn().mockReturnValue(false) };
      device.handlers = [handler];

      const handled = device._interceptMessageFromDebugger(
        { id: 420, method: 'Network.getResponseBody', params: { requestId: 420 } },
        jest.fn(), // debugger info mock
        jest.fn() as any // socket mock
      );

      expect(handled).not.toBe(true);
      expect(handler.onDebuggerMessage).toBeCalled();
      // Expect the message is propagated to original handlers
      expect(MetroDevice.prototype._interceptMessageFromDebugger).toBeCalled();
    });

    it('does not intercept without handlers', () => {
      const { device, MetroDevice } = createTestDevice();
      device.handlers = [];

      const handled = device._interceptMessageFromDebugger(
        { id: 420, method: 'Network.getResponseBody', params: { requestId: 420 } },
        jest.fn(), // debugger info mock
        jest.fn() as any // socket mock
      );

      expect(handled).not.toBe(true);
      // Expect the message is propagated to original handlers
      expect(MetroDevice.prototype._interceptMessageFromDebugger).toBeCalled();
    });
  });
});

/** Create a test device instance without extending the Metro device */
function createTestDevice() {
  const metroBundler: any = { broadcastMessage: jest.fn() };
  class MetroDevice {
    _processMessageFromDevice() {}
    _interceptMessageFromDebugger() {}
  }

  // Dynamically replace these functions with mocks, doesn't work from class declaration
  MetroDevice.prototype._processMessageFromDevice = jest.fn();
  MetroDevice.prototype._interceptMessageFromDebugger = jest.fn();

  const ExpoDevice = createInspectorDeviceClass(metroBundler, MetroDevice);
  const device = new ExpoDevice();

  return { ExpoDevice, MetroDevice, device, metroBundler };
}
