import {
  RuntimeGetProperties,
  VscodeRuntimeGetPropertiesHandler,
} from '../VscodeRuntimeGetProperties';

it('mutates `Runtime.getProperties` device response with `description` properties', () => {
  const handler = new VscodeRuntimeGetPropertiesHandler();

  // This message should still be propagated, it should return `false`
  expect(
    handler.onDebuggerMessage({
      id: 420,
      method: 'Runtime.getProperties',
      params: { objectId: '1337' },
    })
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

it('mutates `Runtime.getProperties` device responses and removes `objectId` from symbol types', () => {
  const handler = new VscodeRuntimeGetPropertiesHandler();

  // This message should still be propagated, it should return `false`
  expect(
    handler.onDebuggerMessage({
      id: 420,
      method: 'Runtime.getProperties',
      params: { objectId: '1337' },
    })
  ).toBe(false);

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
  expect(handler.onDeviceMessage({ id: 420, result: descriptors })).toBe(false);
  // Expect the descriptor value to be mutated
  expect(descriptors.result[0].value).not.toHaveProperty('objectId');
});
