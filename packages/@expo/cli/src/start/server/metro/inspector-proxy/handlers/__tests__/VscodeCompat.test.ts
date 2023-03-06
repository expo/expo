import { DeviceRequest } from '../types';
import { DebuggerPaused, RuntimeGetProperties, VscodeCompatHandler } from '../VscodeCompat';

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  const handler = new VscodeCompatHandler();
  const debuggerSocket = { send: jest.fn() };

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getPossibleBreakpoints',
        params: {
          start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
        },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  expect(debuggerSocket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: { locations: [] },
    })
  );
});

it('mutates `Runtime.getProperties` device response with `description` properties', () => {
  const handler = new VscodeCompatHandler();
  const debuggerSocket = { send: jest.fn() };

  // This message should still be propagated, it should return `false`
  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Runtime.getProperties',
        params: { objectId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(false);

  // The handler mutates the properties, we need to keep a reference
  const descriptors: RuntimeGetProperties['result'] = {
    result: [
      {
        name: 'foo',
        configurable: true,
        enumerable: true,
        value: { type: 'function' },
      },
      {
        name: 'bar',
        configurable: true,
        enumerable: true,
        value: { type: 'string', description: 'Dont overwrite' },
      },
    ],
  };

  // This message should still be propagated, it should return `false`
  expect(handler.onDeviceMessage({ id: 420, result: descriptors })).toBe(false);
  // Expect the descriptor values to be mutated
  expect(descriptors.result[0].value).toHaveProperty('description', '');
  expect(descriptors.result[1].value).toHaveProperty('description', 'Dont overwrite');
});

it('mutates `Debugger.paused` callFrames without Hermes native function frames', () => {
  const handler = new VscodeCompatHandler();

  // Copied from an actual `Debugger.paused` message, first one should be filtered
  const message: DeviceRequest<DebuggerPaused> = {
    method: 'Debugger.paused',
    params: {
      reason: 'debugCommand',
      callFrames: [
        {
          callFrameId: '23',
          functionName: '(native)',
          location: { scriptId: '4294967295', lineNumber: 0 },
          url: '',
          this: { type: 'object', objectId: '48' },
          scopeChain: [
            { type: 'global', object: { type: 'object', className: 'Object', objectId: '47' } },
          ],
        },
        {
          callFrameId: '27',
          functionName: 'callFunctionReturnFlushedQueue',
          location: { scriptId: '3', lineNumber: 2571, columnNumber: 20 },
          url: '',
          this: { type: 'object', objectId: '56' },
          scopeChain: [
            { type: 'global', object: { type: 'object', className: 'Object', objectId: '55' } },
          ],
        },
      ],
    },
  };

  // This message should still be propagated, it should return `false`
  expect(handler.onDeviceMessage(message)).toBe(false);
  // Expect the first callFrame to be filtered
  expect(message.params.callFrames).toHaveLength(1);
  expect(message.params.callFrames[0]).toMatchObject({ callFrameId: '27' });
});
