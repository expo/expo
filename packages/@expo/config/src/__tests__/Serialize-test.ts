import {
  serializeAfterStaticPlugins,
  serializeAndEvaluate,
  serializeSkippingMods,
} from '../Serialize';

describe('serializeAndEvaluate', () => {
  it(`serializes item`, () => {
    expect(
      serializeAndEvaluate({
        foo: 'bar',
        boo: true,
        inn: 200,
        then: [true, { foo: 'bar' }],
        alpha: () => ({ beta: ['val'] }),
        last: {
          bar: 'foo',
          charlie: [2, 'delta'],
        },
      })
    ).toMatchSnapshot();
  });
});

describe.each([
  ['serializeAndEvaluate', serializeAndEvaluate],
  ['serializeSkippingMods', serializeSkippingMods],
  ['serializeAfterStaticPlugins', serializeAfterStaticPlugins],
])('%s prototype protection', (_name, serialize) => {
  it('serializes null-prototype objects with an own hasOwnProperty value', () => {
    const props = Object.assign(Object.create(null), { hasOwnProperty: 'data' });
    const input = Object.assign(Object.create(null), {
      extra: props,
      plugins: [['expo-font', props]],
    });

    expect(serialize(input)).toEqual({
      extra: { hasOwnProperty: 'data' },
      plugins: [['expo-font', { hasOwnProperty: 'data' }]],
    });
  });

  it('ignores an own __proto__ property', () => {
    const input = JSON.parse('{"__proto__":{"injected":true},"safe":true}');

    const output = serialize(input);

    expect(output).toEqual({ safe: true });
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(output, '__proto__')).toBe(false);
    expect('injected' in output).toBe(false);
  });

  it('ignores __proto__ properties nested inside arrays', () => {
    const input = JSON.parse('{"extra":{"items":[{"__proto__":{"injected":true},"safe":true}]}}');

    const output = serialize(input);
    const item = output.extra.items[0];

    expect(item).toEqual({ safe: true });
    expect(Object.getPrototypeOf(item)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(item, '__proto__')).toBe(false);
    expect('injected' in item).toBe(false);
  });
});

it('ignores __proto__ properties when serializing plugin props', () => {
  const input = JSON.parse(
    '{"plugins":[["expo-font",{"__proto__":{"injected":true},"safe":true}]]}'
  );

  const output = serializeAfterStaticPlugins(input);
  const props = output.plugins[0][1];

  expect(props).toEqual({ safe: true });
  expect(Object.getPrototypeOf(props)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(props, '__proto__')).toBe(false);
  expect('injected' in props).toBe(false);
});
