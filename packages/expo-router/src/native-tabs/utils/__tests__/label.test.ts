import { convertLabelStylePropToObject } from '../label';

describe(convertLabelStylePropToObject, () => {
  it('returns {} for undefined', () => {
    expect(convertLabelStylePropToObject(undefined)).toEqual({});
  });

  it('returns {} for null', () => {
    expect(convertLabelStylePropToObject(null)).toEqual({});
  });

  it('returns equal object when it already has default and selected keys', () => {
    const input = {
      default: { color: 'red' },
      selected: { color: 'blue' },
    };
    const result = convertLabelStylePropToObject(input);
    expect(result).toStrictEqual(input);
    expect(result.default).toStrictEqual(input.default);
    expect(result.selected).toStrictEqual(input.selected);
  });

  it('returns strict equal object with selected filed when it has only default key', () => {
    const input = { default: { fontSize: 12 } };
    const result = convertLabelStylePropToObject(input);
    expect(result).toStrictEqual({ default: input.default, selected: undefined });
  });

  it('returns strict equal object with default filed when it has only selected key', () => {
    const input = { selected: { fontWeight: '700' } } as const;
    const result = convertLabelStylePropToObject(input);
    expect(result).toStrictEqual({ default: undefined, selected: input.selected });
  });

  it('wraps a plain style object into default when it lacks default/selected', () => {
    const plainStyle = { color: 'green', padding: 4 };
    const result = convertLabelStylePropToObject(plainStyle);
    expect(result).toEqual({ default: plainStyle });
    // ensure it did not return the same reference (should wrap)
    expect(result).not.toBe(plainStyle);
  });

  it('wraps an array style into default', () => {
    const arrayStyle = [{ color: 'a' }, { margin: 1 }];
    const result = convertLabelStylePropToObject(arrayStyle);
    expect(result).toEqual({ default: { color: 'a', margin: 1 } });
  });
});
