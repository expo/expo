import { mockConnection } from './testUtilts';
import { getDebuggerType } from '../../getDebuggerType';
import type { DebuggerRequest } from '../../types';
import {
  type RuntimeGetProperties,
  VscodeRuntimeGetPropertiesHandler,
} from '../VscodeRuntimeGetProperties';

jest.mock('../../getDebuggerType', () => ({
  ...jest.requireActual('../../getDebuggerType'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('is enabled when debugger has vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');
  const handler = new VscodeRuntimeGetPropertiesHandler(mockConnection());
  expect(handler.isEnabled()).toBe(true);
});

it('is disabled when debugger doesnt have vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('unknown');
  const handler = new VscodeRuntimeGetPropertiesHandler(mockConnection());
  expect(handler.isEnabled()).toBe(false);
});

it('mutates `Runtime.getProperties` device response with `description` properties', () => {
  const connection = mockConnection();
  const handler = new VscodeRuntimeGetPropertiesHandler(connection);
  const message: DebuggerRequest<RuntimeGetProperties> = {
    id: 420,
    method: 'Runtime.getProperties',
    params: { objectId: '1337' },
  };

  // This message should still be propagated
  expect(handler.handleDebuggerMessage(message)).toBe(false);

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
  expect(handler.handleDeviceMessage({ id: 420, result: descriptors })).toBe(false);
  // Expect the descriptor values to be mutated
  expect(descriptors.result[0].value).toHaveProperty('description', '');
  expect(descriptors.result[1].value).toHaveProperty('description', 'Dont overwrite');
});

it('mutates `Runtime.getProperties` device responses and removes `objectId` from symbol types', () => {
  const connection = mockConnection();
  const handler = new VscodeRuntimeGetPropertiesHandler(connection);
  const message: DebuggerRequest<RuntimeGetProperties> = {
    id: 420,
    method: 'Runtime.getProperties',
    params: { objectId: '1337' },
  };

  // This message should still be propagated, it should return `false`
  expect(handler.handleDebuggerMessage(message)).toBe(false);

  // The handler mutates the properties, we need to keep a reference
  const descriptors: RuntimeGetProperties['result'] = {
    result: [
      {
        name: 'bar',
        configurable: true,
        enumerable: true,
        value: { type: 'symbol', description: 'Symbol(bar)', objectId: '1337' },
      },
    ],
  };

  // This message should still be propagated, it should return `false`
  expect(handler.handleDeviceMessage({ id: 420, result: descriptors })).toBe(false);
  // Expect the descriptor value to be mutated
  expect(descriptors.result[0].value).not.toHaveProperty('objectId');
});
