import { serializeAndEvaluate } from '../Serialize';

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
