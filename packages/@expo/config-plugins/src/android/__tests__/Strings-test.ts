import { buildResourceItem } from '../Resources';
import { setStringItem } from '../Strings';

describe(setStringItem, () => {
  it('add item from empty xml', () => {
    const results = setStringItem([buildResourceItem({ name: 'foo', value: 'foo' })], {
      resources: {},
    });
    expect(results).toEqual({
      resources: { string: [{ $: { name: 'foo' }, _: 'foo' }] },
    });
  });

  it('support adding multiple items', () => {
    const results = setStringItem(
      [
        buildResourceItem({ name: 'foo', value: 'foo' }),
        buildResourceItem({ name: 'bar', value: 'bar' }),
      ],
      {
        resources: {},
      }
    );
    expect(results).toEqual({
      resources: {
        string: [
          { $: { name: 'foo' }, _: 'foo' },
          { $: { name: 'bar' }, _: 'bar' },
        ],
      },
    });
  });

  it('override existing item', () => {
    const results = setStringItem(
      [buildResourceItem({ name: 'foo', value: 'bar', translatable: false })],
      {
        resources: { string: [{ $: { name: 'foo' }, _: 'foo' }] },
      }
    );
    expect(results).toEqual({
      resources: { string: [{ $: { name: 'foo', translatable: 'false' }, _: 'bar' }] },
    });
  });
});
