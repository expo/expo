import React from 'react';

import { filterAllowedChildrenElements, isChildOfType } from '../children';

const A: React.FC<{ label?: string }> = () => <div />;
const B: React.FC = () => <span />;
class C extends React.Component {
  render() {
    return <p />;
  }
}

describe(filterAllowedChildrenElements, () => {
  it('filterAllowedChildrenElements returns only elements of allowed component types (preserves order)', () => {
    const children = [
      <A key="a1" />,
      <B key="b1" />,
      <C key="c1" />,
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
    const children = [<A key="a1" />, <AClone key="a2" />];

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
