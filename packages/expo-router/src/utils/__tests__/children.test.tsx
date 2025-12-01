import React, { Children } from 'react';

import {
  filterAllowedChildrenElements,
  getAllChildrenNotOfType,
  getAllChildrenOfType,
  getFirstChildOfType,
  isChildOfType,
} from '../children';

const A: React.FC<{ label?: string }> = () => <div />;
const B: React.FC<{ label?: string }> = () => <span />;
class C extends React.Component {
  render() {
    return <p />;
  }
}

describe(filterAllowedChildrenElements, () => {
  it('filterAllowedChildrenElements returns only elements of allowed component types (preserves order)', () => {
    const children = [
      <A label="a1" />,
      <B label="b1" />,
      <C label="c1" />,
      null,
      undefined,
      false,
      'text',
      123,
    ];

    const filtered = filterAllowedChildrenElements(children, [A, C]);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].type).toBe(A);
    expect(filtered[1].type).toBe(C);
  });

  it('filterAllowedChildrenElements accepts a single child', () => {
    const single = <A />;
    const filtered = filterAllowedChildrenElements(single, [A]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe(A);
  });

  it('filterAllowedChildrenElements does not match components by shape, only by reference', () => {
    // another component with same render as A but different reference
    const AClone: React.FC = () => <div />;
    const children = [<A label="a1" />, <AClone label="a2" />];

    const filtered = filterAllowedChildrenElements(children, [AClone]);
    // only AClone should match
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe(AClone);
  });
});

describe(isChildOfType, () => {
  it('returns true for matching function component', () => {
    expect(isChildOfType(<A />, A)).toBe(true);
  });

  it('returns false for non-matching function component', () => {
    expect(isChildOfType(<A />, B)).toBe(false);
  });

  it('returns true for matching class component', () => {
    expect(isChildOfType(<C />, C)).toBe(true);
  });

  it('returns false for plain DOM elements or non-elements', () => {
    expect(isChildOfType(<div />, A)).toBe(false);
    expect(isChildOfType('string', A)).toBe(false);
    expect(isChildOfType(null, A)).toBe(false);
    expect(isChildOfType(undefined, A)).toBe(false);
  });
});

describe('getFirstChildOfType', () => {
  it('returns the first matching child', () => {
    const children = [<B label="b1" />, <A label="a1" />, <A label="a2" />];
    const result = getFirstChildOfType(children, A);
    expect(result).toBeDefined();
    expect(result?.props.label).toBe('a1');
  });

  it('returns undefined when no match found', () => {
    const children = [<B label="b1" />, <B label="b2" />];
    const result = getFirstChildOfType(children, A);
    expect(result).toBeUndefined();
  });

  it('handles single child', () => {
    const result = getFirstChildOfType(<A />, A);
    expect(result).toBeDefined();
    expect(result?.type).toBe(A);
  });
});

describe('getAllChildrenOfType', () => {
  it('returns all matching children', () => {
    const children = [<A label="a1" />, <B label="b1" />, <A label="a2" />, <C label="c1" />];
    const result = getAllChildrenOfType(children, A);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe(A);
    expect(result[1].type).toBe(A);
  });

  it('returns empty array when no matches', () => {
    const children = [<B label="b1" />, <C label="c1" />];
    const result = getAllChildrenOfType(children, A);
    expect(result).toEqual([]);
  });

  it('filters out non-element children', () => {
    const children = [<A label="a1" />, null, 'text', <A label="a2" />, undefined];
    const result = getAllChildrenOfType(children, A);
    expect(result).toHaveLength(2);
  });
});

describe('getAllChildrenNotOfType', () => {
  it('returns all children except matching type', () => {
    const children = [<A label="a1" />, <B label="b1" />, <C label="c1" />, <A label="a2" />];
    const result = getAllChildrenNotOfType(children, A);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe(B);
    expect(result[1].type).toBe(C);
  });

  it('returns all children when type does not match any', () => {
    const children = [<B label="b1" />, <C label="c1" />];
    const result = getAllChildrenNotOfType(children, A);
    expect(result).toHaveLength(2);
  });

  it.only('includes non-element children in result', () => {
    const children = [<A label="a1" />, null, 'text', 123, undefined];
    const result = getAllChildrenNotOfType(children, A);
    // Null and undefined are filtered out by Children.toArray
    expect(Children.toArray(children)).toHaveLength(3);
    expect(result).toEqual(['text', 123]);
  });

  it('returns empty array when all children match type', () => {
    const children = [<A label="a1" />, <A label="a2" />];
    const result = getAllChildrenNotOfType(children, A);
    expect(result).toEqual([]);
  });
});
