import {
  insertContentsAtOffset,
  replaceContentsWithOffset,
  searchFromOffset,
} from '../commonCodeMod';

describe(insertContentsAtOffset, () => {
  it('should insert in the middle', () => {
    expect(insertContentsAtOffset('aabbcc', 'dd', 4)).toEqual('aabbddcc');
  });

  it('should insert at the head', () => {
    expect(insertContentsAtOffset('aabbcc', 'dd', 0)).toEqual('ddaabbcc');
  });

  it('should insert at the tail', () => {
    expect(insertContentsAtOffset('aabbcc', 'dd', 6)).toEqual('aabbccdd');
  });

  it('should throw for boundary errors', () => {
    expect(() => {
      insertContentsAtOffset('aabbcc', 'dd', -1);
    }).toThrow();
    expect(() => {
      insertContentsAtOffset('aabbcc', 'dd', 999);
    }).toThrow();
  });
});

describe(replaceContentsWithOffset, () => {
  it('should support replacement in the middle', () => {
    expect(replaceContentsWithOffset('abc', 'd', 1, 1)).toEqual('adc');
    expect(replaceContentsWithOffset('aabbcc', '', 2, 3)).toEqual('aacc');
    expect(replaceContentsWithOffset('aabbcc', 'dd', 2, 3)).toEqual('aaddcc');
    expect(replaceContentsWithOffset('aabbcc', 'ExtendString', 2, 3)).toEqual('aaExtendStringcc');
  });

  it('should throw for boundary errors', () => {
    expect(() => {
      replaceContentsWithOffset('aabbcc', 'dd', -1, -1);
    }).toThrow();
    expect(() => {
      replaceContentsWithOffset('aabbcc', 'dd', 0, 999);
    }).toThrow();
    expect(() => {
      replaceContentsWithOffset('aabbcc', 'dd', 2, 1);
    }).toThrow();
  });
});

describe(searchFromOffset, () => {
  it('should return matched index + offset', () => {
    expect(searchFromOffset('aabbaabb', /aabb/, 0)).toBe(0);
    expect(searchFromOffset('aabbaabb', /aabb/, 2)).toBe(4);
  });

  it('should return -1 if not found', () => {
    expect(searchFromOffset('aabbaabb', /cc/, 2)).toBe(-1);
  });

  it('should return -1 if offset out of bound', () => {
    expect(searchFromOffset('aabbaabb', /cc/, 100)).toBe(-1);
  });
});
